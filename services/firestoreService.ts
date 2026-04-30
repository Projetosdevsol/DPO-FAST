
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../lib/firebase';
import { QuestionnaireData, ComplianceTask } from '../types';

// ---------------------------------------------------------------------------
// Utilitário: remove recursivamente todos os campos `undefined` de um objeto.
// O Firestore rejeita qualquer valor undefined com "Unsupported field value".
// ---------------------------------------------------------------------------
function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    ) as T;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Questionnaire Service
// Documento identificado pelo próprio UID → isolamento automático pelo path.
// ---------------------------------------------------------------------------
export const questionnaireService = {
  /**
   * Salva (merge) o questionário do usuário, sempre carimbando ownerID.
   */
  async save(uid: string, data: QuestionnaireData) {
    const docRef = doc(db, 'questionnaires', uid);
    await setDoc(docRef, stripUndefined({
      ...data,
      ownerID: uid,          // isolamento multi-tenant
      last_updated: new Date().toISOString(),
    }), { merge: true });
  },

  /**
   * Leitura direta — a regra de segurança garante que apenas o próprio
   * usuário pode ler (path == uid). Nenhuma query adicional é necessária.
   */
  async get(uid: string): Promise<QuestionnaireData | null> {
    const docSnap = await getDoc(doc(db, 'questionnaires', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data() as QuestionnaireData & { ownerID?: string };
    // Guarda client-side: rejeita dados de outro dono (defesa em profundidade)
    if (data.ownerID && data.ownerID !== uid) return null;
    return data as QuestionnaireData;
  },

  /**
   * Listener em tempo real — só escuta o documento do próprio usuário.
   */
  subscribe(uid: string, callback: (data: QuestionnaireData | null) => void) {
    return onSnapshot(doc(db, 'questionnaires', uid), (snap) => {
      if (!snap.exists()) { callback(null); return; }
      const data = snap.data() as QuestionnaireData & { ownerID?: string };
      // Guarda client-side
      if (data.ownerID && data.ownerID !== uid) { callback(null); return; }
      callback(data as QuestionnaireData);
    });
  },
};

// ---------------------------------------------------------------------------
// Tasks Service
// Documento identificado pelo próprio UID → isolamento automático pelo path.
// Todas as tarefas ficam dentro de { items: ComplianceTask[] }.
// ---------------------------------------------------------------------------
export const tasksService = {
  /**
   * Salva todas as tarefas de uma vez, carimbando ownerID e last_updated
   * em cada item individual (auditoria atômica por tarefa).
   */
  async saveAll(uid: string, tasks: ComplianceTask[]) {
    const now = new Date().toISOString();
    const docRef = doc(db, 'tasks', uid);
    const stamped = tasks.map(t => stripUndefined({
      ...t,
      ownerID: uid,           // isolamento
      user_id: uid,           // trilha de auditoria LGPD
      last_updated: now,      // timestamp da modificação
    }));
    await setDoc(docRef, stripUndefined({
      items: stamped,
      ownerID: uid,
      last_updated: now,
    }));
  },

  /**
   * Persiste atomicamente UMA tarefa sem re-salvar a lista inteira.
   * Ideal para "cada campo finalizado é salvo de forma atômica" (UX).
   * Estratégia: lê a lista atual, substitui o item alterado, salva.
   */
  async saveOne(uid: string, updatedTask: ComplianceTask) {
    const now = new Date().toISOString();
    const docRef = doc(db, 'tasks', uid);
    const snap = await getDoc(docRef);

    const existing: ComplianceTask[] = snap.exists()
      ? (snap.data() as { items: ComplianceTask[]; ownerID?: string }).items ?? []
      : [];

    const stamped = stripUndefined({
      ...updatedTask,
      ownerID: uid,
      user_id: uid,
      last_updated: now,
    });

    const merged = existing.map(t =>
      t.id === updatedTask.id ? stamped : t
    );

    // Tarefa nova que ainda não existe na lista
    if (!merged.some(t => t.id === updatedTask.id)) {
      merged.push(stamped);
    }

    await setDoc(docRef, stripUndefined({
      items: merged,
      ownerID: uid,
      last_updated: now,
    }));
  },

  /**
   * Leitura direta — path == uid garante isolamento pela Security Rule.
   */
  async get(uid: string): Promise<ComplianceTask[]> {
    const snap = await getDoc(doc(db, 'tasks', uid));
    if (!snap.exists()) return [];
    const data = snap.data() as { items: ComplianceTask[]; ownerID?: string };
    // Guarda client-side
    if (data.ownerID && data.ownerID !== uid) return [];
    return data.items ?? [];
  },

  /**
   * Listener em tempo real — apenas o documento do próprio usuário.
   */
  subscribe(uid: string, callback: (tasks: ComplianceTask[]) => void) {
    return onSnapshot(doc(db, 'tasks', uid), (snap) => {
      if (!snap.exists()) { callback([]); return; }
      const data = snap.data() as { items: ComplianceTask[]; ownerID?: string };
      // Guarda client-side
      if (data.ownerID && data.ownerID !== uid) { callback([]); return; }
      callback(data.items ?? []);
    });
  },
};
