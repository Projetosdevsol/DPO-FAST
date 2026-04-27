import 'dotenv/config';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ai } from './config';
import { getUserPlan, hasPermission } from './lib/subscription';

// Agentes
import { discoveryFlow } from './agents/discovery';
import { suggestionFlow } from './agents/suggestion';
import { draftingFlow } from './agents/drafting';
import { auditorFlow } from './agents/auditor';
import { consultantFlow } from './agents/consultant';

/**
 * Configuração global de CORS
 * Permitindo especificamente o localhost para evitar bloqueios em desenvolvimento
 */
const functionOptions = {
  secrets: ['GOOGLE_GENAI_API_KEY'],
  cors: [/localhost:3000$/, /lgpd-facil-b7246\.web\.app$/],
  region: 'southamerica-east1',
  maxInstances: 10,
  invoker: 'public', // Tenta forçar a permissão pública no deploy (depende da versão da CLI)
};

export const discovery = onCall(functionOptions, async (request) => {
  return await discoveryFlow(request.data);
});

export const suggestion = onCall(functionOptions, async (request) => {
  return await suggestionFlow(request.data);
});

export const drafting = onCall(functionOptions, async (request) => {
  const { userId } = request.data;
  const plan = await getUserPlan(userId);
  if (!hasPermission(plan, 'execution')) {
    throw new HttpsError('permission-denied', 'A geração de documentos é exclusiva do plano Personalité.');
  }
  return await draftingFlow(request.data);
});

export const auditor = onCall(functionOptions, async (request) => {
  return await auditorFlow(request.data);
});

/**
 * AGENTE 5: CONSULTOR (CHAT ASSISTANT)
 */
export const consultant = onCall(functionOptions, async (request) => {
  try {
    console.log('Iniciando atendimento no Consultor para o usuário:', request.data.userId);
    const result = await consultantFlow(request.data);
    return result;
  } catch (error: any) {
    console.error('Erro crítico no Consultor:', error);
    // Retorna o erro formatado para o Firebase SDK entender
    throw new HttpsError('internal', error.message || 'Falha na inteligência do Agente Consultor');
  }
});

// Mantém o processo ativo para o Genkit UI local
if (process.env.GENKIT_ENV === 'dev' || !process.env.FUNCTIONS_EMULATOR) {
  setInterval(() => {}, 1000 * 60 * 60); 
}
