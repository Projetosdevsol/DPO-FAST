import { z } from 'zod';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { next, can } from '../lib/taskStateMachine';
import { EXTENSOES_POR_CATEGORIA } from '../lib/evidenciaSchemas';
import { logAudit, hashArquivo } from '../lib/auditLog';

// Schemas determinísticos - validação em 2 níveis (front já valida, back revalida)
export const criarTaskSchema = z.object({
  processo_ropa_id: z.string().min(1),
  titulo_task: z.string().min(5).max(120),
  categoria_evidencia: z.enum(['POLITICA_BYOD','CONTRATO_TRABALHO','TERMO_CONSENTIMENTO','LOG_TECNICO']),
  requisitos_checklist: z.array(z.object({
    id_item: z.string(), descricao: z.string().min(5), obrigatorio: z.boolean()
  })).min(1),
}).passthrough();

export const submeterSchema = z.object({
  task_id: z.string().min(1),
  // respostas devem vir na mesma ordem dos requisitos
  respostas_checklist: z.array(z.object({ id_item: z.string(), marcado: z.boolean() })).min(1),
  observacao_usuario: z.string().min(10, 'Justificativa obrigatória (mín 10 chars)').max(2000),
  arquivo_path: z.string().min(1), // companies/{tenantId}/evidencias/{taskId}/file
  arquivo_nome: z.string().min(1),
  arquivo_tamanho: z.number().min(1).max(10*1024*1024),
}).passthrough();

export const avaliarSchema = z.object({
  task_id: z.string().min(1),
  comentario_recusa: z.string().max(2000).optional(),
}).passthrough();

export const downloadUrlSchema = z.object({
  task_id: z.string().min(1),
}).passthrough();

function extOf(nome: string): string {
  return nome.split('.').pop()?.toLowerCase() ?? '';
}

async function assertDPO(tenantId: string, uid: string): Promise<void> {
  // Determinístico: verifica claim custom ou doc de papel
  const userDoc = await db.doc(`users/${uid}`).get();
  const data = userDoc.data() as any;
  const role = data?.role ?? data?.papel ?? '';
  const isDPO = data?.isDPO === true || data?.isAdmin === true || ['DPO','Gestor','ADMIN'].includes(String(role).toUpperCase());
  // Fallback: todo tenantId==uid é dono, mas aprovação exige DPO/Gestor
  if (!isDPO && uid !== tenantId) {
    // também checa companies/{tenantId}/membros/{uid}
    const mem = await db.doc(`companies/${tenantId}/membros/${uid}`).get().catch(()=>null);
    const memRole = (mem?.data() as any)?.role ?? '';
    if (!['DPO','GESTOR','ADMIN'].includes(String(memRole).toUpperCase())) {
      throw new HttpsError('permission-denied', 'Apenas DPO/Gestor pode avaliar evidências');
    }
  } else if (!isDPO) {
    // se não tem papel, nega; evita auto-aprovação sem governança
    throw new HttpsError('permission-denied', 'Perfil sem permissão de DPO/Gestor');
  }
}

