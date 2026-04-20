import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Layers, 
  Plus, 
  CheckCircle, 
  Info, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  X,
  Check,
  Lock,
  Unlock
} from 'lucide-react';
import { QuestionnaireData, SectorMapping } from '../types';
import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS } from '../lib/plans';

interface SectorsViewProps {
  qData: QuestionnaireData | null;
  onSave: (data: QuestionnaireData) => Promise<void>;
}

const PRESET_SECTORS = [
  'RH / DP', 'Marketing', 'Vendas', 'Atendimento', 
  'Financeiro', 'TI', 'Jurídico', 'Logística', 
  'Compras', 'Diretoria'
];

export const SectorsView: React.FC<SectorsViewProps> = ({ qData, onSave }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customSectorName, setCustomSectorName] = useState('');

  const handleToggleLock = async (e: React.MouseEvent, sectorId: string) => {
    e.stopPropagation();
    if (!qData) return;

    const updatedSectors = (qData.sectors || []).map(s => 
      s.id === sectorId ? { ...s, isLocked: !s.isLocked } : s
    );

    const updatedData = { ...qData, sectors: updatedSectors, lastUpdated: new Date().toISOString() };
    try {
      await onSave(updatedData);
      setSuccess('Status de proteção atualizado.');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Erro ao trancar setor.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const { authState } = useAuth();
  
  const handleToggleSector = async (sectorName: string, isCustom: boolean = false) => {
    if (!qData || !authState.user) return;
    
    setLoading(true);
    const sectors = qData.sectors || [];
    const exists = sectors.find(s => s.name.toLowerCase() === sectorName.toLowerCase());
    
    if (!exists) {
      const planLimits = PLAN_LIMITS[authState.user.plan] || PLAN_LIMITS.basico;
      if (sectors.length >= planLimits.limite_setores) {
        setLoading(false);
        setError(`Limite de setores atingido para o plano ${authState.user.plan.toUpperCase()}.`);
        const wantUpgrade = confirm(
          `LIMITE ATINGIDO\n\n` +
          `Seu plano atual (${authState.user.plan.toUpperCase()}) permite apenas ${planLimits.limite_setores} setores.\n\n` +
          `Deseja ver nossos planos Pro para desbloquear setores ilimitados?`
        );
        if (wantUpgrade) navigate('/planos');
        return;
      }
    }
    
    let updatedSectors;
    if (exists) {
      if (exists.isLocked) {
        const confirmUnlockRemove = confirm(
          `AVISO DE SEGURANÇA: O setor "${sectorName}" está marcado como IMPORTANTE.\n\n` +
          `A exclusão apagará permanentemente todos os fluxos de dados e mapeamentos vinculados a ele.\n\n` +
          `Deseja prosseguir com a remoção total?`
        );
        if (!confirmUnlockRemove) {
          setLoading(false);
          return;
        }
      } else if (exists.processes && exists.processes.length > 0) {
        const confirmDelete = confirm(`O setor "${sectorName}" possui processos mapeados. Deseja realmente removê-lo e excluir todos os seus dados?`);
        if (!confirmDelete) {
          setLoading(false);
          return;
        }
      }
      updatedSectors = sectors.filter(s => s.id !== exists.id);
    } else {
      const newSector: SectorMapping = {
        id: Math.random().toString(36).substr(2, 9),
        name: sectorName,
        isCustom: isCustom,
        processes: [],
        isLocked: false
      };
      updatedSectors = [...sectors, newSector];
    }

    const updatedData = { ...qData, sectors: updatedSectors, lastUpdated: new Date().toISOString() };
    try {
      await onSave(updatedData);
      setSuccess(exists ? 'Setor removido.' : 'Setor adicionado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
      if (!exists && isCustom) {
        setIsAddingCustom(false);
        setCustomSectorName('');
      }
    } catch (err) {
      setError('Erro ao salvar estrutura.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustom = () => {
    if (!customSectorName.trim()) {
      setIsAddingCustom(false);
      return;
    }
    handleToggleSector(customSectorName.trim(), true);
  };

  if (!qData) {
    return (
      <div className="py-20 text-center space-y-6 px-6 bg-[var(--surface)] glass-card">
        <Building className="h-16 w-16 text-slate-300 mx-auto" />
        <h3 className="text-2xl font-black text-[var(--text-primary)]">Configure sua Empresa</h3>
        <p className="text-slate-500 max-w-sm mx-auto">Você precisa definir o porte e a indústria no Mapeamento antes de gerenciar os setores.</p>
        <button onClick={() => navigate('/dashboard/mapeamento')} className="btn-primary always-white">Ir para Mapeamento</button>
      </div>
    );
  }

  const activeSectors = qData.sectors || [];
  const customActiveSectors = activeSectors.filter(s => !PRESET_SECTORS.includes(s.name));

  return (
    <div className="space-y-8 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Departamentos</h2>
          <p className="text-slate-500 font-medium">Defina a estrutura organizacional para o mapeamento LGPD.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
           <span className="px-5 py-2 bg-[var(--surface-muted)] text-slate-600 text-[10px] font-black uppercase rounded-2xl border border-[var(--border)]">{qData.companySize}</span>
           <span className="px-5 py-2 bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase rounded-2xl border border-blue-500/20">{qData.industry}</span>
        </div>
      </header>

      {success && (
        <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-600 font-bold animate-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 font-bold animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      <div className="bg-[var(--surface)] p-6 md:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-10">
        <div className="bg-[var(--surface-muted)] p-8 rounded-3xl border border-[var(--border)] flex flex-col md:flex-row items-start gap-6">
          <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl shrink-0">
            <Info className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black text-[var(--text-primary)]">Gestão de departamentos</p>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Ative os departamentos da sua operação. Use o <strong>cadeado</strong> para trancar setores vitais e evitar que mapeamentos importantes sejam apagados sem querer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {PRESET_SECTORS.map(s => {
            const sectorObj = activeSectors.find(sec => sec.name === s);
            const isSelected = !!sectorObj;
            const isLocked = sectorObj?.isLocked;

            return (
              <div key={s} className="relative group/card">
                <button 
                  onClick={() => !loading && handleToggleSector(s)} 
                  disabled={loading}
                  className={`w-full p-8 rounded-[2.5rem] border transition-all text-left flex flex-col justify-between h-40 ${isSelected ? (isLocked ? 'bg-blue-600 border-amber-400 border-2 shadow-xl shadow-blue-900/20' : 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-900/20') : 'bg-[var(--surface)] border-[var(--border)] hover:border-blue-500/50'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-3 rounded-2xl ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-slate-400 group-hover:text-blue-500'}`}>
                      <Layers className="h-5 w-5" />
                    </div>
                    {isSelected ? <CheckCircle className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-slate-300 group-hover:text-blue-500" />}
                  </div>
                  <span className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>{s}</span>
                </button>
                
                {isSelected && (
                  <button 
                    onClick={(e) => handleToggleLock(e, sectorObj!.id)}
                    className={`absolute top-6 right-14 p-2.5 rounded-xl transition-all ${isLocked ? 'bg-amber-400 text-slate-900 shadow-lg scale-110' : 'bg-white/20 text-white hover:bg-white/40 opacity-0 group-hover/card:opacity-100'}`}
                    title={isLocked ? 'Setor Protegido' : 'Trancar Setor'}
                  >
                    {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </button>
                )}
              </div>
            );
          })}

          {customActiveSectors.map(s => (
            <div key={s.id} className="relative group/card">
              <button 
                onClick={() => !loading && handleToggleSector(s.name, true)} 
                disabled={loading}
                className={`w-full p-8 rounded-[2.5rem] border transition-all text-left flex flex-col justify-between h-40 animate-in zoom-in-95 ${s.isLocked ? 'bg-indigo-600 border-amber-400 border-2 shadow-xl shadow-indigo-900/20' : 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-900/20'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="p-3 rounded-2xl bg-white/20 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <X className="h-5 w-5 text-white/50 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest opacity-70">Personalizado</p>
                  <span className="text-sm font-black uppercase tracking-tight text-white truncate block w-full">{s.name}</span>
                </div>
              </button>

              <button 
                onClick={(e) => handleToggleLock(e, s.id)}
                className={`absolute top-6 right-14 p-2.5 rounded-xl transition-all ${s.isLocked ? 'bg-amber-400 text-slate-900 shadow-lg scale-110' : 'bg-white/20 text-white hover:bg-white/40 opacity-0 group-hover/card:opacity-100'}`}
                title={s.isLocked ? 'Setor Protegido' : 'Trancar Setor'}
              >
                {s.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>
          ))}

          {!isAddingCustom ? (
            <button 
              onClick={() => setIsAddingCustom(true)}
              disabled={loading}
              className="p-8 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:border-blue-500/50 transition-all text-center flex flex-col items-center justify-center h-40 group"
            >
              <div className="p-4 rounded-full bg-slate-500/5 group-hover:bg-blue-600/10 transition-colors mb-2">
                <Plus className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:rotate-90" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Adicionar Personalizado</span>
            </button>
          ) : (
            <div className="p-6 rounded-[2.5rem] border-2 border-blue-600 bg-[var(--surface)] shadow-2xl shadow-blue-500/10 h-40 flex flex-col justify-between animate-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Novo Departamento</p>
                <button onClick={() => setIsAddingCustom(false)} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="relative">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome do Setor..."
                  className="w-full text-sm font-bold text-[var(--text-primary)] outline-none placeholder:text-slate-300 bg-transparent"
                  value={customSectorName}
                  onChange={(e) => setCustomSectorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
              </div>
              <button 
                onClick={handleAddCustom}
                disabled={!customSectorName.trim() || loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Confirmar
              </button>
            </div>
          )}
        </div>

        <div className="pt-10 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex flex-wrap items-center gap-8">
             <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500">
               <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
               {activeSectors.length} Setores Ativos
             </div>
             <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-amber-500">
               <Lock className="h-4 w-4" />
               {activeSectors.filter(s => s.isLocked).length} Protegidos
             </div>
           </div>
           <button 
             onClick={() => navigate('/dashboard/mapeamento')} 
             className="btn-primary w-full sm:w-auto px-10 py-5 flex items-center justify-center gap-3 always-white"
           >
             Mapear Processos <ChevronRight className="h-4 w-4" />
           </button>
        </div>
      </div>
    </div>
  );
};
