import 'dotenv/config';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from './config';
import { getUserPlan, hasPermission } from './lib/subscription';
import { validateCnpjAlgorithm } from './lib/cnpjValidator';
import { getCachedCnpj, setCachedCnpj, isRateLimited } from './lib/cnpjCache';
import { runCnpjStatusAudit } from './cron/cnpjStatusCheck';

// Agentes
import { discoveryHandler } from './agents/discovery';
import { suggestionHandler } from './agents/suggestion';
import { draftingHandler } from './agents/drafting';
import { auditorHandler, auditorInputSchema } from './agents/auditor';
import { consultantHandler, consultantInputSchema } from './agents/consultant';
import { documentGeneratorHandler } from './agents/documentGenerator';
import { assertProAccess } from './lib/planGate';
import { deleteUserAccountHandler, deleteUserAccountSchema } from './agents/admin';

// Evidências (determinístico, sem IA)
export { ropaSync } from './triggers/ropaSync';
import {
  criarTaskHandler, submeterEvidenciaHandler, aprovarEvidenciaHandler,
  rejeitarEvidenciaHandler, getEvidenciaDownloadUrlHandler
} from './agents/evidencia';
import { criarTaskSchema, submeterSchema, avaliarSchema, downloadUrlSchema } from './agents/evidencia';

// G4: warmup RAG no cold-start (não bloqueia boot)
import { warmup } from './lib/rag/retriever';
warmup().then(n => console.log(`[warmup] RAG ${n} chunks`)).catch(e => console.warn('[warmup] falhou', e?.message));

const functionOptions = {
  secrets: ['GOOGLE_GENAI_API_KEY', 'GROQ_API_KEY'],
  cors: [/localhost/, /lgpd-facil-b7246\.web\.app$/],
  region: 'southamerica-east1',
  maxInstances: 10,
  invoker: 'public',
};

export const discovery = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
  return await discoveryHandler(request.data);
});

export const suggestion = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }
  return await suggestionHandler(request.data);
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
  return await draftingHandler(request.data);
});

export const auditor = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const tenantId = request.auth.uid;
  const parsed = auditorInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await auditorHandler({ tenantId, ...parsed.data });
});

export const consultant = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const tenantId = request.auth.uid;

  const parsed = consultantInputSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  try {
    console.log('Iniciando atendimento no Consultor para o tenant:', tenantId);
    const result: any = await consultantHandler({ tenantId, ...parsed.data });
    // G6 compat: frontend DPOAssistant.tsx espera string (result.data as string)
    // consultantHandler retorna {text, findings, reasoning} — extrai text
    if (result && typeof result === 'object' && typeof result.text === 'string') return result.text;
    if (typeof result === 'string') return result;
    return result?.reasoning ?? String(result ?? '');
  } catch (error: any) {
    console.error('Erro crítico no Consultor:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Falha na inteligência do Agente Consultor');
  }
});

export const deleteUserAccount = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }
  const parsed = deleteUserAccountSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }
  return await deleteUserAccountHandler({ ...parsed.data, callerUid: request.auth.uid });
});

export const generateDocumentFromTemplate = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }

  const { userId } = request.data;
  if (request.auth.uid !== userId) {
    throw new HttpsError('permission-denied', 'Operação não autorizada para este identificador de usuário.');
  }

  // Gate único PRO+ (planGate espelha a regra anterior; fonte: users/{uid})
  await assertProAccess(userId);

  const ip =
    (request.rawRequest as any)?.ip ??
    (request.rawRequest?.headers as any)?.['x-forwarded-for'] ??
    undefined;

  try {
    return await documentGeneratorHandler({ ...request.data, ip });
  } catch (e: any) {
    if (e instanceof HttpsError) throw e;
    const msg = String(e?.message || 'Falha ao gerar documento');
    console.error('[generateDocumentFromTemplate]', msg.slice(0, 300));
    if (/não encontrado/i.test(msg)) throw new HttpsError('not-found', msg);
    throw new HttpsError('unavailable', msg);
  }
});

// ---------------------------------------------------------------------------
// VALIDAÇÃO DE CNPJ
// ---------------------------------------------------------------------------

const cnpjFunctionOptions = {
  cors: [/localhost/, /lgpd-facil-b7246\.web\.app$/],
  region: 'southamerica-east1',
  maxInstances: 5,
  invoker: 'public' as const,
};

