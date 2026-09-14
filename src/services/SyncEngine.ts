/**
 * SyncEngine — Motor de sincronização Local-First → Firestore.
 * 
 * REGRA DE OURO: Nenhuma escrita ocorre no Firestore durante a digitação.
 * 
 * Gatilhos de sincronização permitidos:
 * 1. Usuário clica em "Próximo" ou "Salvar Etapa" (gatilho manual).
 * 2. Usuário finaliza o wizard (última etapa).
 * 3. Timer de debounce de 5s após parar de digitar, mas apenas se
 *    todos os campos obrigatórios estiverem válidos.
 * 
 * Conflitos: Last Write Wins baseado em lastUpdated (ISO timestamp).
 */

import { LocalStorageService } from './LocalStorageService';
import { questionnaireService, tasksService } from '../../services/firestoreService';
import { QuestionnaireData, ComplianceTask } from '../../types';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'pending';

export type SyncEventListener = (status: SyncStatus) => void;

// ─── Estado interno do SyncEngine ────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const listeners: SyncEventListener[] = [];
let currentStatus: SyncStatus = 'idle';

function notifyListeners(status: SyncStatus) {
  currentStatus = status;
  listeners.forEach(l => l(status));
}

// ─── API Pública ─────────────────────────────────────────────────────────────

export const SyncEngine = {
  /**
   * Retorna o status atual de sincronização.
   */
  getStatus(): SyncStatus {
    return currentStatus;
  },

  /**
   * Registra um listener para mudanças de status de sincronização.
   */
  onStatusChange(listener: SyncEventListener): () => void {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },

  /**
   * Salva dados localmente (sem tocar no Firestore).
   * Deve ser chamado em cada onChange de campo do formulário.
   */
  async saveLocalQuestionnaire(uid: string, data: QuestionnaireData): Promise<void> {
    await LocalStorageService.saveDraftQuestionnaire(uid, data);
    notifyListeners('pending');
  },

  /**
   * Salva tarefas localmente (sem tocar no Firestore).
   */
  async saveLocalTasks(uid: string, tasks: ComplianceTask[]): Promise<void> {
    await LocalStorageService.saveDraftTasks(uid, tasks);
    notifyListeners('pending');
  },

  /**
   * GATILHO MANUAL: Sincroniza imediatamente com o Firestore.
   * Chamado quando o usuário clica em "Próximo", "Salvar Etapa", ou finaliza o wizard.
   */
  async syncNow(uid: string): Promise<void> {
    // Cancela qualquer debounce pendente
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    await SyncEngine._performSync(uid);
  },

  /**
   * GATILHO AUTOMÁTICO (debounce): Agenda uma sincronização para daqui 5s,
   * mas apenas se os campos obrigatórios da etapa forem válidos.
   * Se o usuário digitar novamente dentro do prazo, o timer é resetado.
   */
  scheduleDebounceSync(uid: string, isStepValid: boolean): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (!isStepValid) return; // Não agenda sync se a etapa está incompleta

    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      await SyncEngine._performSync(uid);
    }, 5000);
  },

  /**
   * Carrega dados para a sessão usando a estratégia Local-First:
   * 1. Tenta ler do IndexedDB.
   * 2. Se não houver dados locais, lê do Firestore e hidrata o cache.
   */
  async loadData(uid: string): Promise<{
    questionnaire: QuestionnaireData | null;
    tasks: ComplianceTask[];
    source: 'cache' | 'firestore';
  }> {
    const localDraft = await LocalStorageService.getDraft(uid);

    // Dados locais encontrados — retorna sem consultar o Firestore
    if (localDraft?.questionnaire) {
      return {
        questionnaire: localDraft.questionnaire,
        tasks: localDraft.tasks,
        source: 'cache',
      };
    }

    // Fallback: consulta o Firestore uma única vez e hidrata o cache
    const [questionnaire, tasks] = await Promise.all([
      questionnaireService.get(uid),
      tasksService.get(uid),
    ]);

    await LocalStorageService.hydrateFromFirestore(uid, questionnaire, tasks);

    return { questionnaire, tasks, source: 'firestore' };
  },

  /**
   * Execução interna da sincronização com o Firestore.
   * Lógica de Last Write Wins: timestamp local vs. Firestore.
   */
  async _performSync(uid: string): Promise<void> {
    const hasPending = await LocalStorageService.hasPendingSync(uid);
    if (!hasPending) {
      notifyListeners('synced');
      return;
    }

    notifyListeners('syncing');

    try {
      const draft = await LocalStorageService.getDraft(uid);
      if (!draft) {
        notifyListeners('idle');
        return;
      }

      const syncPromises: Promise<void>[] = [];

      if (draft.questionnaire) {
        syncPromises.push(questionnaireService.save(uid, draft.questionnaire));
      }

      if (draft.tasks && draft.tasks.length > 0) {
        syncPromises.push(tasksService.saveAll(uid, draft.tasks));
      }

      await Promise.all(syncPromises);
      await LocalStorageService.markSynced(uid);

      notifyListeners('synced');
    } catch (error) {
      console.error('[SyncEngine] Falha ao sincronizar com o Firestore:', error);
      notifyListeners('error');
    }
  },

  /**
   * Limpa o estado local ao fazer logout.
   */
  async onLogout(uid: string): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    await LocalStorageService.clearDraft(uid);
    notifyListeners('idle');
  },
};
