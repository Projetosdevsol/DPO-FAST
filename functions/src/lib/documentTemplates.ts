import { z } from 'zod';

export const TemplateCategoria = z.enum([
  'POLITICA_PRIVACIDADE',
  'TERMO_USO',
  'BYOD',
  'CONTRATO_RH',
  'RIPD_DPIA',
  'NOTIFICACAO_INCIDENTE',
  'OUTROS',
]);

export const DocumentTemplateSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  categoria: TemplateCategoria,
  descricao: z.string(),
  minPlanRequired: z.enum(['PRO', 'ENTERPRISE']),
  versoes: z.array(
    z.object({
      versao: z.string(),
      conteudoMarkdown: z.string(),
      dataAtualizacao: z.string(),
    })
  ),
  camposRequeridos: z.array(
    z.object({
      chave: z.string(),
      label: z.string(),
      tipo: z.enum(['text', 'email', 'select', 'ropa_ref']),
      origemAutoFill: z.string().nullable(),
    })
  ),
  sourceFile: z.string().optional(),
});

export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;

const UNFILLED_RE = /\{\{\s*[\w_]+\s*\}\}/g;

/** Trava anti-resíduo (passo 3): falha se restar {{chave}} após interpolação. */
export function validateInterpolation(content: string): void {
  const matches = content.match(UNFILLED_RE);
  if (matches && matches.length > 0) {
    const uniq = Array.from(new Set(matches));
    throw new Error(
      `Faltam dados obrigatórios para preencher o documento: ${uniq.join(', ')}`
    );
  }
}

/** Normaliza placeholders legados [EMPRESA]/[CNPJ] para {{chave}} canônica. */
const BRACKET_MAP: Record<string, string> = {
  EMPRESA: 'empresa_nome',
  'RAZÃO SOCIAL': 'empresa_nome',
  RAZAO_SOCIAL: 'empresa_nome',
  CNPJ: 'cnpj',
  DPO: 'encarregado_nome',
  'NOME DO DPO': 'encarregado_nome',
  EMAIL: 'dpo_email',
  'E-MAIL DO DPO': 'dpo_email',
  TELEFONE: 'empresa_telefone',
  ENDERECO: 'empresa_endereco',
  ENDEREÇO: 'empresa_endereco',
  DATA: 'data_atual',
  PRAZO: 'prazo_retencao',
};

export function normalizeBrackets(content: string): string {
  let out = content;
  for (const [bracket, chave] of Object.entries(BRACKET_MAP)) {
    const re = new RegExp(`\\[\\s*${bracket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`, 'gi');
    out = out.replace(re, `{{${chave}}}`);
  }
  return out;
}

/** Extrai chaves {{...}} + [BRACKET] conhecidos para montar camposRequeridos. */
export function extractCampos(content: string): { chave: string; label: string }[] {
  const keys = new Set<string>();
  for (const m of content.matchAll(UNFILLED_RE)) {
    keys.add(m[0].replace(/[{}]/g, '').trim());
  }
  const normalized = normalizeBrackets(content);
  for (const m of normalized.matchAll(UNFILLED_RE)) {
    keys.add(m[0].replace(/[{}]/g, '').trim());
  }
  return [...keys].map((chave) => ({ chave, label: chave.replace(/_/g, ' ') }));
}

/** Interpolação determinística: substitui {{chave}} (case-insensível, com/sem espaços). */
export function interpolate(content: string, valores: Record<string, unknown>): string {
  let out = normalizeBrackets(content);
  for (const [chave, valor] of Object.entries(valores)) {
    const re = new RegExp(`\\{\\{\\s*${chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'gi');
    out = out.replace(re, String(valor ?? ''));
  }
  return out;
}

/** Mapeia nome do .md para categoria do schema (fallback OUTROS). */
export function categoriaFromFileName(fileName: string): z.infer<typeof TemplateCategoria> {
  const n = fileName.toUpperCase();
  if (n.includes('PRIVACIDADE')) return 'POLITICA_PRIVACIDADE';
  if (n.includes('TERMO_DE_USO') || n.includes('TERMOS DE USO')) return 'TERMO_USO';
  if (n.includes('BYOD') || n.includes('HOME-OFFICE') || n.includes('HOME_OFFICE') || n.includes('DISPOSITIV')) return 'BYOD';
  if (n.includes('CONTRATO') || n.includes('TRABALHO') || n.includes('ADITIVO') || n.includes('COLABORADOR')) return 'CONTRATO_RH';
  if (n.includes('RIPD') || n.includes('IMPACTO') || n.includes('LIA') || n.includes('LEGITIMO') || n.includes('LEGÍTIMO')) return 'RIPD_DPIA';
  if (n.includes('INCIDENTE') || n.includes('RESPOSTA') || n.includes('COMUNICAC')) return 'NOTIFICACAO_INCIDENTE';
  if (n.includes('CONSENTIMENTO') || n.includes('CIENCIA') || n.includes('CIÊNCIA')) return 'OUTROS';
  return 'OUTROS';
}
