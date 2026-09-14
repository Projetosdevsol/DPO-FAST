import { db } from '../config';

export type MetricRecord = {
  tenantId: string;
  agentId: 'consultant' | 'auditor';
  cacheHit: boolean;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs: number;
  chunksRetrieved: number;
  chunkIds: string[];
  timestamp: string;
  model: string;
  queryHash?: string;
};

export async function logMetric(record: MetricRecord): Promise<void> {
  try {
    const clean: any = {};
    for (const [k, v] of Object.entries(record)) if (v !== undefined) clean[k] = v;
    const ref = db.collection('metrics').doc();
    await ref.set({ ...clean, id: ref.id });
  } catch (e: any) {
    console.warn('[metrics] falha ao salvar', e?.message);
  }
}
