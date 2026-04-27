import { z } from 'genkit';
import { ai } from '../config';
import { getComplianceSummary, getCompanyContext, checkExistingDocs } from '../lib/tools';

export const consultantInputSchema = z.object({
  userId: z.string(),
  history: z.array(z.any()).optional(),
  message: z.string(),
});

export const consultantFlow = ai.defineFlow(
  {
    name: 'consultant',
    inputSchema: consultantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Na v1.32.0, usamos 'messages' no generate para passar o histórico
    const response = await ai.generate({
      system: `Você é o DPO Assistant da plataforma DPO Fast. 
      Seu objetivo é ser um consultor amigável e proativo que guia o usuário na adequação LGPD.
      Você tem acesso a ferramentas para consultar o status real da empresa do usuário.
      
      Diretrizes:
      1. Comece sempre consultando o 'get_compliance_summary' para saber quem é o usuário e o que falta.
      2. Se o usuário perguntar "O que falta?", use a lista de 'pendingGaps'.
      3. Incentive o usuário a completar os documentos que faltam.
      4. Se ele estiver no plano Basic, sugira o upgrade para o Pro para gerar documentos.
      5. Seja conciso, profissional e use emojis discretos para ser amigável. 🚀`,
      messages: input.history,
      prompt: input.message,
      tools: [getComplianceSummary, getCompanyContext, checkExistingDocs],
    });

    return response.text;
  }
);
