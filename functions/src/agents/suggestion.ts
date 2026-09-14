import { z } from 'zod';
import { genai, MODEL } from '../config';
import { getUserPlan, hasPermission } from '../lib/subscription';
import { getCompanyContext, checkExistingDocs } from '../lib/tools';

export const SuggestionInputSchema = z.object({
  userId: z.string(),
  gapsIdentified: z.array(z.string()),
});

export const SuggestionOutputSchema = z.object({
  suggestionText: z.string(),
  actionLabel: z.string(),
  actionId: z.string(),
  isoStandard: z.string().optional(),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
});

// TODO(security-debt): input.userId é confiável APENAS porque index.ts:31
// valida request.auth.uid === userId antes de invocar. Não replicar este
// padrão em novos handlers — usar ctx.tenantId injetado como em consultant.ts.
// Issue: DPO-XXX (abrir no tracker) — tech-debt/security, bloquear go-live F5
export async function suggestionHandler(input: z.infer<typeof SuggestionInputSchema>): Promise<z.infer<typeof SuggestionOutputSchema>> {
  const plan = await getUserPlan(input.userId);

  if (!hasPermission(plan, 'suggestion')) {
    return {
      suggestionText: "Sua análise identificou pontos importantes! Para receber sugestões personalizadas de como resolver esses gaps, faça o upgrade para o plano Pro.",
      actionLabel: "Ver Planos Pro",
      actionId: "upgrade_pro",
      priority: "Média" as const
    };
  }

  // Busca contexto diretamente
  const company = await getCompanyContext(input.userId);
  const docs = await checkExistingDocs(input.userId);

  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [{
        text: `Com base nestas lacunas identificadas: ${input.gapsIdentified.join(', ')}.

Contexto da empresa:
- Nome: ${company.businessName}
- CNPJ: ${company.cnpj}
- Setor: ${company.sector}
- Documentos já existentes: ${docs.existingDocs.join(', ') || 'Nenhum'}

Sua tarefa é sugerir UMA única ação prioritária e específica.
Seja muito pessoal (use o nome da empresa) e técnico (cite normas como ISO 27001 ou 27701 se aplicável).

Responda APENAS com JSON válido seguindo este formato:
{
  "suggestionText": "sugestão detalhada",
  "actionLabel": "texto do botão",
  "actionId": "id_da_acao",
  "isoStandard": "ISO 27001 (opcional)",
  "priority": "Baixa|Média|Alta"
}`,
      }],
    }],
    config: {
      systemInstruction: 'Você é o Agente de Sugestão LGPD. Responda apenas com JSON válido.',
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const parsed = JSON.parse(text);

  if (!parsed.suggestionText) {
    throw new Error('Falha ao gerar sugestão pela IA.');
  }

  return parsed;
}
