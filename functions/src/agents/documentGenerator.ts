import { z } from 'zod';
import { genai, MODEL, db } from '../config';
import * as fs from 'fs';
import * as path from 'path';

export const DocumentGeneratorInputSchema = z.object({
  userId: z.string(),
  sectorId: z.string(),
  templateName: z.enum(['LIA', 'RIPD', 'Politica de Privacidade', 'Termos de Uso', 'Termo de Consentimento']),
});

const TEMPLATE_MAP: Record<string, string> = {
  'LIA': '05_33_AVALIAÇÃO LEGÍTIMO INTERESSE.md',
  'RIPD': '04_28_ Modelo de Relatório de Impacto às atividades.md',
  'Politica de Privacidade': '02_02_POLÍTICA DE PRIVACIDADE SITE.md',
  'Termos de Uso': '02_03_TERMOS DE USO.md',
  'Termo de Consentimento': '06_44_Termo_Consentimento_Candidato_ATS.md'
};

export async function documentGeneratorHandler(input: z.infer<typeof DocumentGeneratorInputSchema>) {
  const { userId, sectorId, templateName } = input;

  // 1. Obter respostas do questionário
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

  // 2. Carregar template
  const fileName = TEMPLATE_MAP[templateName];
  if (!fileName) {
    throw new Error(`Template ${templateName} não está mapeado.`);
  }

  const possiblePaths = [
    path.resolve(__dirname, '../templates', fileName),
    path.resolve(__dirname, '../../templates', fileName),
    path.resolve(__dirname, '../../.genkit/templates', fileName),
    path.resolve(__dirname, '../../../.genkit/templates', fileName),
    path.resolve(process.cwd(), '.genkit/templates', fileName),
    path.resolve(process.cwd(), 'functions/.genkit/templates', fileName),
  ];

  let templateContent = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      templateContent = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!templateContent) {
    throw new Error(`Arquivo do template ${fileName} não foi encontrado.`);
  }

  // 3. Gerar documento com IA
  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [{
        text: `Aqui está o template do documento (${templateName}):
---
${templateContent}
---

Aqui estão os dados reais do mapeamento do setor "${sectorInfo.name}":
${JSON.stringify(sectorInfo, null, 2)}

Gere o documento final completo em formato Markdown, pronto para uso.`,
      }],
    }],
    config: {
      systemInstruction: `Você é o DPO virtual do Guardião, especialista em LGPD.
Sua tarefa é redigir um documento de adequação personalizado com base em um template padrão e nas respostas de mapeamento de dados de um setor específico de uma empresa.
Mantenha a estrutura, cláusulas e rigor técnico do template fornecido, mas preencha todas as variáveis, colchetes, campos em branco e informações relevantes com os dados reais do setor.
Caso falte alguma informação específica nas respostas, infira algo coerente com as melhores práticas da LGPD ou indique claramente entre colchetes a necessidade de preenchimento posterior.`,
    },
  });

  const documentContent = response.text || '';

  // 4. Salvar no Firestore
  const documentRef = db.collection('users').doc(userId).collection('documents').doc();
  const docData = {
    id: documentRef.id,
    title: `${templateName} - Setor ${sectorInfo.name}`,
    content: documentContent,
    templateName,
    sectorId,
    sectorName: sectorInfo.name,
    createdAt: new Date().toISOString(),
  };

  await documentRef.set(docData);

  return {
    documentContent,
    title: docData.title,
    createdAt: docData.createdAt,
  };
}
