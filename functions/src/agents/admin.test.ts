import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockDoc, mockCollection, mockAdd, mockRecursiveDelete, mockDeleteUser, mockDeleteFiles, mockWhere } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn((p: string) => ({ get: mockGet, path: p }));
  const mockWhere = vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [] }) }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc, add: mockAdd, where: mockWhere }));
  const mockAdd = vi.fn().mockResolvedValue({ id: 'log1' });
  const mockRecursiveDelete = vi.fn().mockResolvedValue(undefined);
  const mockDeleteUser = vi.fn().mockResolvedValue(undefined);
  const mockDeleteFiles = vi.fn().mockResolvedValue(undefined);
  return { mockGet, mockDoc, mockCollection, mockAdd, mockRecursiveDelete, mockDeleteUser, mockDeleteFiles, mockWhere };
});

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: mockDoc,
    collection: mockCollection,
    recursiveDelete: mockRecursiveDelete,
  }),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ deleteUser: mockDeleteUser }),
}));

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({ bucket: () => ({ deleteFiles: mockDeleteFiles }) }),
}));

vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn() }));

import { deleteUserAccountHandler } from './admin';

describe('Agente 7 — deleteUserAccount (TU-ADM-01 a 04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // caller é admin por padrão
    mockGet.mockResolvedValue({ exists: true, data: () => ({ isAdmin: true }) });
  });

  it('TU-ADM-01: não-admin recebe permission-denied e tentativa é auditada', async () => {
    mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ isAdmin: false }) });
    await expect(
      deleteUserAccountHandler({ targetUid: 'victim', callerUid: 'common' })
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ action: 'Tentativa de Exclusão Negada' }));
  });

  it('TU-ADM-02: remove users/{uid}, questionnaires/{uid}, tasks/{uid} via recursiveDelete', async () => {
    await deleteUserAccountHandler({ targetUid: 'victim', callerUid: 'admin1' });
    const paths = mockRecursiveDelete.mock.calls.map((c) => String(c[0]?.path ?? c[0]));
    expect(paths.some((p) => p.includes('users/victim'))).toBe(true);
    expect(paths.some((p) => p.includes('questionnaires/victim'))).toBe(true);
    expect(paths.some((p) => p.includes('tasks/victim'))).toBe(true);
  });

  it('TU-ADM-03: deleta a conta no Firebase Auth', async () => {
    await deleteUserAccountHandler({ targetUid: 'victim', callerUid: 'admin1' });
    expect(mockDeleteUser).toHaveBeenCalledWith('victim');
  });

  it('TU-ADM-04: falha parcial (Auth) é auditada e erro é propagado', async () => {
    mockDeleteUser.mockRejectedValueOnce(new Error('auth boom'));
    await expect(
      deleteUserAccountHandler({ targetUid: 'victim', callerUid: 'admin1' })
    ).rejects.toBeDefined();
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ action: expect.stringMatching(/Falha/) }));
  });

  it('TU-ADM-05: admin não pode excluir a própria conta', async () => {
    await expect(
      deleteUserAccountHandler({ targetUid: 'admin1', callerUid: 'admin1' })
    ).rejects.toMatchObject({ code: 'failed-precondition' });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });
});
