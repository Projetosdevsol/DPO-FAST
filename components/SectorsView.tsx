
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
  
  // Estados para novo setor customizado
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

  const handleToggleSector = async (sectorName: string, isCustom: boolean = false) => {
    if (!qData) return;
    
    setLoading(true);
    const sectors = qData.sectors || [];
    const exists = sectors.find(s => s.name.toLowerCase() === sectorName.toLowerCase());
    
    let updatedSectors;
    if (exists) {
      // Regra de segurança para setores trancados
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
      <div className="py-20 text-center space-y-4 px-6 bg-white rounded-[2.5rem] border border-slate-100">
        <Building className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold">Configure sua Empresa</h3>
        <p className="text-slate-400">Você precisa definir o porte e a indústria no Mapeamento antes de gerenciar os setores.</p>
        <button onClick={() => navigate('/dashboard/mapeamento')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold">Ir para Mapeamento</button>
      </div>
    );
  }

  const activeSectors = qData.sectors || [];
  const customActiveSectors = activeSectors.filter(s => !PRESET_SECTORS.includes(s.name));

  return (
    <div className="space-y-8 page-transition pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Departamentos</h2>
          <p className="text-slate-500 font-medium">Defina a estrutura organizacional para o mapeamento LGPD.</p>
        </div>
        <div className="flex gap-2">
           <span className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl border border-slate-200 shadow-sm">{qData.companySize}</span>
           <span className="px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-xl border border-blue-100 shadow-sm">{qData.industry}</span>
        </div>
      </header>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 font-bold animate-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5" /> {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
          <Info className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Como funciona a gestão de setores?</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ative os departamentos da sua operação. Use o <strong>cadeado</strong> para trancar setores vitais e evitar que mapeamentos importantes sejam apagados sem querer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Renderiza Presets */}
          {PRESET_SECTORS.map(s => {
            const sectorObj = activeSectors.find(sec => sec.name === s);
            const isSelected = !!sectorObj;
            const isLocked = sectorObj?.isLocked;

            return (
              <div key={s} className="relative group/card">
                <button 
                  onClick={() => !loading && handleToggleSector(s)} 
                  disabled={loading}
                  className={`w-full p-6 rounded-[2rem] border transition-all text-left flex flex-col justify-between h-32 ${isSelected ? (isLocked ? 'bg-blue-600 border-amber-400 border-2 shadow-xl shadow-blue-100' : 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100') : 'bg-white border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                      <Layers className="h-4 w-4" />
                    </div>
                    {isSelected ? <CheckCircle className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>{s}</span>
                </button>
                
                {isSelected && (
                  <button 
                    onClick={(e) => handleToggleLock(e, sectorObj!.id)}
                    className={`absolute top-4 right-12 p-2 rounded-lg transition-all ${isLocked ? 'bg-amber-400 text-slate-900 shadow-md scale-110' : 'bg-white/20 text-white hover:bg-white/40 opacity-0 group-hover/card:opacity-100'}`}
                    title={isLocked ? 'Setor Protegido' : 'Trancar Setor'}
                  >
                    {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            );
          })}

          {/* Renderiza Customizados */}
          {customActiveSectors.map(s => (
            <div key={s.id} className="relative group/card">
              <button 
                onClick={() => !loading && handleToggleSector(s.name, true)} 
                disabled={loading}
                className={`w-full p-6 rounded-[2rem] border transition-all text-left flex flex-col justify-between h-32 animate-in zoom-in-95 ${s.isLocked ? 'bg-indigo-600 border-amber-400 border-2 shadow-xl shadow-indigo-100' : 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="p-2 rounded-xl bg-white/20 text-white">
                    <Layers className="h-4 w-4" />
                  </div>
                  <X className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">Personalizado</p>
                  <span className="text-xs font-black uppercase tracking-tight text-white truncate block w-full">{s.name}</span>
                </div>
              </button>

              <button 
                onClick={(e) => handleToggleLock(e, s.id)}
                className={`absolute top-4 right-12 p-2 rounded-lg transition-all ${s.isLocked ? 'bg-amber-400 text-slate-900 shadow-md scale-110' : 'bg-white/20 text-white hover:bg-white/40 opacity-0 group-hover/card:opacity-100'}`}
                title={s.isLocked ? 'Setor Protegido' : 'Trancar Setor'}
              >
                {s.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}

          {/* Card para Adicionar Novo */}
          {!isAddingCustom ? (
            <button 
              onClick={() => setIsAddingCustom(true)}
              disabled={loading}
              className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all text-center flex flex-col items-center justify-center h-32 group"
            >
              <Plus className="h-6 w-6 text-slate-300 group-hover:text-blue-600 mb-2 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Adicionar Personalizado</span>
            </button>
          ) : (
            <div className="p-5 rounded-[2rem] border-2 border-blue-400 bg-white shadow-xl shadow-blue-50 h-32 flex flex-col justify-between animate-in slide-in-from-right-2">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Novo Departamento</p>
                <button onClick={() => setIsAddingCustom(false)} className="text-slate-300 hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="relative">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome do Setor..."
                  className="w-full text-xs font-bold text-slate-950 outline-none placeholder:text-slate-300 bg-white"
                  value={customSectorName}
                  onChange={(e) => setCustomSectorName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
              </div>
              <button 
                onClick={handleAddCustom}
                disabled={!customSectorName.trim() || loading}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Confirmar
              </button>
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
               <div className="h-2 w-2 rounded-full bg-blue-600"></div>
               {activeSectors.length} Setores Ativos
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
               <Lock className="h-3.5 w-3.5" />
               {activeSectors.filter(s => s.isLocked).length} Protegidos
             </div>
           </div>
           <button 
             onClick={() => navigate('/dashboard/mapeamento')} 
             className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
           >
             Acessar Inventário Detalhado <ChevronRight className="h-4 w-4" />
           </button>
        </div>
      </div>
    </div>
  );
};
