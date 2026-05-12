
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileText, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { usageService } from '../services/firestoreService';
import { canAccessFeature } from '../lib/plans';
import { User } from '../types';

interface IADocumentGeneratorProps {
  onDocumentGenerated?: (title: string, content: string) => void;
}

export const IADocumentGenerator: React.FC<IADocumentGeneratorProps> = ({ onDocumentGenerated }) => {
  const { authState, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<{ used: number; total: number; remaining: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [docType, setDocType] = useState('Politica de Privacidade');
  const [context, setContext] = useState('');

  useEffect(() => {
    if (authState.user) {
      usageService.getDocCredits(authState.user).then(setCredits);
    }
  }, [authState.user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.user || !credits || credits.remaining <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const draftingFn = httpsCallable(functions, 'drafting');
      const result = await draftingFn({
        userId: authState.user.id,
        documentType: docType,
        specificContext: context
      });

      const data = result.data as { draftContent: string; version: string; status: string };
      
      // Consume credit
      await usageService.consumeDocCredit(authState.user.id, authState.user);
      
      // Update local state (context)
      const newCount = (authState.user.doc_generation_count || 0) + 1;
      updateUser({ 
        doc_generation_count: newCount,
        doc_generation_last_reset: new Date().toISOString()
      });

      if (onDocumentGenerated) {
        onDocumentGenerated(docType, data.draftContent);
      }

      setIsOpen(false);
      setContext('');
    } catch (err: any) {
      console.error('Erro ao gerar documento:', err);
      setError(err.message || 'Falha ao gerar documento com IA.');
    } finally {
      setLoading(false);
    }
  };

  const isFreePlan = authState.user?.plan === 'free';
  const hasCredits = credits && credits.remaining > 0;

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => !isFreePlan && setIsOpen(true)}
          disabled={isFreePlan || (credits && credits.remaining === 0)}
          className={`
            w-full flex items-center justify-between p-8 rounded-[2.5rem] border transition-all relative overflow-hidden
            ${isFreePlan 
              ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-700 border-blue-500 shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'}
          `}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="h-16 w-16 text-white" />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className={`p-4 rounded-2xl ${isFreePlan ? 'bg-slate-200 text-slate-400' : 'bg-white/20 text-white'}`}>
              {isFreePlan ? <Lock className="h-6 w-6" /> : <Zap className="h-6 w-6 animate-pulse" />}
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${isFreePlan ? 'text-slate-400' : 'text-white'}`}>Gerador Automático com IA</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isFreePlan ? 'text-slate-400' : 'text-blue-100'}`}>
                {isFreePlan ? 'Upgrade necessário' : 'Gere documentos em segundos'}
              </p>
            </div>
          </div>

          {credits && !isFreePlan && (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Saldo Mensal</p>
              <p className="text-sm font-black text-white">{credits.remaining} / {credits.total}</p>
            </div>
          )}

          {isFreePlan && (
            <div className="bg-slate-200 px-4 py-2 rounded-xl text-slate-400 font-bold text-xs">
              Bloqueado
            </div>
          )}
        </button>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="bg-[var(--surface)] w-full max-w-2xl flex flex-col rounded-[2rem] md:rounded-[3rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <header className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">IA Drafting Engine</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Gerador Legal de Conformidade</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </header>

              <form onSubmit={handleGenerate} className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 text-left">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle className="h-5 w-5" /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Documento</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] font-bold outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      <option value="Politica de Privacidade">Política de Privacidade</option>
                      <option value="Termos de Uso">Termos de Uso</option>
                      <option value="Termo de Consentimento">Termo de Consentimento</option>
                      {canAccessFeature(authState.user, 'documentos_avancados') && (
                        <>
                          <option value="LIA">LIA (Interesse Legítimo)</option>
                          <option value="RIPD">RIPD (Impacto à Proteção)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seu Saldo</label>
                     <div className="px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800">Créditos Restantes</span>
                        <span className="text-lg font-black text-blue-600">{credits?.remaining}</span>
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contexto Específico (Opcional)</label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Ex: Minha empresa coleta dados de geolocalização e compartilha com parceiros de logística..."
                    className="w-full h-40 px-5 py-5 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] font-bold outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full md:w-auto px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !hasCredits}
                    className="flex-1 w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-30 always-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processando com IA...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Gerar Documento Agora
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  A IA do DPO Fast redige documentos baseados na LGPD para sua revisão final.
                </p>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
