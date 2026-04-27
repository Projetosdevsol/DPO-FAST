import { z } from 'zod';
import { ai, db } from '../config';
import { getStorage } from 'firebase-admin/storage';

/**
 * Tool: Busca contexto detalhado da empresa no Firestore.
 */
export const getCompanyContext = ai.defineTool(
  {
    name: 'get_company_context',
    description: 'Busca detalhes como CNPJ, Nome Fantasia e Setor da Empresa no Firestore.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
      cnpj: z.string().optional(),
      businessName: z.string(),
      sector: z.string(),
    }),
  },
  async (input) => {
    const userDoc = await db.collection('users').doc(input.userId).get();
    const data = userDoc.data();
    
    if (!data || !data.company) {
      throw new Error('Dados da empresa não encontrados.');
    }

    return {
      cnpj: data.company.cnpj || 'Não informado',
      businessName: data.company.name || 'Empresa Sem Nome',
      sector: data.company.sector || 'Geral',
    };
  }
);

/**
 * Tool: Verifica documentos existentes no Firebase Storage.
 */
export const checkExistingDocs = ai.defineTool(
  {
    name: 'check_existing_docs',
    description: 'Verifica no Storage se a empresa já possui documentos específicos enviados.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
      existingDocs: z.array(z.string()),
    }),
  },
  async (input) => {
    const bucket = getStorage().bucket();
    // Supõe que os documentos ficam em uma pasta path: companies/{userId}/docs/
    const [files] = await bucket.getFiles({ prefix: `companies/${input.userId}/docs/` });
    
    const docNames = files.map(file => {
        // Extrai apenas o nome do arquivo da URL completa
        const parts = file.name.split('/');
        return parts[parts.length - 1];
    });

    return { existingDocs: docNames };
  }
);

/**
 * TOOL: get_compliance_summary
 * Retorna um resumo do status de conformidade para o Chat Assistant.
 */
export const getComplianceSummary = ai.defineTool(
  {
    name: 'get_compliance_summary',
    description: 'Busca o resumo de tudo que a empresa já preencheu, documentos enviados e gaps pendentes.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
      companyName: z.string(),
      plan: z.string(),
      docsCount: z.number(),
      pendingGaps: z.array(z.string()),
      maturityLevel: z.string(),
    }),
  },
  async (input) => {
    const userDoc = await db.collection('users').doc(input.userId).get();
    const data = userDoc.data();
    
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: `companies/${input.userId}/docs/` });
    
    return {
      companyName: data?.company?.name || 'Não informada',
      plan: data?.subscription?.plan || 'Basic',
      docsCount: files.length,
      pendingGaps: data?.lastDiagnosis?.criticalGaps?.map((g: any) => g.issue) || [],
      maturityLevel: data?.lastDiagnosis?.maturityLevel || 'Não avaliado',
    };
  }
);
