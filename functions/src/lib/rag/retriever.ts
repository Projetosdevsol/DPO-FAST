import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export type Chunk = {
  tenantId: string;
  sourceDoc: string;
  sourceChunkId: string;
  secao: string;
  tipo_documento: string;
  setor_alvo: string;
  categoria: string;
  content: string;
  embedding: number[];
  contentHash: string;
  version: string;
};

export type RetrievedChunk = Chunk & { score: number };

let cachedChunks: Chunk[] | null = null;
let loadingPromise: Promise<Chunk[]> | null = null;

function pseudoEmbedding(text: string, dim = 768): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  const arr: number[] = [];
  for (let i = 0; i < dim; i++) {
    const byte = hash[i % hash.length];
    arr.push((byte - 128) / 128);
  }
  const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0));
  return arr.map((v) => v / (norm || 1));
}

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return pseudoEmbedding(text);
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const genai = new GoogleGenAI({ apiKey });
    const res: any = await (genai as any).models.embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }],
    });
    const vec = res?.embeddings?.[0]?.values ?? res?.embedding?.values ?? res?.values;
    if (Array.isArray(vec) && vec.length > 0) return vec;
    return pseudoEmbedding(text);
  } catch {
    return pseudoEmbedding(text);
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function loadChunks(): Promise<Chunk[]> {
  if (cachedChunks) return cachedChunks;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // 1) tenta Firestore
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { getApps, initializeApp } = await import('firebase-admin/app');
      if (getApps().length === 0) try { initializeApp(); } catch {}
      const db = getFirestore();
      // tenta current pointer
      const currentSnap = await db.doc('rag_index/current').get().catch(() => null);
      const version = currentSnap?.exists ? ((currentSnap.data() as any)?.currentVersion ?? 'v1') : 'v1';
      // tenta listar parts via meta
      const metaSnap = await db.doc(`rag_index/${version}_meta`).get().catch(() => null);
      if (metaSnap?.exists) {
        const totalParts = (metaSnap.data() as any)?.totalParts ?? 0;
        const all: Chunk[] = [];
        for (let i = 0; i < totalParts; i++) {
          const docId = `${version}_part_${String(i).padStart(2, '0')}`;
          const partSnap = await db.doc(`rag_index/${docId}`).get().catch(() => null);
          if (partSnap?.exists) {
            const data: any = partSnap.data();
            if (Array.isArray(data?.chunks)) all.push(...data.chunks);
          }
        }
        if (all.length > 0) {
          cachedChunks = all;
          console.log(`[retriever] carregado ${all.length} chunks do Firestore (${version})`);
          return all;
        }
      }
    } catch (e: any) {
      console.warn(`[retriever] Firestore load falhou (${e?.message}) — fallback local`);
    }

    // 2) fallback local: functions/.genkit/rag_index/<version>/*.json
    try {
      const currentPath = path.resolve(__dirname, '../../../.genkit/rag_index/current.json');
      let version = 'v1';
      if (fs.existsSync(currentPath)) {
        try {
          const cur = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
          version = cur.currentVersion ?? 'v1';
        } catch {}
      }
      const dir = path.resolve(__dirname, `../../../.genkit/rag_index/${version}`);
      if (!fs.existsSync(dir)) {
        // tenta v1 hard-coded
        const fallback = path.resolve(__dirname, '../../../.genkit/rag_index/v1');
        if (fs.existsSync(fallback)) {
          const files = fs.readdirSync(fallback).filter(f => f.startsWith('part_') && f.endsWith('.json')).sort();
          const all: Chunk[] = [];
          for (const f of files) {
            const j = JSON.parse(fs.readFileSync(path.join(fallback, f), 'utf8'));
            if (Array.isArray(j.chunks)) all.push(...j.chunks);
          }
          cachedChunks = all;
          console.log(`[retriever] carregado ${all.length} chunks fallback ${fallback}`);
          return all;
        }
        throw new Error(`dir não existe ${dir}`);
      }
      const files = fs.readdirSync(dir).filter(f => f.startsWith('part_') && f.endsWith('.json')).sort();
      const all: Chunk[] = [];
      for (const f of files) {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (Array.isArray(j.chunks)) all.push(...j.chunks);
      }
      cachedChunks = all;
      console.log(`[retriever] carregado ${all.length} chunks local ${dir}`);
      return all;
    } catch (e: any) {
      console.error(`[retriever] falha load local (${e?.message})`);
      cachedChunks = [];
      return [];
    }
  })();

  return loadingPromise;
}

export async function retrieve(
  query: string,
  opts: { k?: number; threshold?: number } = {}
): Promise<RetrievedChunk[]> {
  const k = opts.k ?? 4;
  const threshold = opts.threshold ?? 0.72;

  const chunks = await loadChunks();
  if (chunks.length === 0) return [];

  const t0 = Date.now();
  const qEmb = await embedQuery(query);

  const scored: RetrievedChunk[] = [];
  for (const c of chunks) {
    const s = cosine(qEmb, c.embedding);
    if (s >= threshold) scored.push({ ...c, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  let top = scored.slice(0, k);
  // Fallback: se threshold filtra tudo (comum com pseudo ou quando Gemini 401), retorna top-k para não quebrar chat generativo
  if (top.length === 0) {
    const allScored: RetrievedChunk[] = chunks.map(c => ({ ...c, score: cosine(qEmb, c.embedding) }));
    allScored.sort((a, b) => b.score - a.score);
    top = allScored.slice(0, k);
    console.warn(`[retriever] threshold ${threshold} filtrou tudo, fallback top-${k} com score ${top[0]?.score?.toFixed(3) ?? '0'}`);
  }
  const elapsed = Date.now() - t0;
  // log only if slow (>50ms) to avoid spam
  if (elapsed > 50) console.warn(`[retriever] search ${elapsed}ms for k=${k} threshold=${threshold} hits=${top.length}`);
  // para métrica p95, o chamador mede latencyMs total; aqui só cosine <10ms esperado quando embedding excluído
  return top;
}

// exposto para testes / warmup
export async function warmup(): Promise<number> {
  const c = await loadChunks();
  return c.length;
}
export function clearCache(): void {
  cachedChunks = null;
  loadingPromise = null;
}