export const validateCnpj = onCall(cnpjFunctionOptions, async (request) => {
  const ip = request.rawRequest?.ip || 'unknown';

  if (isRateLimited(ip)) {
    throw new HttpsError(
      'resource-exhausted',
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    );
  }

  const { cnpj } = request.data as { cnpj: string };

  if (!cnpj || typeof cnpj !== 'string') {
    throw new HttpsError('invalid-argument', 'CNPJ não informado.');
  }

  const cleanCnpj = cnpj.replace(/\D/g, '');

  const algoResult = validateCnpjAlgorithm(cleanCnpj);
  if (!algoResult.valid) {
    throw new HttpsError('invalid-argument', algoResult.reason || 'CNPJ inválido.');
  }

  const cached = getCachedCnpj(cleanCnpj);
  if (cached) {
    console.log(`[validateCnpj] Cache HIT: ${cleanCnpj}`);
    if (cached.status !== 'ATIVA') {
      throw new HttpsError(
        'failed-precondition',
        `Este CNPJ consta como "${cached.status}" na Receita Federal e não pode ser utilizado para cadastro.`
      );
    }
    return { valid: true, companyName: cached.companyName };
  }

  try {
    console.log(`[validateCnpj] Cache MISS — consultando BrasilAPI: ${cleanCnpj}`);
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      throw new HttpsError('not-found', 'CNPJ não encontrado na base da Receita Federal.');
    }

    if (!response.ok) {
      throw new HttpsError(
        'unavailable',
        'Serviço de validação temporariamente indisponível. Tente novamente em alguns instantes.'
      );
    }

    const data = await response.json() as { status: string; razao_social?: string; nome_fantasia?: string };

    const companyName = data.razao_social || data.nome_fantasia || '';
    const status = (data.status || '').toUpperCase();

    setCachedCnpj(cleanCnpj, { status, companyName });

    if (status !== 'ATIVA') {
      const statusMessage: Record<string, string> = {
        'BAIXADA':    'Este CNPJ consta como baixado (encerrado) na Receita Federal.',
        'SUSPENSA':   'Este CNPJ está com situação irregular (suspenso) na Receita Federal.',
        'INAPTA':     'Este CNPJ está inapto na Receita Federal.',
        'NULA':       'Este CNPJ foi declarado nulo pela Receita Federal.',
      };
      const msg = statusMessage[status]
        ?? `Este CNPJ consta como "${status}" na Receita Federal e não pode ser utilizado para cadastro.`;
      throw new HttpsError('failed-precondition', msg);
    }

    return { valid: true, companyName };

  } catch (err: any) {
    if (err instanceof HttpsError) throw err;

    console.error('[validateCnpj] Erro ao consultar BrasilAPI:', err);
    throw new HttpsError(
      'unavailable',
      'Serviço de validação temporariamente indisponível. Tente novamente em alguns instantes.'
    );
  }
});

export const checkCnpjStatusCron = onSchedule(
  {
    schedule: '0 9 * * 1',
    region: 'southamerica-east1',
    timeZone: 'America/Sao_Paulo',
    maxInstances: 1,
  },
  async (event) => {
    await runCnpjStatusAudit();
  }
);

export const triggerCnpjStatusAuditManually = onCall(functionOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'O usuário deve estar autenticado.');
  }

  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new HttpsError('permission-denied', 'Apenas administradores podem iniciar a auditoria manualmente.');
  }

  const result = await runCnpjStatusAudit();
  return result;
});

// --- Módulo Evidências (sem IA) ---
const evidenciaOptions = { ...functionOptions, secrets: [] as string[] };

export const criarTaskEvidencia = onCall(evidenciaOptions, async (req)=>{
  if(!req.auth) throw new HttpsError('unauthenticated','');
  const tenantId = req.auth.uid;
  const parsed = criarTaskSchema.safeParse(req.data);
  if(!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  return await criarTaskHandler({ tenantId, ...parsed.data });
});

export const submeterEvidencia = onCall(evidenciaOptions, async (req)=>{
  if(!req.auth) throw new HttpsError('unauthenticated','');
  const tenantId = req.auth.uid;
  const parsed = submeterSchema.safeParse(req.data);
  if(!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  return await submeterEvidenciaHandler({ tenantId, ...parsed.data });
});

export const aprovarEvidencia = onCall(evidenciaOptions, async (req)=>{
  if(!req.auth) throw new HttpsError('unauthenticated','');
  const tenantId = (req.data.tenantId as string) || req.auth.uid;
  const parsed = avaliarSchema.safeParse(req.data);
  if(!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  const ip = (req.rawRequest as any)?.ip ?? (req.rawRequest?.headers as any)?.['x-forwarded-for'] ?? null;
  return await aprovarEvidenciaHandler({ tenantId, uid: req.auth.uid, ip, ...parsed.data });
});

export const rejeitarEvidencia = onCall(evidenciaOptions, async (req)=>{
  if(!req.auth) throw new HttpsError('unauthenticated','');
  const tenantId = (req.data.tenantId as string) || req.auth.uid;
  const parsed = avaliarSchema.safeParse(req.data);
  if(!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  const ip = (req.rawRequest as any)?.ip ?? (req.rawRequest?.headers as any)?.['x-forwarded-for'] ?? null;
  return await rejeitarEvidenciaHandler({ tenantId, uid: req.auth.uid, ip, ...parsed.data });
});

export const getEvidenciaDownloadUrl = onCall(evidenciaOptions, async (req)=>{
  if(!req.auth) throw new HttpsError('unauthenticated','');
  const tenantId = (req.data.tenantId as string) || req.auth.uid;
  const parsed = downloadUrlSchema.safeParse(req.data);
  if(!parsed.success) throw new HttpsError('invalid-argument', parsed.error.message);
  return await getEvidenciaDownloadUrlHandler({ tenantId, uid: req.auth.uid, ...parsed.data });
});
