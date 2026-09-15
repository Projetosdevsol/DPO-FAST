/**
 * Seed document_templates a partir de docs/Documentos Oficiais/templates_md/*.md
 * Uso: npm --prefix functions run seed:templates [-- --dry-run]
 * Idempotente por id (slug do filename); sobe nova versão só se conteúdo mudou.
 */
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import {
  categoriaFromFileName,
  extractCampos,
  normalizeBrackets,
} from '../src/lib/documentTemplates';

const SRC = path.resolve(__dirname, '../../docs/Documentos Oficiais/templates_md');
const DRY = process.argv.includes('--dry-run');

function slugify(fileName: string): string {
  return fileName
    .replace(/\.md$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80);
}

async function main() {
  const files = fs.existsSync(SRC)
    ? fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.md')).sort()
    : [];
  // pula exemplo
  const docs = files.filter((f) => !f.startsWith('_exemplo'));
  console.log(`[seed] ${docs.length} templates em ${SRC}${DRY ? ' (dry-run)' : ''}`);

  const templates = docs.map((file) => {
    const raw = fs.readFileSync(path.join(SRC, file), 'utf8');
    const parsed = matter(raw);
    const body = String(parsed.content || '').trim();
    const normalized = normalizeBrackets(body);
    const campos = extractCampos(body).map((c) => ({
      chave: c.chave,
      label: c.label,
      tipo: 'text' as const,
      origemAutoFill: null as string | null,
    }));
    const titulo = file.replace(/\.md$/i, '').replace(/_/g, ' ');
    return {
      id: slugify(file),
      titulo,
      categoria: categoriaFromFileName(file),
      descricao: `Minuta oficial: ${file} (${String(parsed.data?.tipo_documento || 'documento')})`,
      minPlanRequired: 'PRO' as const,
      versoes: [
        {
          versao: 'v1',
          conteudoMarkdown: normalized,
          dataAtualizacao: new Date().toISOString(),
        },
      ],
      camposRequeridos: campos,
      sourceFile: file,
    };
  });

  console.log(`[seed] categorias: ${JSON.stringify(countBy(templates.map((t) => t.categoria)))}`);

  if (DRY) {
    for (const t of templates.slice(0, 5)) {
      console.log(`- ${t.id} [${t.categoria}] campos=${t.camposRequeridos.length}`);
    }
    console.log(`[seed] dry-run OK (${templates.length} templates, 0 escritos)`);
    return;
  }

  // Lazy admin init (evita credencial em dry-run de CI sem emulador)
  const { initializeApp, getApps } = await import('firebase-admin/app');
  if (getApps().length === 0) initializeApp();
  const { getFirestore } = await import('firebase-admin/firestore');
  const db = getFirestore();

  let created = 0;
  let updated = 0;
  for (const t of templates) {
    const ref = db.doc(`document_templates/${t.id}`);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ ...t, createdAt: new Date().toISOString() });
      created++;
    } else {
      const cur = snap.data() as any;
      const curContent = cur?.versoes?.[0]?.conteudoMarkdown as string;
      if (curContent !== t.versoes[0].conteudoMarkdown) {
        // preserva histórico: push nova versão
        const versoes = [...(cur.versoes || []), { ...t.versoes[0], versao: `v${(cur.versoes || []).length + 1}` }];
        await ref.update({ ...t, versoes, updatedAt: new Date().toISOString() });
        updated++;
      }
    }
  }
  console.log(`[seed] OK created=${created} updated=${updated} total=${templates.length}`);
}

function countBy(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of arr) out[a] = (out[a] || 0) + 1;
  return out;
}

main().catch((e) => {
  console.error('[seed] FAIL', e);
  process.exit(1);
});
