import * as crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config';

export type AuditLogInput = {
  tenantId: string;
  task_id: string;
  acao: 'APROVADO' | 'REJEITADO' | 'GERACAO_DOCUMENTO';
  uid_avaliador: string;
  ip?: string;
  payload?: any;
  arquivo_path?: string | null;
  arquivo_hash?: string | null;
};

/**
 * Cria registro imutável em audit_logs (coleção global, filtrada por tenantId).
 * Imutabilidade garantida por firestore.rules: allow update,delete: if false
 * Hash sha256 do arquivo + ip + uid garantem não-repúdio (Art.37 LGPD).
 */
export async function logAudit(input: AuditLogInput): Promise<string> {
  const { tenantId, task_id, acao, uid_avaliador, ip, payload, arquivo_path, arquivo_hash } = input;

  // Hash do payload para garantir integridade (se arquivo_hash não vier, calcula do payload)
  const payloadHash = payload ? crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex') : null;

  const ref = db.collection('audit_logs').doc();
  const doc = {
    id: ref.id,
    tenantId,
    task_id,
    acao,
    uid_avaliador,
    ip: ip ?? null,
    payload: payload ?? null,
    payloadHash,
    arquivo_path: arquivo_path ?? null,
    arquivo_hash: arquivo_hash ?? null,
    timestamp: FieldValue.serverTimestamp(),
    createdAt: new Date().toISOString(),
  };
  await ref.set(doc);
  console.log(`[audit] ${acao} task=${task_id} por ${uid_avaliador} ip=${ip ?? '-'}`);
  return ref.id;
}

export function hashArquivo(buffer: Buffer | string): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
