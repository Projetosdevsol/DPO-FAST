import 'dotenv/config';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ai, db } from './config';
import { getUserPlan, hasPermission } from './lib/subscription';

// Agentes
import { discoveryFlow } from './agents/discovery';
import { suggestionFlow } from './agents/suggestion';
import { draftingFlow } from './agents/drafting';
import { auditorFlow } from './agents/auditor';
import { consultantFlow } from './agents/consultant';
import { documentGeneratorFlow } from './agents/documentGenerator';

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
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
  return await discoveryFlow(request.data);
});

export const suggestion = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
  return await suggestionFlow(request.data);
});

export const drafting = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
  const plan = await getUserPlan(userId);
  if (!hasPermission(plan, 'execution')) {
    throw new HttpsError('permission-denied', 'A geração de documentos por IA é exclusiva para assinantes.');
  }
  return await draftingFlow(request.data);
});

export const auditor = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  return await auditorFlow(request.data);
});

/**
 * AGENTE 5: CONSULTOR (CHAT ASSISTANT)
 */
export const consultant = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
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

export const generateDocumentFromTemplate = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }

  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }

  // Validação estrita de paywall (PRO ou Personalité E ativo)
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado no banco de dados.');
  }

  const userData = userDoc.data();
  const rawPlan = (userData?.plan || userData?.subscription?.plan || 'free').toLowerCase();
  const statusAssinatura = (userData?.status_assinatura || '').toLowerCase();

  const isPro = ['pro', 'prata'].includes(rawPlan);
  const isPersonalite = ['personalite', 'personalité', 'ouro'].includes(rawPlan);

  if (rawPlan === 'free' || rawPlan === 'basico') {
    throw new HttpsError(
      'permission-denied',
      'Esta funcionalidade é exclusiva para os planos PRO ou Personalité.'
    );
  }

  const hasAccess = isPersonalite || (isPro && (statusAssinatura === 'active' || statusAssinatura === 'trialing' || !statusAssinatura));

  if (!hasAccess) {
    throw new HttpsError(
      'permission-denied',
      'Esta funcionalidade é exclusiva para assinantes ativos dos planos PRO ou Personalité.'
    );
  }

  return await documentGeneratorFlow(request.data);
});

// Mantém o processo ativo para o Genkit UI local
if (process.env.GENKIT_ENV === 'dev' || !process.env.FUNCTIONS_EMULATOR) {
  setInterval(() => {}, 1000 * 60 * 60); 
}
