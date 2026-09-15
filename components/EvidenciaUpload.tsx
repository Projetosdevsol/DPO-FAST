import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { jsPDF } from 'jspdf';
import { Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, Loader2, ShieldCheck, Sparkles, Send, X } from 'lucide-react';

export interface PlanoDeAcaoInfo {
  comoFazer: string[];
  referenciaLegal?: string;
}

interface Props {
  processoRopaId: string; // ID do processo/Ropa (uso interno: vínculo + Storage)
  processoNome?: string; // Nome legível da atividade (exibição)
  categoriaNome?: string; // Nome do setor/categoria (exibição)
  identificacaoGap?: string; // Texto do GAP (ex: ComplianceTask.description)
  planoDeAcao?: PlanoDeAcaoInfo; // Plano de ação (ex: ComplianceTask.explanation fatiado)
  taskId?: string; // se já existe task
  onDone?: () => void;
}

type EvidenceMode = 'texto' | 'arquivo' | 'link';

const GAP_FALLBACK = 'Esta atividade de tratamento possui dados ou vulnerabilidades mapeadas no ROPA sem a devida comprovação documental. A ausência de evidência pode ferir o Princípio da Responsabilização e Prestação de Contas (Art. 6º, X da LGPD).';
const PLANO_FALLBACK: PlanoDeAcaoInfo = {
  comoFazer: [
    '1. Anexe a política, contrato ou termo assinado que comprova a conformidade.',
    '2. Marque os itens da auto-declaração obrigatória abaixo.',
    '3. Descreva sucintamente como a regra é praticada na rotina do departamento.',
  ],
  referenciaLegal: 'Art. 6º, X e Art. 37 da LGPD; Guia Orientativo da ANPD.',
};

/** Gera PDF da evidência textual (texto/link) para trafegar no pipeline de arquivo (.pdf aceito em todas as categorias). */
function buildEvidencePdf(title: string, lines: string[]): Blob {
  const pdf = new jsPDF();
  pdf.setFontSize(14);
  pdf.text(title, 15, 20);
  pdf.setFontSize(10);
  const wrapped = pdf.splitTextToSize(lines.join('\n'), 175) as string[];
  pdf.text(wrapped.slice(0, 120), 15, 32);
  return pdf.output('blob');
}

