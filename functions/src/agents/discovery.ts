import { z } from 'zod';
import { genai, MODEL } from '../config';
import { validateSubscription } from '../middleware/subscription';

export const DiscoveryInputSchema = z.object({
  userId: z.string(),
  companySector: z.string(),
  dataTypesCollected: z.array(z.string()),
  storageMethod: z.string(),
  hasPrivacyPolicy: z.boolean(),
  hasDisposalPolicy: z.boolean(),
});

export const DiscoveryOutputSchema = z.object({
  maturityLevel: z.enum(['Baixo', 'Médio', 'Alto']),
  criticalGaps: z.array(z.object({
    issue: z.string(),
    risk: z.string(),
    impact: z.enum(['Baixo', 'Médio', 'Alto']),
  })),
  recommendations: z.array(z.string()),
});

// TODO(security-debt): input.userId é confiável APENAS porque index.ts:31
// valida request.auth.uid === userId antes de invocar. Não replicar este
// padrão em novos handlers — usar ctx.tenantId injetado como em consultant.ts.
// Issue: DPO-XXX (abrir no tracker) — tech-debt/security, bloquear go-live F5
export async function discoveryHandler(input: z.infer<typeof DiscoveryInputSchema>): Promise<z.infer<typeof DiscoveryOutputSchema>> {
  const plan = await validateSubscription(input.userId);
  console.log(`Executando diagnóstico para usuário ${input.userId} no plano ${plan}`);

  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [{
        text: `Analise os seguintes dados de diagnóstico da empresa:
Setor: ${input.companySector}
Dados Coletados: ${input.dataTypesCollected.join(', ')}
Método de Armazenamento: ${input.storageMethod}
Possui Política de Privacidade: ${input.hasPrivacyPolicy ? 'Sim' : 'Não'}
Possui Política de Descarte: ${input.hasDisposalPolicy ? 'Sim' : 'Não'}

Identifique lacunas críticas, avalie o nível de maturidade (Baixo, Médio, Alto)
e forneça recomendações iniciais.

Responda APENAS com JSON válido seguindo este formato:
{
  "maturityLevel": "Baixo| Médio| Alto",
  "criticalGaps": [{"issue": "...", "risk": "...", "impact": "Baixo| Médio| Alto"}],
  "recommendations": ["..."]
}`,
      }],
    }],
    config: {
      systemInstruction: 'Você é um consultor jurídico sênior especializado em LGPD para PMEs. Responda apenas com JSON válido.',
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const parsed = JSON.parse(text);

  if (!parsed.maturityLevel) {
    throw new Error('Falha ao gerar diagnóstico pela IA.');
  }

  return parsed;
}
