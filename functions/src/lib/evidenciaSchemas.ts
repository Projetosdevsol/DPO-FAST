import { z } from 'zod';

export const CategoriaEvidencia = z.enum(['POLITICA_BYOD','CONTRATO_TRABALHO','TERMO_CONSENTIMENTO','LOG_TECNICO']);

export const RequisitoChecklist = z.object({
  id_item: z.string(),
  descricao: z.string().min(5),
  obrigatorio: z.boolean(),
});

export const TaskEvidenciaSchema = z.object({
  task_id: z.string(),
  tenantId: z.string(),
  processo_ropa_id: z.string(),
  titulo_task: z.string().min(5).max(120),
  categoria_evidencia: CategoriaEvidencia,
  requisitos_checklist: z.array(RequisitoChecklist).min(1),
  submissao: z.object({
    arquivo_url: z.string().nullable(),
    arquivo_path: z.string().nullable(),
    arquivo_nome: z.string().nullable(),
    arquivo_tamanho: z.number().nullable(),
    data_envio: z.string().datetime().nullable(),
    enviado_por: z.string().nullable(),
    respostas_checklist: z.array(z.object({ id_item: z.string(), marcado: z.boolean() })),
    observacao_usuario: z.string().min(10).max(2000),
  }).nullable(),
  status: z.enum(['PENDENTE','EM_ANALISE','CONFORME','REJEITADO']),
  parecer_dpo: z.object({
    aprovado_por: z.string().nullable(),
    data_avaliacao: z.string().datetime().nullable(),
    comentario_recusa: z.string().max(2000).nullable(),
  }).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EXTENSOES_POR_CATEGORIA: Record<string, string[]> = {
  POLITICA_BYOD: ['pdf','png','jpg','jpeg','docx'],
  CONTRATO_TRABALHO: ['pdf','docx'],
  TERMO_CONSENTIMENTO: ['pdf','docx','png','jpg','jpeg'],
  LOG_TECNICO: ['pdf','png','jpg','jpeg'],
};

export const MIME_POR_EXT: Record<string,string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
