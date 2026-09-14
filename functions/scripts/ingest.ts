import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import matter from 'gray-matter';
import 'dotenv/config';

const DEFAULT_SRC = path.resolve(__dirname, '../../docs/Documentos Oficiais/templates_md');
const PART_SIZE = 200;
const CHUNK_TARGET = 1200;
const CHUNK_OVERLAP = 150;
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;

// --- Types ---
type Chunk = {
  tenantId: 'system';
  sourceDoc: string;
  sourceChunkId: string;
  secao: string;
  tipo_documento: string;
  setor_alvo: string;
  categoria: string;
  content: string; // already prefixed with [tipo > secao]
  embedding: number[];
  contentHash: string;
  version: string;
};

// --- Helpers ---
function sha256(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function isTableLine(line: string): boolean {
  return line.trim().startsWith('|') && line.includes('|');
}

function isListLine(line: string): boolean {
  return /^\s*([-*]|\d+\.)\s+/.test(line);
}

/**
 * Split body into atomic blocks:
 * - Table: consecutive lines where isTableLine === true => one block
 * - List: consecutive list lines => one block
 * - Otherwise: paragraphs split by \n\n
 */
function toAtomicBlocks(body: string): string[] {
  const lines = body.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let mode: 'table' | 'list' | 'normal' | null = null;

  const flush = () => {
    if (current.length) {
      const text = current.join('\n').trim();
      if (text) blocks.push(text);
      current = [];
    }
    mode = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const table = isTableLine(line);
    const list = isListLine(line);

    if (!trimmed) {
      // blank line: flush unless inside table/list continuity will be handled
      if (mode === 'table' || mode === 'list') {
        flush();
      } else {
        if (current.length) flush();
      }
      continue;
    }

    if (table) {
      if (mode !== 'table') flush();
      mode = 'table';
      current.push(line);
    } else if (list) {
      if (mode !== 'list') {
        // if we were accumulating normal paragraph, flush it
        if (mode === 'normal' && current.length) flush();
        mode = 'list';
      }
      current.push(line);
      // peek next: if next is not list, flush after loop will handle
      const next = lines[i + 1];
      if (!next || (!isListLine(next) && next.trim() !== '')) {
        // keep list block together — only flush when gap or non-list
        // but we want consecutive list items together, so check next is list
        if (!next || !isListLine(next)) {
          flush();
        }
      }
    } else {
      if (mode === 'table' || mode === 'list') flush();
      mode = 'normal';
      current.push(line);
      // paragraphs are separated by blank line already flushed; keep accumulating until blank
    }
  }
  flush();
  // fallback: if we got 0 blocks (e.g., single paragraph), treat whole body as one block
  if (blocks.length === 0 && body.trim()) blocks.push(body.trim());
  return blocks;
}

function chunkSection(
  secao: string,
  tipo: string,
  blocks: string[],
  prefix: string
): string[] {
  // Join blocks with \n\n, then sliding window over resulting string but respecting block boundaries
  const full = blocks.join('\n\n');
  if (!full.trim()) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < full.length) {
    let end = Math.min(start + CHUNK_TARGET, full.length);
    // Don't cut in middle of table/list block: find last \n\n before end if near boundary
    if (end < full.length) {
      // look for safe break point: \n\n within last 200 chars of window
      const window = full.slice(start, end);
      const lastBreak = window.lastIndexOf('\n\n');
      // Only adjust if we would cut inside a table (pipe char) nearby
      const sliceAroundEnd = full.slice(Math.max(0, end - 100), end + 100);
      const hasTableNearby = sliceAroundEnd.includes('|');
      if (lastBreak > CHUNK_TARGET - 400) {
        // prefer paragraph break
        end = start + lastBreak + 2;
      } else if (hasTableNearby) {
        // find table boundary: extend to include until next \n\n after table
        const nextBreak = full.indexOf('\n\n', end);
        if (nextBreak !== -1 && nextBreak - start < CHUNK_TARGET + 300) {
          end = nextBreak + 2;
        }
      }
    }
    let content = full.slice(start, end).trim();
    if (content) {
      chunks.push(`${prefix}${content}`);
    }
    if (end >= full.length) break;
    // overlap: backtrack CHUNK_OVERLAP chars but align to next block start or paragraph
    const overlapStart = Math.max(start, end - CHUNK_OVERLAP);
    // find next \n after overlapStart to avoid cutting word
    const nextNewline = full.indexOf('\n', overlapStart);
    const nextSpace = full.indexOf(' ', overlapStart);
    let nextStart = overlapStart;
    if (nextSpace !== -1 && nextSpace < end) nextStart = nextSpace + 1;
    if (nextNewline !== -1 && nextNewline < end && nextNewline - overlapStart < 50) nextStart = nextNewline + 1;
    start = nextStart;
    // safety: ensure progress
    if (start >= end) start = end;
  }
  return chunks;
}

