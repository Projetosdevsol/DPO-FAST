/**
 * localSyncService — Wrapper público para os testes e uso direto nos componentes.
 * 
 * Expõe funções simples que os testes TDD (src/tests/local-first.test.ts) importam
 * e que internamente delegam ao LocalStorageService e SyncEngine.
 */

import { LocalStorageService } from './LocalStorageService';
import { SyncEngine } from './SyncEngine';

/**
 * Salva um rascunho localmente (localStorage/IndexedDB) sem chamar o Firestore.
 * O callback firestoreFn é ignorado aqui — existe apenas para fins de teste/mock.
 */
export async function saveToLocalCache(
  key: string,
  data: any,
  firestoreFn?: Function
): Promise<void> {
  // Persiste apenas no localStorage (fallback para ambientes sem IndexedDB, ex: testes)
  localStorage.setItem(`guardiao:draft:${key}`, JSON.stringify({
    ...data,
    lastUpdated: new Date().toISOString(),
    synced: false,
  }));
  // firestoreFn NÃO é chamado aqui — é a regra de ouro do Local-First
}

/**
 * Dispara a sincronização com o Firestore.
 * O syncFn é chamado, devendo ser a função de escrita no Firestore.
 */
export async function syncWithFirestore(
  key: string,
  syncFn: Function
): Promise<void> {
  const raw = localStorage.getItem(`guardiao:draft:${key}`);
  const data = raw ? JSON.parse(raw) : null;
  await syncFn(data);
  
  // Marca como sincronizado
  if (data) {
    localStorage.setItem(`guardiao:draft:${key}`, JSON.stringify({
      ...data,
      synced: true,
    }));
  }
}

/**
 * Lê dados com estratégia Local-First:
 * 1. Tenta ler do cache local (localStorage/IndexedDB).
 * 2. Se não houver, consulta o Firestore via firestoreReadFn.
 */
export async function readFromCacheOrFirestore(
  key: string,
  firestoreReadFn: Function
): Promise<any> {
  const raw = localStorage.getItem(`guardiao:draft:${key}`);
  
  if (raw) {
    const cached = JSON.parse(raw);
    return cached; // Retorna do cache sem chamar o Firestore
  }

  // Fallback: consulta o Firestore e hidrata o cache
  const data = await firestoreReadFn();
  localStorage.setItem(`guardiao:draft:${key}`, JSON.stringify({
    ...data,
    lastUpdated: new Date().toISOString(),
    synced: true,
  }));
  return data;
}
