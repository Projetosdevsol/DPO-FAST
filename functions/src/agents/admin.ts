import { z } from 'zod';
import { HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export const deleteUserAccountSchema = z.object({
  targetUid: z.string().min(1, 'UID do usuário é obrigatório.'),
});

export type DeleteUserAccountInput = z.infer<typeof deleteUserAccountSchema> & {
  callerUid: string;
};

/**
 * Verifica flag isAdmin no doc users/{uid} (modelo do repo — firestore.rules isAdmin()).
 * NUNCA confia em verificação só de frontend.
 */
async function assertIsAdmin(callerUid: string): Promise<void> {
  const snap = await getFirestore().doc(`users/${callerUid}`).get();
  if (!snap.exists || snap.data()?.isAdmin !== true) {
    // CA1.5: tentativa de usuário comum é auditada
    try {
      await getFirestore().collection('audit_logs').add({
        adminId: callerUid,
        action: 'Tentativa de Exclusão Negada',
        targetUserId: null,
        details: 'Chamada deleteUserAccount sem privilégio isAdmin',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // auditoria best-effort, não mascara o 403
    }
    throw new HttpsError('permission-denied', 'Apenas administradores podem excluir contas.');
  }
}

export async function deleteUserAccountHandler(input: DeleteUserAccountInput): Promise<{ deletedUid: string }> {
  const { targetUid, callerUid } = deleteUserAccountSchema.extend({ callerUid: z.string().min(1) }).parse(input);

  await assertIsAdmin(callerUid);

  // Trava de segurança: admin nunca exclui a própria conta (evita lockout)
  if (targetUid === callerUid) {
    throw new HttpsError('failed-precondition', 'Não é permitido excluir a própria conta de administrador.');
  }

  const db = getFirestore();
  try {
    // 1. Conta no Firebase Auth (TU-ADM-03)
    await getAuth().deleteUser(targetUid);

    // 2. Firestore: docs do tenant + subcoleções (TU-ADM-02)
    await db.recursiveDelete(db.doc(`users/${targetUid}`));
    await db.recursiveDelete(db.doc(`questionnaires/${targetUid}`));
    await db.recursiveDelete(db.doc(`tasks/${targetUid}`));

    // task_evidencias/notificacoes usam tenantId (Zero-Trust) — remove em lote
    const evidencias = await db.collection('task_evidencias').where('tenantId', '==', targetUid).get();
    for (const docSnap of evidencias.docs) {
      await db.recursiveDelete(docSnap.ref);
    }
    const notifs = await db.collection('notificacoes').where('tenantId', '==', targetUid).get();
    for (const docSnap of notifs.docs) {
      await docSnap.ref.delete();
    }
    // audit_logs são IMUTÁVEIS (Art.37) — preservados de propósito.

    // 3. Storage do tenant
    const bucket = getStorage().bucket();
    await bucket.deleteFiles({ prefix: `companies/${targetUid}/` });
    await bucket.deleteFiles({ prefix: `evidences/${targetUid}/` });

    // 4. Auditoria da exclusão
    await db.collection('audit_logs').add({
      adminId: callerUid,
      action: 'Exclusão de Conta',
      targetUserId: targetUid,
      details: 'Usuário removido permanentemente (Auth + Firestore + Storage)',
      timestamp: new Date().toISOString(),
    });

    return { deletedUid: targetUid };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    // TU-ADM-04: falha parcial é auditada e propagada
    try {
      await db.collection('audit_logs').add({
        adminId: callerUid,
        action: 'Falha na Exclusão de Conta',
        targetUserId: targetUid,
        details: String(err?.message ?? err).slice(0, 500),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // best-effort
    }
    throw new HttpsError('internal', 'Falha ao excluir conta. Verifique o log de auditoria.');
  }
}
