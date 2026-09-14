import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveToLocalCache, syncWithFirestore, readFromCacheOrFirestore } from '../services/localSyncService';

describe('C) Testes de Local-First (Sincronização)', () => {
  beforeEach(() => {
    // Mock do localStorage para testes
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it('Deve salvar localmente no preenchimento sem chamar o Firestore', () => {
    const firestoreMock = vi.fn();
    saveToLocalCache('inventory', { id: 1, name: 'Test' }, firestoreMock);
    
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(firestoreMock).not.toHaveBeenCalled();
  });

  it('Ao clicar em Salvar/Concluir, a função de sync deve enviar os dados ao Firestore', async () => {
    const firestoreSyncMock = vi.fn().mockResolvedValue(true);
    await syncWithFirestore('inventory', firestoreSyncMock);
    
    expect(firestoreSyncMock).toHaveBeenCalled();
  });

  it('O sistema deve ler do cache local primeiro antes de consultar o Firestore', async () => {
    const firestoreReadMock = vi.fn().mockResolvedValue({ source: 'firestore' });
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({ source: 'cache' }));

    const result = await readFromCacheOrFirestore('inventory', firestoreReadMock);
    
    expect(localStorage.getItem).toHaveBeenCalled();
    expect(result.source).toBe('cache');
    expect(firestoreReadMock).not.toHaveBeenCalled();
  });
});
