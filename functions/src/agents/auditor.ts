import { z } from 'genkit';
import { ai } from '../config';

export const auditorInputSchema = z.object({
  documentContent: z.string(),
  documentType: z.string(),
});

export const auditorFlow = ai.defineFlow(
  {
    name: 'auditor',
    inputSchema: auditorInputSchema,
    outputSchema: z.object({
      approved: z.boolean(),
      critique: z.array(z.string()),
      suggestions: z.string(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      system: `Você é o Agente de Revisão (Compliance Auditor) do DPO Fast.
      Sua tarefa é criticar e validar documentos gerados para conformidade com a LGPD.
      Seja rigoroso. Identifique cláusulas faltantes, termos ambíguos ou riscos legais.`,
      prompt: `Analise o seguinte ${input.documentType}:
      ---
      ${input.documentContent}
      ---
      Liste pontos críticos que faltam e sugira melhorias. Se o documento estiver perfeito, marque como aprovado.`,
      output: {
        schema: z.object({
          approved: z.boolean(),
          critique: z.array(z.string()),
          suggestions: z.string(),
        })
      }
    });

    const output = response.output;
    if (!output) throw new Error("Falha na auditoria");
    return output;
  }
);
