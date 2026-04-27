import { z } from 'genkit';
import { ai } from '../config';
import { getCompanyContext } from '../lib/tools';

// Esquema de entrada: O que o usuário aprovou para ser gerado
export const draftingInputSchema = z.object({
  userId: z.string(),
  documentType: z.enum(['LIA', 'RIPD', 'Termo de Uso', 'Politica de Privacidade', 'Termo de Consentimento']),
  specificContext: z.string().optional(),
});

// Prompts de Base (Templates simplificados para a IA expandir)
const TEMPLATES = {
  'Termo de Consentimento': "Baseado na LGPD, este documento deve conter: Finalidade específica, Forma e Duração do tratamento, Identificação do controlador e Direitos do titular.",
  'LIA': "Legitimate Interest Assessment: Descrição do interesse legítimo, teste de necessidade e teste de balanceamento.",
  'Termo de Uso': "Regras de utilização da plataforma, responsabilidades e propriedade intelectual.",
};

export const draftingFlow = ai.defineFlow(
  {
    name: 'drafting',
    inputSchema: draftingInputSchema,
    outputSchema: z.object({
      draftContent: z.string(),
      version: z.string(),
      status: z.string(),
    }),
  },
  async (input) => {
    // 1. Busca contexto da empresa para personalizar
    const company = await getCompanyContext({ userId: input.userId });
    const templateBase = TEMPLATES[input.documentType as keyof typeof TEMPLATES] || "Template padrão LGPD";

    // 2. Redação Profissional
    const response = await ai.generate({
      system: `Você é o Agente de Redação Jurídica do DPO Fast. 
      Sua especialidade: Redigir documentos de conformidade LGPD para PMEs.
      Tom de voz: Formal, técnico mas acessível, e extremamente preciso.
      Use o contexto da empresa (CNPJ: ${company.cnpj}, Setor: ${company.sector}) para personalizar o texto.`,
      prompt: `Gere um rascunho completo de um ${input.documentType}.
      Contexto legal de base: ${templateBase}
      Detalhes adicionais fornecidos: ${input.specificContext || 'Nenhum'}.
      O documento deve ser formatado em Markdown claro.`,
    });

    return {
      draftContent: response.text,
      version: "1.0",
      status: "pending_review",
    };
  }
);