export const EvidenciaUpload: React.FC<Props> = ({ processoRopaId, processoNome, categoriaNome, identificacaoGap, planoDeAcao, taskId: initialTaskId, onDone }) => {
  const { authState } = useAuth();
  const tenantId = authState.user?.id ?? '';
  const [task, setTask] = useState<any>(null);
  const [respostas, setRespostas] = useState<Record<string,boolean>>({});
  const [activeTab, setActiveTab] = useState<EvidenceMode>('arquivo');
  const [textoEvidencia, setTextoEvidencia] = useState('');
  const [linkEvidencia, setLinkEvidencia] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [file, setFile] = useState<File|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const gap = identificacaoGap || GAP_FALLBACK;
  const plano = planoDeAcao || PLANO_FALLBACK;

  // Carrega Task vinculada ao ROPA (1:1 MVP): por taskId direto ou por query processo_ropa_id+tenantId
  useEffect(()=>{
    if(!tenantId) return;
    if(initialTaskId){
      const unsub = onSnapshot(doc(db, 'task_evidencias', initialTaskId), snap=>{ if(snap.exists()) setTask({ task_id: snap.id, ...snap.data() }); });
      return ()=>unsub();
    }
    let cancelled = false;
    (async ()=>{
      try {
        const q = query(
          collection(db, 'task_evidencias'),
          where('tenantId', '==', tenantId),
          where('processo_ropa_id', '==', processoRopaId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const d = snap.docs[0];
          setTask({ task_id: d.id, ...d.data() });
        }
      } catch(err:any){
        if(!cancelled) setCreateError(err?.message ?? 'Falha ao buscar task vinculada.');
      }
    })();
    return ()=>{ cancelled = true; };
  },[tenantId, initialTaskId, processoRopaId]);

  // Cria a task via Callable e passa a ouvir o documento criado (sem reload)
  const criarSeNaoExiste = async ()=>{
    if(task || !tenantId || isCreatingTask) return;
    setIsCreatingTask(true);
    setCreateError(null);
    try{
      const fn = httpsCallable(functions, 'criarTaskEvidencia');
      const res:any = await fn({
        processo_ropa_id: processoRopaId,
        titulo_task: processoNome ? `Evidência - ${processoNome}` : `Evidência de Compliance`,
        categoria_evidencia: 'POLITICA_BYOD',
        requisitos_checklist: [
          { id_item: 'req_1', descricao: 'O documento possui cláusula de retenção e descarte?', obrigatorio: true },
          { id_item: 'req_2', descricao: 'A política está assinada pelo responsável?', obrigatorio: true },
        ]
      });
      const newId = res?.data?.task_id as string | undefined;
      if(newId){
        const unsub = onSnapshot(doc(db, 'task_evidencias', newId), snap=>{ if(snap.exists()) setTask({ task_id: snap.id, ...snap.data() }); });
        // listener fica ativo enquanto o componente existir; sem reload
        setTimeout(()=>unsub(), 5 * 60 * 1000);
      }
    }catch(err:any){
      // Erro visível — nunca silencioso (ex: function não deployada, sem permissão)
      setCreateError(err?.message ?? 'Erro ao criar task de evidência.');
    }finally{
      setIsCreatingTask(false);
    }
  };

  const todosMarcados = task?.requisitos_checklist?.every((r:any)=> respostas[r.id_item]) ?? false;
  const linkValido = /^https?:\/\/.+\..+/.test(linkEvidencia.trim());
  const podeEnviar =
    !!task && todosMarcados && !submitting &&
    (activeTab === 'arquivo' ? (!!file && anotacoes.trim().length >= 10)
      : activeTab === 'texto' ? textoEvidencia.trim().length >= 10
      : (linkValido && anotacoes.trim().length >= 10));

  const usarTextoSugerido = () => {
    setTextoEvidencia(
      [`Medida implementada para: ${processoNome || processoRopaId}.`, '', gap, '', 'Como foi feito:', ...plano.comoFazer].join('\n')
    );
  };

  const handleSubmit = async (e: React.FormEvent)=>{
    e.preventDefault();
    if(!task || !tenantId || !podeEnviar) return;
    setSubmitting(true);
    setSubmitError(null);
    try{
      let uploadName: string;
      let uploadBlob: File | Blob;
      let uploadSize: number;
      let observacao: string;

      if (activeTab === 'arquivo') {
        if (!file) return;
        uploadName = file.name;
        uploadBlob = file;
        uploadSize = file.size;
        observacao = anotacoes.trim();
      } else if (activeTab === 'texto') {
        // Texto vira PDF para trafegar no pipeline de arquivo (.pdf aceito em todas as categorias)
        uploadName = 'evidencia-texto.pdf';
        uploadBlob = buildEvidencePdf(`Evidência — ${processoNome || processoRopaId}`, [textoEvidencia.trim(), '', anotacoes.trim() ? `Anotações: ${anotacoes.trim()}` : '']);
        uploadSize = uploadBlob.size;
        observacao = anotacoes.trim() ? `${textoEvidencia.trim()}\n\nAnotações: ${anotacoes.trim()}` : textoEvidencia.trim();
      } else {
        // Link vira PDF com a URL + notas (DPO visualiza o documento normalmente)
        uploadName = 'evidencia-link.pdf';
        uploadBlob = buildEvidencePdf(`Evidência — ${processoNome || processoRopaId}`, [`Link da evidência: ${linkEvidencia.trim()}`, '', `Anotações: ${anotacoes.trim()}`]);
        uploadSize = uploadBlob.size;
        observacao = `Evidência via link: ${linkEvidencia.trim()}\n\n${anotacoes.trim()}`;
      }

      // 1) Upload determinístico para companies/{tenantId}/evidencias/{taskId}/{file}
      const path = `companies/${tenantId}/evidencias/${task.task_id}/${uploadName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, uploadBlob);
      // 2) Submete via Callable (validação back 10MB/ext/checklist)
      const fn = httpsCallable(functions, 'submeterEvidencia');
      const respostasArr = task.requisitos_checklist.map((r:any)=>({ id_item: r.id_item, marcado: !!respostas[r.id_item] }));
      await fn({
        task_id: task.task_id,
        respostas_checklist: respostasArr,
        observacao_usuario: observacao,
        arquivo_path: path,
        arquivo_nome: uploadName,
        arquivo_tamanho: uploadSize,
      });
      onDone?.();
      alert('Evidência enviada para análise (EM_ANALISE)');
    }catch(err:any){
      setSubmitError(err?.message ?? 'Falha ao enviar evidência.');
    }finally{ setSubmitting(false); }
  };

  if(!task) return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl border text-center space-y-3">
      <p className="text-sm text-slate-600">Nenhuma Task vinculada a este processo.</p>
      {createError && (
        <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 break-words">{createError}</p>
      )}
      <button onClick={criarSeNaoExiste} disabled={isCreatingTask} className="px-6 py-3 min-h-[44px] bg-blue-600 text-white rounded-xl font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2 mx-auto">
        {isCreatingTask ? (<><Loader2 className="h-4 w-4 animate-spin"/> Criando Task...</>) : 'Criar Task de Evidência'}
      </button>
    </div>
  );

  const statusColor: Record<string,string> = {
    PENDENTE: 'bg-amber-100 text-amber-700',
    EM_ANALISE: 'bg-blue-100 text-blue-700',
    CONFORME: 'bg-emerald-100 text-emerald-700',
    REJEITADO: 'bg-red-100 text-red-700',
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col">
      {/* HEADER PADRONIZADO (fixo no topo durante a rolagem no mobile) */}
      <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0 rounded-t-3xl max-md:sticky max-md:top-0 max-md:z-10">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center border border-amber-200/50 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Validação de Conformidade</h2>
            <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mt-0.5 truncate">
              {categoriaNome || 'Evidência de Compliance'} — {processoNome || task.titulo_task}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor[task.status] ?? 'bg-slate-100'}`}>{task.status || 'PENDENTE'}</span>
          <button
            onClick={() => onDone?.()}
            aria-label="Fechar"
            className="w-10 h-10 min-h-[44px] rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {task.status==='REJEITADO' && task.parecer_dpo?.comentario_recusa && (
        <div className="mx-5 sm:mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0"/>
          <div className="min-w-0"><p className="text-xs font-black text-red-700 uppercase">Motivo da recusa</p><p className="text-sm text-red-800 break-words">{task.parecer_dpo.comentario_recusa}</p></div>
        </div>
      )}

      {task.status==='CONFORME' && (
        <div className="mx-5 sm:mx-8 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/><p className="text-sm font-bold text-emerald-800">Evidência conforme — ROPA atualizado para BAIXO/CONFORME</p>
        </div>
      )}

      {/* CORPO SPLIT (rolagem única controlada pelo wrapper do modal) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* ESQUERDA: diagnóstico */}
        <div className="md:col-span-5 p-5 sm:p-8 space-y-6 bg-slate-50/40">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">O que identificamos?</span>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{gap}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Como implementar?</span>
            </div>
            <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase block">Como fazer:</span>
              <ul className="space-y-2">
                {plano.comoFazer.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-600 leading-relaxed font-medium">{item}</li>
                ))}
              </ul>
              {plano.referenciaLegal && (
                <p className="text-[10px] text-slate-400 pt-2 border-t border-blue-100/80 font-medium">
                  Referência: {plano.referenciaLegal}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* DIREITA: evidência */}
        <div className="md:col-span-7 p-5 sm:p-8 space-y-6 bg-white">
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Sua evidência de implementação
            </span>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl" role="tablist">
              {(['texto', 'arquivo', 'link'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === mode}
                  onClick={() => setActiveTab(mode)}
                  className={`py-2 min-h-[44px] text-xs font-bold rounded-lg uppercase transition-all ${
                    activeTab === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'arquivo' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-slate-50/50 transition-all text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-600 break-all">
                  {file ? file.name : 'Toque para selecionar o arquivo (PDF, PNG, JPG, DOCX)'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Tamanho máximo de 10MB</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
              {file && <span className="text-xs text-slate-500">{(file.size/1024/1024).toFixed(2)} MB</span>}
            </div>
          )}

          {activeTab === 'texto' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={usarTextoSugerido}
                className="w-full py-2.5 min-h-[44px] px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all uppercase"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Usar texto sugerido pelo sistema
              </button>
              <textarea
                rows={5}
                value={textoEvidencia}
                onChange={(e) => setTextoEvidencia(e.target.value)}
                placeholder="Descreva detalhadamente a medida técnica ou cole o conteúdo do documento que você implementou... (mín 10 chars)"
                className="w-full p-4 border border-slate-200 rounded-2xl text-base md:text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400">O texto será convertido em PDF e enviado pelo mesmo pipeline auditado.</p>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-2">
              <input
                type="url"
                value={linkEvidencia}
                onChange={(e) => setLinkEvidencia(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full p-4 border border-slate-200 rounded-2xl text-base md:text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400">O link será registrado em PDF auditável junto às suas anotações.</p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Checklist de auto-declaração
            </span>
            <div className="space-y-2">
              {task.requisitos_checklist.map((r:any)=>(
                <label
                  key={r.id_item}
                  className={`flex items-center gap-3 p-3 min-h-[44px] border rounded-xl cursor-pointer transition-all ${
                    respostas[r.id_item] ? 'border-blue-500 bg-blue-50/20 text-blue-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!respostas[r.id_item]}
                    onChange={e=>setRespostas({...respostas, [r.id_item]: e.target.checked})}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5 shrink-0"
                  />
                  <span className="text-xs font-medium leading-snug break-words">{r.descricao} *</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Anotações adicionais
            </span>
            <input
              type="text"
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              placeholder="Algo que o auditor precise saber sobre essa evidência?"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base md:text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {submitError && (
            <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 break-words">{submitError}</p>
          )}
        </div>
      </form>

      {/* FOOTER (fixo na base durante a rolagem no mobile) */}
      <div className="px-5 sm:px-8 py-4 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between shrink-0 rounded-b-3xl max-md:sticky max-md:bottom-0 max-md:z-10">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          Auditoria LGPD Ativa
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => onDone?.()}
            className="px-5 py-2.5 min-h-[44px] text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all uppercase"
          >
            Solicitar revisão
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any)}
            disabled={!podeEnviar}
            className="px-8 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase"
          >
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin"/> Enviando...</>) : (<>Finalizar <Send className="w-3.5 h-3.5" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
};
