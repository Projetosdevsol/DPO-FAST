import { z } from 'zod';
import { ai } from '../config';
import { getUserPlan, hasPermission } from '../lib/subscription';
import { getCompanyContext, checkExistingDocs } from '../lib/tools';

// Esquema de entrada do Agente de Sugestão
// Recebe as lacunas encontradas pelo Agente de Diagnóstico
export const SuggestionInputSchema = z.object({
  userId: z.string(),
  gapsIdentified: z.array(z.string()),
});

// Esquema de saída para a Interface
export const SuggestionOutputSchema = z.object({
  suggestionText: z.string(),
  actionLabel: z.string(), // Texto do botão (ex: "Gerar Termo de RH")
  actionId: z.string(),    // ID da ação para o backend processar depois
  isoStandard: z.string().optional(),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
});

export const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionOutputSchema,
  },
  async (input) => {
    // 1. Validação de Assinatura (Regra: Apenas Pro e Personalité acessam Sugestão)
    const plan = await getUserPlan(input.userId);
    
    if (!hasPermission(plan, 'suggestion')) {
      return {
        suggestionText: "Sua análise identificou pontos importantes! Para receber sugestões personalizadas de como resolver esses gaps, faça o upgrade para o plano Pro.",
        actionLabel: "Ver Planos Pro",
        actionId: "upgrade_pro",
        priority: "Média" as const
      };
    }

    // 2. Execução do Agente com Tools
    const response = await ai.generate({
      prompt: `Você é o Agente de Sugestão LGPD. 
      ID do Usuário: ${input.userId}
      
      Com base nestas lacunas identificadas: ${input.gapsIdentified.join(', ')}.
      
      IMPORTANTE: Use as ferramentas 'get_company_context' e 'check_existing_docs' passando o ID do usuário acima para entender o contexto da empresa e quais documentos ela já possui.
      
      Sua tarefa é sugerir UMA única ação prioritária e específica.
      Seja muito pessoal (use o nome da empresa retornado pela ferramenta) e técnico (cite normas como ISO 27001 ou 27701 se aplicável).`,
      tools: [getCompanyContext, checkExistingDocs],
      // Passamos o userId no contexto para que as tools possam usá-lo
      config: {
        // Genkit permite passar parâmetros estáticos para as tools aqui se necessário
        // Mas o Gemini decidirá chamar as tools com o userId correto baseado no prompt
      },
      output: { format: 'json', schema: SuggestionOutputSchema }
    });

    if (!response || !response.output) {
      throw new Error('Falha ao gerar sugestão pela IA.');
    }

    return response.output;
  }
);
