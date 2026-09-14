import { z } from 'zod';
import { genai, MODEL } from '../config';
import { getCompanyContext } from '../lib/tools';

export const draftingInputSchema = z.object({
  userId: z.string(),
  documentType: z.enum(['LIA', 'RIPD', 'Termo de Uso', 'Politica de Privacidade', 'Termo de Consentimento']),
  specificContext: z.string().max(2000, "O contexto específico não deve ultrapassar 2000 caracteres.").optional(),
});

const TEMPLATES = {
  'Termo de Consentimento': "Baseado na LGPD, este documento deve conter: Finalidade específica, Forma e Duração do tratamento, Identificação do controlador e Direitos do titular.",
  'LIA': "Legitimate Interest Assessment: Descrição do interesse legítimo, teste de necessidade e teste de balanceamento.",
  'Termo de Uso': "Regras de utilização da plataforma, responsabilidades e propriedade intelectual.",
};

// TODO(security-debt): input.userId é confiável APENAS porque index.ts:31
// valida request.auth.uid === userId antes de invocar. Não replicar este
// padrão em novos handlers — usar ctx.tenantId injetado como em consultant.ts.
// Issue: DPO-XXX (abrir no tracker) — tech-debt/security, bloquear go-live F5
export async function draftingHandler(input: z.infer<typeof draftingInputSchema>) {
  const company = await getCompanyContext(input.userId);
  const templateBase = TEMPLATES[input.documentType as keyof typeof TEMPLATES] || "Template padrão LGPD";

  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [{
        text: `Gere um rascunho completo de um ${input.documentType}.
Contexto legal de base: ${templateBase}
Detalhes adicionais fornecidos: ${input.specificContext || 'Nenhum'}.
O documento deve ser formatado em Markdown claro.`,
      }],
    }],
    config: {
      systemInstruction: `Você é o Agente de Redação Jurídica do Guardião.
Sua especialidade: Redigir documentos de conformidade LGPD para PMEs.
Tom de voz: Formal, técnico mas acessível, e extremamente preciso.
Use o contexto da empresa (CNPJ: ${company.cnpj}, Setor: ${company.sector}) para personalizar o texto.`,
    },
  });

  return {
    draftContent: response.text || 'Falha ao gerar documento.',
    version: "1.0",
    status: "pending_review",
  };
}
