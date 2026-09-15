import { HttpsError } from 'firebase-functions/v2/https';

export const TaskStatus = ['PENDENTE','EM_ANALISE','CONFORME','REJEITADO'] as const;
export type TaskStatusType = typeof TaskStatus[number];
export type TaskEvent = 'CRIAR' | 'SUBMETER' | 'APROVAR' | 'REJEITAR' | 'REABRIR';

const transitions: Record<TaskStatusType, Partial<Record<TaskEvent, TaskStatusType>>> = {
  PENDENTE:   { SUBMETER: 'EM_ANALISE' },
  EM_ANALISE: { APROVAR: 'CONFORME', REJEITAR: 'REJEITADO' },
  REJEITADO:  { SUBMETER: 'EM_ANALISE' },
  CONFORME:   { REABRIR: 'PENDENTE' },
};

export function can(from: TaskStatusType, event: TaskEvent): boolean {
  return !!transitions[from]?.[event];
}

export function next(from: TaskStatusType, event: TaskEvent): TaskStatusType {
  const to = transitions[from]?.[event];
  if (!to) throw new HttpsError('failed-precondition', `Transição inválida ${from} -> ${event}`);
  return to;
}
