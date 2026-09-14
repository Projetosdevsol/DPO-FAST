/**
 * cnpjCache.ts
 * Cache em memória (Map) para resultados de consulta CNPJ
 * e rate limiting por IP para a Cloud Function validateCnpj.
 *
 * Nota: Em instâncias múltiplas do Cloud Functions, cada instância terá
 * seu próprio cache. Para escala maior, usar Firestore ou Redis.
 * Para o volume esperado da LGPD Fácil, este approach é suficiente.
 */

// ---------------------------------------------------------------------------
// Cache de resultados de CNPJ
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CachedCnpjResult {
  status: string;         // ex: 'ATIVA', 'BAIXADA', 'SUSPENSA'
  companyName: string;
  cachedAt: number;       // timestamp em ms
}

const cnpjCache = new Map<string, CachedCnpjResult>();

export function getCachedCnpj(cnpj: string): CachedCnpjResult | null {
  const entry = cnpjCache.get(cnpj);
  if (!entry) return null;

  const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
  if (isExpired) {
    cnpjCache.delete(cnpj);
    return null;
  }

  return entry;
}

export function setCachedCnpj(cnpj: string, data: Omit<CachedCnpjResult, 'cachedAt'>): void {
  cnpjCache.set(cnpj, { ...data, cachedAt: Date.now() });

  // Limpeza proativa: remove entradas expiradas quando o cache cresce demais
  if (cnpjCache.size > 1000) {
    const now = Date.now();
    for (const [key, val] of cnpjCache.entries()) {
      if (now - val.cachedAt > CACHE_TTL_MS) {
        cnpjCache.delete(key);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting por IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 segundos
const RATE_LIMIT_MAX_REQUESTS = 5;      // max 5 req/min por IP

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Verifica se o IP está dentro do limite permitido.
 * Retorna true se a requisição deve ser BLOQUEADA.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Inicia nova janela
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // BLOQUEADO
  }

  entry.count++;
  return false;
}
