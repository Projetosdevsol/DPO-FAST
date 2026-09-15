import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Gatilho determinístico: quando task_evidencias/{taskId} muda para CONFORME,
 * atualiza a matriz de risco do ROPA correspondente para BAIXO/CONFORME.
 * Idempotente: só age se before !== CONFORME e after === CONFORME.
 * Sem IA.
 */
export const ropaSync = onDocumentUpdated(
  {
    document: 'task_evidencias/{taskId}',
    region: 'southamerica-east1',
  },
  async (event) => {
    const before = event.data?.before?.data() as any;
    const after = event.data?.after?.data() as any;
    if (!before || !after) return;

    const beforeStatus = before.status as string;
    const afterStatus = after.status as string;

    // Idempotência
    if (afterStatus !== 'CONFORME' || beforeStatus === 'CONFORME') {
      console.log(`[ropaSync] skip ${event.params.taskId} ${beforeStatus}->${afterStatus}`);
      return;
    }

    const tenantId = after.tenantId as string;
    const ropaId = after.processo_ropa_id as string;
    if (!tenantId || !ropaId) {
      console.warn('[ropaSync] sem tenantId/ropaId', event.params.taskId);
      return;
    }

    const db = getFirestore();
    const ropaRef = db.doc(`companies/${tenantId}/ropa/${ropaId}`);
    const ropaSnap = await ropaRef.get();
    if (!ropaSnap.exists) {
      console.warn(`[ropaSync] ROPA ${ropaId} não encontrado para tenant ${tenantId}`);
      return;
    }

    await ropaRef.update({
      risco: 'BAIXO',
      status_conformidade: 'CONFORME',
      ultima_evidencia_task_id: event.params.taskId,
      ultima_atualizacao_conformidade: FieldValue.serverTimestamp(),
    });
    console.log(`[ropaSync] ROPA ${ropaId} -> CONFORME via task ${event.params.taskId}`);

    // Notificação determinística para responsável
    await db.collection('notificacoes').add({
      tenantId,
      tipo: 'ROPA_CONFORME',
      task_id: event.params.taskId,
      ropa_id: ropaId,
      mensagem: `Evidência aprovada: risco do processo ${ropaId} atualizado para BAIXO/CONFORME`,
      createdAt: FieldValue.serverTimestamp(),
      lida: false,
    });
  }
);
