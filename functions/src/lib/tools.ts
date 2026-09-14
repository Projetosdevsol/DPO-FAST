import { db } from '../config';
import { getStorage } from 'firebase-admin/storage';
import { FunctionDeclaration, Type } from '@google/genai';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Tool: Busca contexto detalhado da empresa no Firestore.
 * tenantId é sempre request.auth.uid — nunca vindo do LLM.
 */
export async function getCompanyContext(tenantId: string) {
  const userDoc = await db.collection('users').doc(tenantId).get();
  const data = userDoc.data();

  if (!data || !data.company) {
    return { cnpj: 'Não informado', businessName: 'Empresa Sem Nome', sector: 'Geral' };
  }

  return {
    cnpj: data.company.cnpj || 'Não informado',
    businessName: data.company.name || 'Empresa Sem Nome',
    sector: data.company.sector || 'Geral',
  };
}

/**
 * Tool: Verifica documentos existentes no Firebase Storage.
 */
export async function checkExistingDocs(tenantId: string) {
  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: `companies/${tenantId}/docs/` });

  const docNames = files.map(file => {
    const parts = file.name.split('/');
    return parts[parts.length - 1];
  });

  return { existingDocs: docNames };
}

/**
 * Tool: Busca resumo de conformidade do usuário.
 */
export async function getComplianceSummary(tenantId: string) {
  const userDoc = await db.collection('users').doc(tenantId).get();
  const data = userDoc.data();

  const bucket = getStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: `companies/${tenantId}/docs/` });

  return {
    companyName: data?.company?.name || 'Não informada',
    plan: data?.subscription?.plan || 'Basic',
    docsCount: files.length,
    pendingGaps: data?.lastDiagnosis?.criticalGaps?.map((g: any) => g.issue) || [],
    maturityLevel: data?.lastDiagnosis?.maturityLevel || 'Não avaliado',
  };
}

/**
 * Definição das functions para function calling do Gemini
 * Nenhuma tool expõe userId/tenantId — isolamento é por ctx injetado no handler.
 */
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_company_context',
    description: 'Busca detalhes como CNPJ, Nome Fantasia e Setor da Empresa do usuário autenticado. Não requer parâmetros.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'check_existing_docs',
    description: 'Verifica se a empresa do usuário autenticado já possui documentos específicos enviados no Storage. Não requer parâmetros.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_compliance_summary',
    description: 'Busca o resumo de tudo que a empresa do usuário autenticado já preencheu, documentos enviados e gaps pendentes. Use sempre no início da conversa para entender o status do usuário. Não requer parâmetros.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
];

/**
 * Executa uma tool pelo nome — tenantId vem exclusivamente de request.auth.uid via ctx.
 * Qualquer tentativa de injetar userId/tenantId via args é rejeitada e logada.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { tenantId: string }
) {
  const safeArgs = args ?? {};
  if ('userId' in safeArgs || 'tenantId' in safeArgs) {
    console.error(
      JSON.stringify({
        event: 'security.tool_arg_injection',
        tool: name,
        injectedArgs: safeArgs,
        callerTenant: ctx.tenantId,
        timestamp: Date.now(),
      })
    );
    throw new HttpsError('invalid-argument', 'Tool args must not contain tenant identifiers');
  }

  switch (name) {
    case 'get_company_context':
      return await getCompanyContext(ctx.tenantId);
    case 'check_existing_docs':
      return await checkExistingDocs(ctx.tenantId);
    case 'get_compliance_summary':
      return await getComplianceSummary(ctx.tenantId);
    default:
      throw new HttpsError('not-found', `Tool desconhecida: ${name}`);
  }
}
