/**
 * useLocalFirst — Hook React para integração Local-First nos formulários.
 * 
 * Substitui chamadas diretas ao Firestore nos componentes, fornecendo:
 * - Leitura otimista do IndexedDB
 * - Escrita local imediata (sem latência de rede)
 * - Status visual de sincronização (idle / pending / syncing / synced / error)
 * - Sincronização manual (syncNow) para botões "Próximo" / "Salvar"
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncEngine, SyncStatus } from '../services/SyncEngine';
import { QuestionnaireData, ComplianceTask } from '../../types';

interface UseLocalFirstOptions {
  uid: string | undefined;
  /** Chame com true quando todos os campos obrigatórios da etapa atual estão válidos */
  isStepValid?: boolean;
}

interface UseLocalFirstReturn {
  questionnaire: QuestionnaireData | null;
  tasks: ComplianceTask[];
  syncStatus: SyncStatus;
  dataSource: 'cache' | 'firestore' | 'loading';
  /** Salva questionário localmente (chame no onChange) */
  saveQuestionnaire: (data: QuestionnaireData) => Promise<void>;
  /** Salva tarefas localmente */
  saveTasks: (tasks: ComplianceTask[]) => Promise<void>;
  /** Sincroniza agora com o Firestore (chame no "Próximo" / "Salvar Etapa") */
  syncNow: () => Promise<void>;
}

export function useLocalFirst({ uid, isStepValid = false }: UseLocalFirstOptions): UseLocalFirstReturn {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [dataSource, setDataSource] = useState<'cache' | 'firestore' | 'loading'>('loading');
  
  const isStepValidRef = useRef(isStepValid);
  isStepValidRef.current = isStepValid;

  // Escuta mudanças de status do SyncEngine
  useEffect(() => {
    const unsubscribe = SyncEngine.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  // Carrega dados ao montar usando a estratégia Local-First
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    SyncEngine.loadData(uid).then(({ questionnaire: q, tasks: t, source }) => {
      if (cancelled) return;
      setQuestionnaire(q);
      setTasks(t);
      setDataSource(source);
    }).catch(console.error);

    return () => { cancelled = true; };
  }, [uid]);

  // Salva questionário localmente e agenda debounce
  const saveQuestionnaire = useCallback(async (data: QuestionnaireData) => {
    if (!uid) return;
    setQuestionnaire(data);
    await SyncEngine.saveLocalQuestionnaire(uid, data);
    SyncEngine.scheduleDebounceSync(uid, isStepValidRef.current);
  }, [uid]);

  // Salva tarefas localmente e agenda debounce
  const saveTasks = useCallback(async (newTasks: ComplianceTask[]) => {
    if (!uid) return;
    setTasks(newTasks);
    await SyncEngine.saveLocalTasks(uid, newTasks);
    SyncEngine.scheduleDebounceSync(uid, isStepValidRef.current);
  }, [uid]);

  // Sincronização manual (botões "Próximo" / "Salvar Etapa")
  const syncNow = useCallback(async () => {
    if (!uid) return;
    await SyncEngine.syncNow(uid);
  }, [uid]);

  return { questionnaire, tasks, syncStatus, dataSource, saveQuestionnaire, saveTasks, syncNow };
}
