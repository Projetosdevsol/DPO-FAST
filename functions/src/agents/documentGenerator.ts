import { z } from 'zod';
import { HttpsError } from 'firebase-functions/v2/https';
import { genai, MODEL, db, callGroqWithFallback } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { logAudit, hashArquivo } from '../lib/auditLog';
import {
  interpolate,
  validateInterpolation,
  normalizeBrackets,
} from '../lib/documentTemplates';

export const DocumentGeneratorInputSchema = z.object({
  userId: z.string(),
  sectorId: z.string().optional(),
  // Modo legado (generativo via LLM) — mantém compat com IADocumentGenerator.tsx
  templateName: z
    .enum(['LIA', 'RIPD', 'Politica de Privacidade', 'Termos de Uso', 'Termo de Consentimento'])
    .optional(),
  // Modo determinístico (novo) — interpolação {{var}} sobre document_templates
  templateId: z.string().min(1).max(100).optional(),
  valoresVariaveis: z.record(z.string(), z.unknown()).optional(),
  mode: z.enum(['deterministico', 'generativo']).optional(),
  ip: z.string().max(45).optional(),
}).passthrough();

const TEMPLATE_MAP: Record<string, string> = {
  'LIA': '05_33_AVALIAÇÃO LEGÍTIMO INTERESSE.md',
  'RIPD': '04_28_ Modelo de Relatório de Impacto às atividades.md',
  'Politica de Privacidade': '02_02_POLÍTICA DE PRIVACIDADE SITE.md',
  'Termos de Uso': '02_03_TERMOS DE USO.md',
  'Termo de Consentimento': '06_44_Termo_Consentimento_Candidato_ATS.md'
};

type HandlerInput = z.infer<typeof DocumentGeneratorInputSchema>;