export async function criarTaskHandler(input: z.infer<typeof criarTaskSchema> & { tenantId: string }) {
  const parsed = criarTaskSchema.parse(input);
  const ref = db.collection('task_evidencias').doc();
  const now = new Date().toISOString();
  const doc = {
    task_id: ref.id,
    tenantId: input.tenantId,
    processo_ropa_id: parsed.processo_ropa_id,
    titulo_task: parsed.titulo_task,
    categoria_evidencia: parsed.categoria_evidencia,
    requisitos_checklist: parsed.requisitos_checklist,
    submissao: null,
    status: 'PENDENTE' as const,
    parecer_dpo: null,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(doc);
  return { task_id: ref.id };
}

export async function submeterEvidenciaHandler(input: z.infer<typeof submeterSchema> & { tenantId: string }) {
  const { tenantId, task_id, respostas_checklist, observacao_usuario, arquivo_path, arquivo_nome, arquivo_tamanho } = submeterSchema.parse(input) as any & { tenantId: string };

  const ref = db.doc(`task_evidencias/${task_id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Task não encontrada');
  const task = snap.data() as any;
  if (task.tenantId !== tenantId) throw new HttpsError('permission-denied', 'Tenant isolado');
  if (!can(task.status, 'SUBMETER')) throw new HttpsError('failed-precondition', `Status ${task.status} não permite submissão`);

  // Validação determinística: todos obrigatórios marcados
  const obrigatorios = (task.requisitos_checklist as any[]).filter(r=>r.obrigatorio).map(r=>r.id_item);
  for (const id of obrigatorios) {
    const resp = respostas_checklist.find((r:any)=>r.id_item===id);
    if (!resp?.marcado) throw new HttpsError('invalid-argument', `Item obrigatório não marcado: ${id}`);
  }
  if (respostas_checklist.length !== task.requisitos_checklist.length) {
    throw new HttpsError('invalid-argument', 'Checklist incompleto');
  }
  if (!observacao_usuario || observacao_usuario.trim().length < 10) {
    throw new HttpsError('invalid-argument', 'Observação/Justificativa obrigatória (mín 10 chars)');
  }

  // Validação arquivo determinística
  if (arquivo_tamanho <=0 || arquivo_tamanho > 10*1024*1024) throw new HttpsError('invalid-argument', 'Arquivo deve ter 1 byte a 10MB');
  const ext = extOf(arquivo_nome);
  const permitidas = EXTENSOES_POR_CATEGORIA[task.categoria_evidencia] ?? [];
  if (!permitidas.includes(ext)) throw new HttpsError('invalid-argument', `Extensão .${ext} não permitida para ${task.categoria_evidencia} (permitidas: ${permitidas.join(', ')})`);
  // Verifica que arquivo existe no Storage e pertence ao tenant
  if (!arquivo_path.startsWith(`companies/${tenantId}/evidencias/${task_id}/`)) {
    throw new HttpsError('invalid-argument', 'Caminho de arquivo inválido para este tenant/task');
  }
  const bucket = getStorage().bucket();
  const [exists] = await bucket.file(arquivo_path).exists();
  if (!exists) throw new HttpsError('not-found', 'Arquivo não encontrado no Storage');

  const novoStatus = next(task.status, 'SUBMETER');
  const submissao = {
    arquivo_url: `gs://${bucket.name}/${arquivo_path}`,
    arquivo_path,
    arquivo_nome,
    arquivo_tamanho,
    data_envio: new Date().toISOString(),
    enviado_por: tenantId,
    respostas_checklist,
    observacao_usuario: observacao_usuario.trim(),
  };

  await ref.update({
    submissao,
    status: novoStatus,
    updatedAt: new Date().toISOString(),
    parecer_dpo: null, // limpa parecer anterior se reenvio
  });

  await db.collection('notificacoes').add({
    tenantId,
    tipo: 'EVIDENCIA_EM_ANALISE',
    task_id,
    titulo: task.titulo_task,
    mensagem: `Nova evidência enviada para análise: ${task.titulo_task}`,
    createdAt: FieldValue.serverTimestamp(),
    lida: false,
    para: 'DPO',
  });

  return { status: novoStatus };
}

export async function aprovarEvidenciaHandler(input: z.infer<typeof avaliarSchema> & { tenantId: string; uid: string; ip?: string }) {
  const { tenantId, uid, task_id } = avaliarSchema.parse(input) as any & { tenantId: string; uid: string };
  await assertDPO(tenantId, uid);
  const ref = db.doc(`task_evidencias/${task_id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Task não encontrada');
  const task = snap.data() as any;
  if (task.tenantId !== tenantId) throw new HttpsError('permission-denied','');
  if (!can(task.status, 'APROVAR')) throw new HttpsError('failed-precondition', `Status ${task.status} não permite aprovação`);

  const novoStatus = next(task.status, 'APROVAR');
  await ref.update({
    status: novoStatus,
    parecer_dpo: { aprovado_por: uid, data_avaliacao: new Date().toISOString(), comentario_recusa: null },
    updatedAt: new Date().toISOString(),
  });
  // Trilha imutável Art.37
  const arquivo_hash = task.submissao?.arquivo_path ? hashArquivo(task.submissao.arquivo_path) : null;
  await logAudit({ tenantId, task_id, acao: 'APROVADO', uid_avaliador: uid, ip: (input as any).ip, payload: { status: novoStatus }, arquivo_path: task.submissao?.arquivo_path ?? null, arquivo_hash });

  // ropaSync trigger cuidará de atualizar ROPA para BAIXO/CONFORME idempotente

  await db.collection('notificacoes').add({
    tenantId,
    tipo: 'EVIDENCIA_CONFORME',
    task_id,
    mensagem: `Evidência aprovada: ${task.titulo_task}`,
    createdAt: FieldValue.serverTimestamp(),
    lida: false,
  });

  return { status: novoStatus };
}

export async function rejeitarEvidenciaHandler(input: z.infer<typeof avaliarSchema> & { tenantId: string; uid: string; ip?: string }) {
  const { tenantId, uid, task_id, comentario_recusa } = avaliarSchema.parse(input) as any & { tenantId: string; uid: string };
  if (!comentario_recusa || String(comentario_recusa).trim().length < 10) {
    throw new HttpsError('invalid-argument', 'Motivação da recusa obrigatória (mín 10 chars)');
  }
  await assertDPO(tenantId, uid);
  const ref = db.doc(`task_evidencias/${task_id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found','');
  const task = snap.data() as any;
  if (task.tenantId !== tenantId) throw new HttpsError('permission-denied','');
  if (!can(task.status, 'REJEITAR')) throw new HttpsError('failed-precondition','');

  const novoStatus = next(task.status, 'REJEITAR'); // REJEITADO

  // Rejeitar volta para PENDENTE notificando responsável (fluxo do PRD: REJEITADO -> PENDENTE para reenvio)
  // Mantemos REJEITADO como estado auditável e frontend reabre como PENDENTE no reenvio
  await ref.update({
    status: novoStatus,
    parecer_dpo: { aprovado_por: uid, data_avaliacao: new Date().toISOString(), comentario_recusa: String(comentario_recusa).trim() },
    updatedAt: new Date().toISOString(),
  });

  // Trilha imutável
  const arquivo_hash = task.submissao?.arquivo_path ? hashArquivo(task.submissao.arquivo_path) : null;
  await logAudit({ tenantId, task_id, acao: 'REJEITADO', uid_avaliador: uid, ip: (input as any).ip, payload: { comentario_recusa, status: novoStatus }, arquivo_path: task.submissao?.arquivo_path ?? null, arquivo_hash });

  // Para fluxo “retorna para PENDENTE”, o reenvio fará SUBMETER (REJEITADO->EM_ANALISE)
  await db.collection('notificacoes').add({
    tenantId,
    tipo: 'EVIDENCIA_REJEITADA',
    task_id,
    mensagem: `Evidência rejeitada: ${comentario_recusa}`,
    createdAt: FieldValue.serverTimestamp(),
    lida: false,
  });

  return { status: novoStatus };
}

export async function getEvidenciaDownloadUrlHandler(input: z.infer<typeof downloadUrlSchema> & { tenantId: string; uid: string }) {
  const { tenantId, uid, task_id } = downloadUrlSchema.parse(input) as any & { tenantId: string; uid: string };
  const ref = db.doc(`task_evidencias/${task_id}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found','');
  const task = snap.data() as any;
  if (task.tenantId !== tenantId) throw new HttpsError('permission-denied','');

  // Permissão: dono da task ou DPO/Gestor do tenant
  const isOwner = task.submissao?.enviado_por === uid || task.tenantId === uid;
  let isDPO = false;
  try { await assertDPO(tenantId, uid); isDPO = true; } catch {}
  if (!isOwner && !isDPO) throw new HttpsError('permission-denied','Sem permissão para visualizar');

  const path = task.submissao?.arquivo_path as string | null;
  if (!path) throw new HttpsError('not-found','Sem arquivo anexado');

  const bucket = getStorage().bucket();
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError('not-found','Arquivo não encontrado');

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutos
  });

  return { url, expiresIn: 15*60 };
}
