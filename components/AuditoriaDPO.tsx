import React, { useState } from 'react';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ShieldCheck, XCircle, FileText, Loader2, Check } from 'lucide-react';

interface Props {
  task: any;
  onClose: () => void;
  onEvaluated: () => void;
}

export const AuditoriaDPO: React.FC<Props> = ({ task, onClose, onEvaluated }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [comentario, setComentario] = useState('');
  const [busy, setBusy] = useState<'aprovando'|'rejeitando'|null>(null);

  const loadUrl = async () => {
    setLoadingUrl(true);
    try {
      const fn = httpsCallable(functions, 'getEvidenciaDownloadUrl');
      const res: any = await fn({ task_id: task.task_id });
      setUrl(res.data.url);
    } catch(e:any){ alert(e.message); }
    setLoadingUrl(false);
  };

  const aprovar = async () => {
    setBusy('aprovando');
    try {
      const fn = httpsCallable(functions, 'aprovarEvidencia');
      await fn({ task_id: task.task_id });
      onEvaluated(); onClose();
    } catch(e:any){ alert(e.message); }
    setBusy(null);
  };

  const rejeitar = async () => {
    if(comentario.trim().length<10) return alert('Motivação mínima 10 caracteres');
    setBusy('rejeitando');
    try {
      const fn = httpsCallable(functions, 'rejeitarEvidencia');
      await fn({ task_id: task.task_id, comentario_recusa: comentario });
      onEvaluated(); onClose();
    } catch(e:any){ alert(e.message); }
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-stretch justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:w-[480px] sm:max-w-[95vw] bg-white h-[92vh] sm:h-full overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-2xl rounded-t-[1.5rem] sm:rounded-none">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-black text-slate-900 truncate text-base sm:text-lg">{task.titulo_task}</h3>
          <button onClick={onClose} aria-label="Fechar auditoria" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-100 rounded-xl shrink-0"><XCircle className="h-5 w-5"/></button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checklist do usuário</p>
          {task.requisitos_checklist?.map((r:any)=>{
            const resp = task.submissao?.respostas_checklist?.find((x:any)=>x.id_item===r.id_item);
            return (
              <div key={r.id_item} className="flex items-center gap-2 text-sm">
                {resp?.marcado ? <Check className="h-4 w-4 text-emerald-600"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                <span className={resp?.marcado?'text-slate-800':'text-red-600 font-bold'}>{r.descricao}</span>
              </div>
            );
          })}
          <p className="text-xs text-slate-600 mt-3"><b>Observação:</b> {task.submissao?.observacao_usuario}</p>
        </div>

        <div className="space-y-3">
          <button onClick={loadUrl} disabled={loadingUrl} className="w-full py-3 min-h-[44px] bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
            {loadingUrl ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4"/>}
            {url ? 'Recarregar documento' : 'Visualizar documento (15min)'}
          </button>
          {url && (
            <div className="w-full max-w-full overflow-hidden rounded-xl border">
              <iframe src={url} className="w-full max-w-full h-[300px] sm:h-[400px]" title="evidencia" />
            </div>
          )}
        </div>

        <div className="space-y-3 pb-2">
          <textarea value={comentario} onChange={e=>setComentario(e.target.value)} placeholder="Motivação da recusa (obrigatória se rejeitar, mín 10 chars)" className="w-full p-4 rounded-2xl bg-slate-50 border text-base md:text-sm h-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={aprovar} disabled={!!busy} className="py-4 min-h-[44px] bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              {busy==='aprovando' ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} Aprovar Conformidade
            </button>
            <button onClick={rejeitar} disabled={!!busy} className="py-4 min-h-[44px] bg-red-600 text-white rounded-2xl font-black text-xs disabled:opacity-50">Solicitar Ajustes / Rejeitar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
