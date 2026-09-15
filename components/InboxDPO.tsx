import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AuditoriaDPO } from './AuditoriaDPO';
import { ShieldCheck, Clock, AlertTriangle, Filter } from 'lucide-react';

export const InboxDPO: React.FC = () => {
  const { authState } = useAuth();
  const tenantId = authState.user?.id ?? '';
  const [tasks, setTasks] = useState<any[]>([]);
  const [filtroSetor, setFiltroSetor] = useState<string>('todos');
  const [selected, setSelected] = useState<any|null>(null);

  useEffect(()=>{
    if(!tenantId) return;
    const q = query(collection(db, 'task_evidencias'), where('tenantId','==',tenantId), where('status','==','EM_ANALISE'));
    const unsub = onSnapshot(q, snap=>{
      setTasks(snap.docs.map(d=>d.data()));
    });
    return ()=>unsub();
  },[tenantId]);

  const setores = Array.from(new Set(tasks.map(t=> t.processo_ropa_id?.split('/')[0] ?? 'Geral')));
  const filtradas = filtroSetor==='todos' ? tasks : tasks.filter(t=> (t.processo_ropa_id??'').includes(filtroSetor));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-blue-600 shrink-0"/> <span className="truncate">Fila de Auditoria — DPO</span></h2>
          <p className="text-sm text-slate-500">{tasks.length} pendências em <b>EM_ANALISE</b> • Tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0"/>
          <select value={filtroSetor} onChange={e=>setFiltroSetor(e.target.value)} className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl border bg-white text-base md:text-sm">
            <option value="todos">Todos setores</option>
            {setores.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </header>

      {filtradas.length===0 ? (
        <div className="p-8 sm:p-12 bg-white rounded-[2rem] border text-center">
          <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3"/>
          <p className="font-bold text-slate-600">Nenhuma pendência em análise</p>
          <p className="text-xs text-slate-400">Novas evidências aparecerão aqui automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtradas.map(t=>(
            <div key={t.task_id} onClick={()=>setSelected(t)} className="p-4 sm:p-5 bg-white rounded-2xl border hover:shadow-lg hover:border-blue-200 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 min-h-[44px]">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{t.titulo_task}</p>
                <p className="text-xs text-slate-500 break-words">{t.categoria_evidencia} • ROPA: {t.processo_ropa_id} • <span className="text-blue-600 font-bold">{t.requisitos_checklist?.length} requisitos</span></p>
              </div>
              <span className="self-start sm:self-auto shrink-0 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> EM_ANALISE</span>
            </div>
          ))}
        </div>
      )}

      {selected && <AuditoriaDPO task={selected} onClose={()=>setSelected(null)} onEvaluated={()=>setSelected(null)} />}
    </div>
  );
};
