import * as crypto from 'crypto';
import { LRUCache } from 'lru-cache';

type CachedValue = any;

// max 500 entries, 5 min TTL — in-memory por instância, sem persistência
const cache = new LRUCache<string, CachedValue>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

function keyFor(tenantId: string, query: string): string {
  return crypto.createHash('sha256').update(`${tenantId}:${query}`).digest('hex');
}

export function getCached(query: string, tenantId: string): any | undefined {
  const k = keyFor(tenantId, query);
  return cache.get(k);
}

export function setCached(query: string, tenantId: string, value: any): void {
  const k = keyFor(tenantId, query);
  cache.set(k, value);
}

export function cacheKey(tenantId: string, query: string): string {
  return keyFor(tenantId, query);
}

// exposto para testes/metrics
export function cacheSize(): number {
  return cache.size;
}
export function cacheClear(): void {
  cache.clear();
}