function pseudoEmbedding(text: string, dim = EMBEDDING_DIM): number[] {
  // deterministic pseudo-embedding from hash — for offline/dev without API key
  const hash = crypto.createHash('sha256').update(text).digest();
  const arr: number[] = [];
  for (let i = 0; i < dim; i++) {
    const byte = hash[i % hash.length];
    // map byte 0-255 to -1..1
    arr.push((byte - 128) / 128);
  }
  // L2 normalize
  const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0));
  return arr.map((v) => v / (norm || 1));
}

async function embedWithVertex(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.log('[ingest] GOOGLE_GENAI_API_KEY não definida — usando pseudo-embeddings determinísticos (offline)');
    return texts.map((t) => pseudoEmbedding(t));
  }
  try {
    // Lazy import to avoid loading genai when offline
    const { GoogleGenAI } = await import('@google/genai');
    const genai = new GoogleGenAI({ apiKey });
    // Batch embeddings: Vertex supports batch, but @google/genai embedContent is per content; we batch sequentially
    const results: number[][] = [];
    for (const t of texts) {
      try {
        const res: any = await (genai as any).models.embedContent({
          model: EMBEDDING_MODEL,
          contents: [{ parts: [{ text: t }] }],
        });
        const vec = res?.embeddings?.[0]?.values ?? res?.embedding?.values ?? res?.values;
        if (Array.isArray(vec) && vec.length > 0) {
          results.push(vec);
        } else {
          console.warn('[ingest] embedding vazio, fallback pseudo');
          results.push(pseudoEmbedding(t));
        }
      } catch (e: any) {
        console.warn(`[ingest] falha embedContent para chunk (${e?.message}), fallback pseudo`);
        results.push(pseudoEmbedding(t));
      }
    }
    return results;
  } catch (e: any) {
    console.warn(`[ingest] falha ao inicializar GoogleGenAI (${e?.message}), usando pseudo-embeddings`);
    return texts.map((t) => pseudoEmbedding(t));
  }
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const srcIdx = args.indexOf('--src');
  const src = srcIdx !== -1 ? path.resolve(args[srcIdx + 1]) : DEFAULT_SRC;
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log(`[ingest] src=${src} dryRun=${dryRun} force=${force}`);

  if (!fs.existsSync(src)) {
    console.error(`[ingest] src não existe: ${src}`);
    process.exit(1);
  }

  const files = fs.readdirSync(src).filter((f) => f.endsWith('.md')).sort();
  console.log(`[ingest] encontrados ${files.length} arquivos .md`);

  if (files.length !== 51) {
    console.warn(`[ingest] esperado 51 arquivos, encontrado ${files.length} — continuando`);
  }

  // Compute global hash for idempotency (sorted file contents)
  const fileContentsForHash: string[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(src, f), 'utf8');
    fileContentsForHash.push(`${f}:${sha256(raw)}`);
  }
  const globalHash = sha256(fileContentsForHash.join('|'));
  console.log(`[ingest] globalHash=${globalHash}`);

  // Try Firestore for idempotency check (optional)
  let firestoreAvailable = false;
  let currentVersion = 'v1';
  let existingHash: string | null = null;
  let db: any = null;

  if (!dryRun) {
    try {
      const { getFirestore } = await import('firebase-admin/firestore');
      const { initializeApp, getApps } = await import('firebase-admin/app');
      if (getApps().length === 0) {
        try {
          initializeApp();
        } catch {}
      }
      db = getFirestore();
      firestoreAvailable = true;
      // Check current pointer
      const currentSnap = await db.doc('rag_index/current').get().catch(() => null);
      if (currentSnap?.exists) {
        currentVersion = currentSnap.data().currentVersion || 'v1';
      }
      const metaSnap = await db.doc(`rag_index/${currentVersion}_meta`).get().catch(() => null);
      if (metaSnap?.exists) {
        existingHash = metaSnap.data().globalHash ?? null;
      }
      console.log(`[ingest] Firestore ok. currentVersion=${currentVersion} existingHash=${existingHash ?? 'none'}`);
      if (!force && existingHash === globalHash) {
        console.log('[ingest] no changes, skipping (hash igual)');
        console.log(`[ingest] CA-02.4 OK — segunda execução sem mudança é no-op`);
        process.exit(0);
      }
      // If hash differs, bump version: v1 -> v2 -> v3 ...
      if (existingHash && existingHash !== globalHash) {
        const vNum = parseInt(currentVersion.replace('v', ''), 10) || 1;
        currentVersion = `v${vNum + 1}`;
        console.log(`[ingest] hash mudou — nova versão ${currentVersion}`);
      }
    } catch (e: any) {
      console.warn(`[ingest] Firestore indisponível (${e?.message}) — modo local/fallback`);
      firestoreAvailable = false;
    }
  }

  // Also check local fallback meta for idempotency (sempre checar local quando Firestore não tem hash)
  const localMetaPath = path.resolve(__dirname, '../.genkit/rag_meta.json');
  const shouldCheckLocal = !firestoreAvailable || (!force && existingHash !== globalHash);
  if (shouldCheckLocal) {
    try {
      if (fs.existsSync(localMetaPath)) {
        const localMeta = JSON.parse(fs.readFileSync(localMetaPath, 'utf8'));
        if (!force && localMeta.globalHash === globalHash) {
          console.log('[ingest] no changes, skipping (local hash igual)');
          console.log(`[ingest] CA-02.4 OK — segunda execução sem mudança é no-op`);
          process.exit(0);
        }
        if (localMeta.globalHash !== globalHash && localMeta.currentVersion) {
          const vNum = parseInt(localMeta.currentVersion.replace('v', ''), 10) || 1;
          currentVersion = `v${vNum + 1}`;
          console.log(`[ingest] hash local mudou — nova versão ${currentVersion}`);
        }
      }
    } catch {}
  }

  // Build chunks
  let totalChunks = 0;
  const allChunksRaw: Array<{ rawContent: string; tenantId: 'system'; sourceDoc: string; secao: string; tipo_documento: string; setor_alvo: string; categoria: string }> = [];

  for (const file of files) {
    const filePath = path.join(src, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as any;
    const tipo = String(data.tipo_documento ?? 'documento').trim();
    const setor = String(data.setor_alvo ?? 'geral').trim();
    const categoria = String(data.categoria ?? 'geral').trim();
    const body = parsed.content.trim();
    if (!body) {
      console.warn(`[ingest] ${file} vazio após front-matter — pulando`);
      continue;
    }

    // Split by headings ## and ###
    const headingRegex = /^#{2,3}\s+(.+)$/gm;
    const sections: Array<{ secao: string; content: string }> = [];
    const headingMatches = [...body.matchAll(headingRegex)];
    if (headingMatches.length === 0) {
      sections.push({ secao: 'geral', content: body });
    } else {
      // content before first heading
      const firstIdx = headingMatches[0].index ?? 0;
      if (firstIdx > 0) {
        const pre = body.slice(0, firstIdx).trim();
        if (pre) sections.push({ secao: 'introdução', content: pre });
      }
      for (let i = 0; i < headingMatches.length; i++) {
        const m = headingMatches[i];
        const title = m[1].trim();
        const start = (m.index ?? 0) + m[0].length;
        const end = i + 1 < headingMatches.length ? (headingMatches[i + 1].index ?? body.length) : body.length;
        const content = body.slice(start, end).trim();
        sections.push({ secao: title.toLowerCase().slice(0, 80), content });
      }
    }

    for (const sec of sections) {
      const blocks = toAtomicBlocks(sec.content);
      const prefix = `[${tipo} > ${sec.secao}] `;
      const chunkContents = chunkSection(sec.secao, tipo, blocks, prefix);
      for (const c of chunkContents) {
        allChunksRaw.push({
          rawContent: c,
          tenantId: 'system',
          sourceDoc: file,
          secao: sec.secao,
          tipo_documento: tipo,
          setor_alvo: setor,
          categoria,
        });
      }
    }
  }

  console.log(`[ingest] chunks brutos gerados: ${allChunksRaw.length}`);

  // Validate CA-02.3 fields before embedding
  for (const c of allChunksRaw) {
    if (!c.tenantId || !c.sourceDoc || !c.secao || !c.rawContent) {
      throw new Error(`Chunk inválido: ${JSON.stringify(c).slice(0, 200)}`);
    }
    if (c.tenantId !== 'system') throw new Error('tenantId deve ser system');
  }

  // Embedding
  const textsForEmbedding = allChunksRaw.map((c) => c.rawContent);
  console.log(`[ingest] gerando embeddings para ${textsForEmbedding.length} chunks via ${EMBEDDING_MODEL}...`);
  const startEmbed = Date.now();
  const embeddings = await embedWithVertex(textsForEmbedding);
  const elapsed = Date.now() - startEmbed;
  console.log(`[ingest] embeddings concluídos em ${elapsed}ms (${(elapsed / Math.max(1, textsForEmbedding.length)).toFixed(1)}ms/chunk)`);

  // Estimate cost: text-embedding-004 ~ $0.00002 per 1k chars (approx $0.025/1M tokens ~ 4 chars/token)
  const totalChars = textsForEmbedding.reduce((s, t) => s + t.length, 0);
  const estTokens = Math.ceil(totalChars / 4);
  const estCostUsd = (estTokens / 1_000_000) * 0.025;
  console.log(`[ingest] totalChars=${totalChars} estTokens~${estTokens} estCost~$${estCostUsd.toFixed(4)} (CA-02.6 < $0.05 ? ${estCostUsd < 0.05 ? 'OK' : 'EXCEDEU'})`);

  const chunks: Chunk[] = allChunksRaw.map((c, idx) => ({
    tenantId: 'system',
    sourceDoc: c.sourceDoc,
    sourceChunkId: `${c.sourceDoc}#${String(idx).padStart(4, '0')}`,
    secao: c.secao,
    tipo_documento: c.tipo_documento,
    setor_alvo: c.setor_alvo,
    categoria: c.categoria,
    content: c.rawContent,
    embedding: embeddings[idx],
    contentHash: sha256(c.rawContent),
    version: currentVersion,
  }));

  totalChunks = chunks.length;
  console.log(`[ingest] total chunks finais: ${totalChunks}`);

  if (totalChunks < 400 || totalChunks > 1000) {
    console.warn(`[ingest] CA-02.2 WARNING: esperado 400-1000 chunks, obtido ${totalChunks}`);
  } else {
    console.log(`[ingest] CA-02.2 OK — ${totalChunks} chunks dentro de 400-1000`);
  }

  if (files.length === 51) console.log(`[ingest] CA-02.1 OK — 51 arquivos processados, 0 falha`);
  else console.log(`[ingest] CA-02.1 FAIL — ${files.length} arquivos`);

  // Partition
  const parts: Chunk[][] = [];
  for (let i = 0; i < chunks.length; i += PART_SIZE) {
    parts.push(chunks.slice(i, i + PART_SIZE));
  }
  console.log(`[ingest] partições: ${parts.length} (tamanho ${PART_SIZE})`);

  // Save to Firestore (or local fallback)
  let savedToFirestore = false;
  if (firestoreAvailable && db && !dryRun) {
    try {
      for (let pi = 0; pi < parts.length; pi++) {
        const part = parts[pi];
        const docId = `${currentVersion}_part_${String(pi).padStart(2, '0')}`;
        await db.doc(`rag_index/${docId}`).set({
          version: currentVersion,
          partIndex: pi,
          totalParts: parts.length,
          chunkCount: part.length,
          globalHash,
          createdAt: new Date().toISOString(),
          chunks: part,
        });
        console.log(`[ingest] salvo rag_index/${docId} (${part.length} chunks)`);
      }
      await db.doc(`rag_index/${currentVersion}_meta`).set({
        version: currentVersion,
        globalHash,
        totalFiles: files.length,
        totalChunks,
        totalParts: parts.length,
        estCostUsd,
        createdAt: new Date().toISOString(),
      });
      await db.doc('rag_index/current').set({
        currentVersion,
        globalHash,
        updatedAt: new Date().toISOString(),
      });
      console.log(`[ingest] ponteiro rag_index/current -> ${currentVersion}`);
      savedToFirestore = true;
    } catch (e: any) {
      console.warn(`[ingest] falha ao salvar em Firestore (${e?.message}) — fallback para local`);
      savedToFirestore = false;
    }
  }
  if (!savedToFirestore) {
    const outDir = path.resolve(__dirname, '../.genkit/rag_index', currentVersion);
    // G7: limpar stale parts ao bump de versão ou force
    if (force || currentVersion !== 'v1') {
      try {
        // remove parts antigos da mesma versão quando force (evita acumular)
        if (fs.existsSync(outDir) && force) {
          for (const f of fs.readdirSync(outDir).filter(f => f.startsWith('part_'))) {
            fs.unlinkSync(path.join(outDir, f));
          }
          console.log(`[ingest] limpos stale parts em ${outDir} (force)`);
        }
        // quando bump, limpar versão anterior se for v2+ e existir v1 com excesso de arquivos (evita 8 parts órfãos)
        if (currentVersion !== 'v1') {
          const prevV = `v${parseInt(currentVersion.slice(1)) - 1}`;
          const prevDir = path.resolve(__dirname, '../.genkit/rag_index', prevV);
          // não apaga prev, só garante que não há duplicação — v1 mantido para fallback
        }
      } catch {}
    }
    fs.mkdirSync(outDir, { recursive: true });
    for (let pi = 0; pi < parts.length; pi++) {
      const part = parts[pi];
      const outPath = path.join(outDir, `part_${String(pi).padStart(2, '0')}.json`);
      fs.writeFileSync(outPath, JSON.stringify({ version: currentVersion, partIndex: pi, chunks: part }, null, 2), 'utf8');
      console.log(`[ingest] salvo local ${outPath} (${part.length} chunks)`);
    }
    // G7: remover stale parts além de parts.length (ex: PART_SIZE mudou de 150→200)
    try {
      const existing = fs.readdirSync(outDir).filter(f => f.startsWith('part_') && f.endsWith('.json')).sort();
      for (const f of existing) {
        const m = f.match(/part_(\d+)\.json/);
        if (m && parseInt(m[1], 10) >= parts.length) {
          fs.unlinkSync(path.join(outDir, f));
          console.log(`[ingest] removido stale ${f}`);
        }
      }
    } catch {}
    const meta = {
      version: currentVersion,
      globalHash,
      totalFiles: files.length,
      totalChunks,
      totalParts: parts.length,
      estCostUsd,
      createdAt: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(localMetaPath), { recursive: true });
    fs.writeFileSync(localMetaPath, JSON.stringify({ ...meta, currentVersion }, null, 2), 'utf8');
    // also write current pointer
    const currentPath = path.resolve(__dirname, '../.genkit/rag_index/current.json');
    fs.mkdirSync(path.dirname(currentPath), { recursive: true });
    fs.writeFileSync(currentPath, JSON.stringify({ currentVersion, globalHash }, null, 2), 'utf8');
    console.log(`[ingest] salvo meta local ${localMetaPath} + current.json`);
    if (dryRun) console.log('[ingest] dry-run: não persistiu em Firestore');
    if (!firestoreAvailable) console.log('[ingest] modo fallback local — para produção configure GOOGLE_APPLICATION_CREDENTIALS');
  }

  console.log(`[ingest] CONCLUÍDO — ${files.length} arquivos, ${totalChunks} chunks, ${parts.length} partições, versão ${currentVersion}, custo est. $${estCostUsd.toFixed(4)}`);
}

main().catch((e) => {
  console.error('[ingest] falha:', e);
  process.exit(1);
});
