import { z } from 'zod';
import { ai } from '../config';
import { validateSubscription } from '../middleware/subscription';

// Esquema de entrada para o Agente de Diagnóstico
export const DiscoveryInputSchema = z.object({
  userId: z.string(),
  companySector: z.string(),
  dataTypesCollected: z.array(z.string()),
  storageMethod: z.string(),
  hasPrivacyPolicy: z.boolean(),
  hasDisposalPolicy: z.boolean(),
});

// Esquema de saída estruturado
export const DiscoveryOutputSchema = z.object({
  maturityLevel: z.enum(['Baixo', 'Médio', 'Alto']),
  criticalGaps: z.array(z.object({
    issue: z.string(),
    risk: z.string(),
    impact: z.enum(['Baixo', 'Médio', 'Alto']),
  })),
  recommendations: z.array(z.string()),
});

export const discoveryFlow = ai.defineFlow(
  {
    name: 'discoveryFlow',
    inputSchema: DiscoveryInputSchema,
    outputSchema: DiscoveryOutputSchema,
  },
  async (input) => {
    // 1. Validação de Assinatura
    const plan = await validateSubscription(input.userId);
    console.log(`Executando diagnóstico para usuário ${input.userId} no plano ${plan}`);

    // 2. Chamada à IA
    const response = await ai.generate({
      prompt: `Você é um consultor jurídico sênior especializado em LGPD para PMEs.
      Analise os seguintes dados de diagnóstico da empresa:
      Setor: ${input.companySector}
      Dados Coletados: ${input.dataTypesCollected.join(', ')}
      Método de Armazenamento: ${input.storageMethod}
      Possui Política de Privacidade: ${input.hasPrivacyPolicy ? 'Sim' : 'Não'}
      Possui Política de Descarte: ${input.hasDisposalPolicy ? 'Sim' : 'Não'}

      Identifique lacunas críticas, avalie o nível de maturidade (Baixo, Médio, Alto) 
      e forneça recomendações iniciais.
      Sua resposta deve ser estritamente em JSON seguindo o esquema definido.`,
      output: { format: 'json', schema: DiscoveryOutputSchema },
    });

    if (!response || !response.output) {
      throw new Error('Falha ao gerar diagnóstico pela IA.');
    }

    return response.output;
  }
);
