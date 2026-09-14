/**
 * LocalStorageService — Camada de persistência local com IndexedDB (via `idb`).
 * 
 * Responsável por manter um rascunho (draft) completo do estado do formulário
 * de inventário/questionário, servindo como fonte primária de dados durante
 * a sessão do usuário.
 * 
 * Estratégia Local-First:
 * - Leitura: IndexedDB primeiro → Firestore como fallback.
 * - Escrita: sempre local; Firestore só recebe dados via SyncEngine.
 */

import { openDB, IDBPDatabase } from 'idb';
import { QuestionnaireData, ComplianceTask } from '../../types';

// ─── Schema do banco local ───────────────────────────────────────────────────

const DB_NAME = 'guardiao-local-db';
const DB_VERSION = 1;

interface GuardiaoDBSchema {
  companyDraft: {
    key: string; // uid do usuário
    value: {
      uid: string;
      questionnaire: QuestionnaireData | null;
      tasks: ComplianceTask[];
      lastUpdated: string;
      synced: boolean; // true = idêntico ao Firestore
    };
  };
}

// ─── Singleton da instância do DB ────────────────────────────────────────────

let dbInstance: IDBPDatabase<GuardiaoDBSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<GuardiaoDBSchema>> {
  if (!dbInstance) {
    dbInstance = await openDB<GuardiaoDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('companyDraft')) {
          db.createObjectStore('companyDraft', { keyPath: 'uid' });
        }
      },
    });
  }
  return dbInstance;
}

// ─── API Pública ─────────────────────────────────────────────────────────────

export const LocalStorageService = {
  /**
   * Salva o rascunho do questionário localmente sem tocar no Firestore.
   * Marca synced = false para sinalizar que há dados pendentes.
   */
  async saveDraftQuestionnaire(uid: string, data: QuestionnaireData): Promise<void> {
    const db = await getDB();
    const existing = await db.get('companyDraft', uid);
    await db.put('companyDraft', {
      uid,
      questionnaire: data,
      tasks: existing?.tasks ?? [],
      lastUpdated: new Date().toISOString(),
      synced: false,
    });
  },

  /**
   * Salva as tarefas localmente sem tocar no Firestore.
   */
  async saveDraftTasks(uid: string, tasks: ComplianceTask[]): Promise<void> {
    const db = await getDB();
    const existing = await db.get('companyDraft', uid);
    await db.put('companyDraft', {
      uid,
      questionnaire: existing?.questionnaire ?? null,
      tasks,
      lastUpdated: new Date().toISOString(),
      synced: false,
    });
  },

  /**
   * Retorna o rascunho local do usuário.
   */
  async getDraft(uid: string) {
    const db = await getDB();
    return db.get('companyDraft', uid) ?? null;
  },

  /**
   * Lê o questionário do cache local.
   * Retorna null se não houver dados.
   */
  async getQuestionnaire(uid: string): Promise<QuestionnaireData | null> {
    const draft = await LocalStorageService.getDraft(uid);
    return draft?.questionnaire ?? null;
  },

  /**
   * Lê as tarefas do cache local.
   */
  async getTasks(uid: string): Promise<ComplianceTask[]> {
    const draft = await LocalStorageService.getDraft(uid);
    return draft?.tasks ?? [];
  },

  /**
   * Marca o rascunho como sincronizado (idêntico ao Firestore).
   * Chamado pelo SyncEngine após uma escrita bem-sucedida.
   */
  async markSynced(uid: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('companyDraft', uid);
    if (existing) {
      await db.put('companyDraft', { ...existing, synced: true });
    }
  },

  /**
   * Verifica se há dados pendentes de sincronização.
   */
  async hasPendingSync(uid: string): Promise<boolean> {
    const draft = await LocalStorageService.getDraft(uid);
    return draft ? !draft.synced : false;
  },

  /**
   * Preenche o cache local com dados vindos do Firestore (hidratação inicial).
   */
  async hydrateFromFirestore(
    uid: string,
    questionnaire: QuestionnaireData | null,
    tasks: ComplianceTask[]
  ): Promise<void> {
    const db = await getDB();
    await db.put('companyDraft', {
      uid,
      questionnaire,
      tasks,
      lastUpdated: new Date().toISOString(),
      synced: true,
    });
  },

  /**
   * Remove o rascunho local do usuário (ex: logout).
   */
  async clearDraft(uid: string): Promise<void> {
    const db = await getDB();
    await db.delete('companyDraft', uid);
  },
};