async function loadLegacyTemplate(templateName: string): Promise<string> {
  const fileName = TEMPLATE_MAP[templateName];
  if (!fileName) throw new Error(`Template ${templateName} não está mapeado.`);

  const possiblePaths = [
    path.resolve(__dirname, '../templates', fileName),
    path.resolve(__dirname, '../../templates', fileName),
    path.resolve(__dirname, '../../.genkit/templates', fileName),
    path.resolve(__dirname, '../../../.genkit/templates', fileName),
    path.resolve(process.cwd(), '.genkit/templates', fileName),
    path.resolve(process.cwd(), 'functions/.genkit/templates', fileName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  throw new Error(`Arquivo do template ${fileName} não foi encontrado.`);
}

/** Auto-fill a partir de users/{uid} + questionnaire (ROPA) — mesma fonte do modo generativo. */
async function buildAutoFill(userId: string, sectorId?: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {
    data_atual: new Date().toLocaleDateString('pt-BR'),
  };
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    const u = userSnap.data() as any;
    if (u?.companyName) out['empresa_nome'] = String(u.companyName);
    if (u?.company?.name) out['empresa_nome'] = String(u.company.name);
    if (u?.cnpj) out['cnpj'] = String(u.cnpj);
    if (u?.company?.cnpj) out['cnpj'] = String(u.company.cnpj);
    if (u?.email) out['dpo_email'] = String(u.email);
    if (u?.company?.email) out['dpo_email'] = String(u.company.email);
    if (u?.company?.dpo_name) out['encarregado_nome'] = String(u.company.dpo_name);
  } catch { /* autofill parcial é aceitável; validateInterpolation pega o resto */ }

  if (sectorId) {
    try {
      const qSnap = await db.collection('questionnaires').doc(userId).get();
      const sectors = (qSnap.data() as any)?.sectors || [];
      const sector = sectors.find((s: any) => s.id === sectorId);
      if (sector?.name) out['setor_nome'] = String(sector.name);
      const firstProcess = sector?.processes?.[0];
      if (firstProcess?.answers?.retentionPeriod) {
        out['prazo_retencao'] = String(firstProcess.answers.retentionPeriod);
      }
      if (firstProcess?.answers?.legalBasis) {
        out['base_legal'] = String(firstProcess.answers.legalBasis);
      }
    } catch { /* idem */ }
  }
  return out;
}

async function saveAndAudit(
  userId: string,
  title: string,
  content: string,
  meta: Record<string, unknown>,
  ip?: string,
): Promise<{ documentContent: string; title: string; createdAt: string }> {
  const documentRef = db.collection('users').doc(userId).collection('documents').doc();
  const docData = {
    id: documentRef.id,
    title,
    content,
    createdAt: new Date().toISOString(),
    ...meta,
  };
  await documentRef.set(docData);

  // Trilha imutável Art.37 (best-effort: nunca quebra a geração)
  try {
    await logAudit({
      tenantId: userId,
      task_id: documentRef.id,
      acao: 'GERACAO_DOCUMENTO',
      uid_avaliador: userId,
      ip,
      payload: { title, template: (meta as any)?.templateName ?? (meta as any)?.templateId },
      arquivo_hash: hashArquivo(content),
    });
  } catch (e) {
    console.warn('[documentGenerator] audit falhou (best-effort)', (e as Error)?.message);
  }

  return { documentContent: content, title, createdAt: docData.createdAt as string };
}

export async function documentGeneratorHandler(input: HandlerInput) {
  const { userId, sectorId, templateName, templateId, valoresVariaveis, mode, ip } = input;
  const wantDeterministic = mode === 'deterministico' || (!!templateId && !templateName);

  // ---- Modo determinístico: document_templates + interpolação ----
  if (wantDeterministic) {
    if (!templateId) throw new Error('templateId é obrigatório no modo deterministico.');
    const tplSnap = await db.doc(`document_templates/${templateId}`).get();
    if (!tplSnap.exists) throw new Error(`Template ${templateId} não encontrado em document_templates.`);
    const tpl = tplSnap.data() as any;
    const versao = tpl?.versoes?.[0];
    if (!versao?.conteudoMarkdown) throw new Error(`Template ${templateId} sem conteúdo.`);

    const auto = await buildAutoFill(userId, sectorId);
    const valores: Record<string, unknown> = { ...auto, ...(valoresVariaveis || {}) };
    const filled = interpolate(String(versao.conteudoMarkdown), valores);
    validateInterpolation(filled); // trava anti-resíduo — passo 3

    return saveAndAudit(
      userId,
      `${tpl.titulo || templateId} - ${new Date().toLocaleDateString('pt-BR')}`,
      filled,
      { templateId, categoria: tpl.categoria, mode: 'deterministico', sectorId: sectorId || null },
      ip,
    );
  }

  // ---- Modo generativo legado (LLM) — mantém compat IADocumentGenerator ----
  if (!templateName) {
    throw new Error('Informe templateName (modo generativo) ou templateId (modo deterministico).');
  }
  if (!sectorId) throw new Error('sectorId é obrigatório no modo generativo.');

  const questionnaireDoc = await db.collection('questionnaires').doc(userId).get();
  if (!questionnaireDoc.exists) {
    throw new Error('Mapeamento (questionário) do usuário não encontrado.');
  }

  const qData = questionnaireDoc.data();
  const sectors = qData?.sectors || [];
  const targetSector = sectors.find((s: any) => s.id === sectorId);

  if (!targetSector) {
    throw new Error(`Setor com ID ${sectorId} não encontrado nos mapeamentos.`);
  }

  const sectorInfo = {
    name: targetSector.name,
    status: targetSector.status,
    processes: (targetSector.processes || []).map((p: any) => ({
      name: p.name,
      description: p.description,
      status: p.status,
      answers: p.answers || null,
    })),
  };

  const templateContent = await loadLegacyTemplate(templateName);
  // Normaliza [EMPRESA] -> {{empresa_nome}} antes de enviar ao LLM para consistência
  const normalizedTemplate = normalizeBrackets(templateContent);

  const systemInstruction = `Você é o DPO virtual do Guardião, especialista em LGPD.
Sua tarefa é redigir um documento de adequação personalizado com base em um template padrão e nas respostas de mapeamento de dados de um setor específico de uma empresa.
Mantenha a estrutura, cláusulas e rigor técnico do template fornecido, mas preencha todas as variáveis, colchetes, campos em branco e informações relevantes com os dados reais do setor.
Caso falte alguma informação específica nas respostas, infira algo coerente com as melhores práticas da LGPD ou indique claramente entre colchetes a necessidade de preenchimento posterior.`;
  const userPrompt = `Aqui está o template do documento (${templateName}):
---
${normalizedTemplate}
---

Aqui estão os dados reais do mapeamento do setor "${sectorInfo.name}":
${JSON.stringify(sectorInfo, null, 2)}

Gere o documento final completo em formato Markdown, pronto para uso.`;

  // Gemini primário, Groq fallback (mesmo padrão do consultant) — evita INTERNAL 500
  let documentContent = '';
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: { systemInstruction },
    });
    documentContent = response.text || '';
  } catch (e: any) {
    const geminiErr = e?.message ?? String(e);
    console.warn('[documentGenerator] Gemini falhou, tentando Groq', geminiErr.slice(0, 150));
    try {
      documentContent = await callGroqWithFallback(userPrompt, systemInstruction);
    } catch (ge: any) {
      throw new HttpsError(
        'unavailable',
        `Provedores de IA indisponíveis (Gemini/Groq). Tente novamente. Detalhe: ${String(ge?.message ?? ge).slice(0, 200)}`
      );
    }
  }

  if (!documentContent.trim()) {
    throw new HttpsError('unavailable', 'Modelo retornou documento vazio. Tente novamente.');
  }

  return saveAndAudit(
    userId,
    `${templateName} - Setor ${sectorInfo.name}`,
    documentContent,
    { templateName, sectorId, sectorName: sectorInfo.name, mode: 'generativo' },
    ip,
  );
}
