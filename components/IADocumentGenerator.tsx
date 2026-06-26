import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  X, 
  Zap, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js';
import { functions } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { QuestionnaireData } from '../types';

interface IADocumentGeneratorProps {
  qData: QuestionnaireData | null;
  onDocumentGenerated?: (title: string, content: string) => void;
}

export const IADocumentGenerator: React.FC<IADocumentGeneratorProps> = ({ qData, onDocumentGenerated }) => {
  const { authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paywall check: PRO/Personalité
  // O Personalité possui acesso direto (assinatura manual por contrato). O PRO exige status ativo no Stripe.
  const plan = (authState.user?.plan || authState.user?.subscription?.plan || 'free').toLowerCase();
  const isActiveSignature = authState.user?.status_assinatura === 'active' || 
                            authState.user?.status_assinatura === 'trialing' || 
                            !authState.user?.status_assinatura;
  const isPro = ['pro', 'prata'].includes(plan);
  const isPersonalite = ['personalite', 'personalité', 'ouro'].includes(plan);
  const hasAccess = isPersonalite || (isPro && isActiveSignature);
  const isFree = ['free', 'basico'].includes(plan);

  // Form State
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [templateName, setTemplateName] = useState<'LIA' | 'RIPD' | 'Politica de Privacidade' | 'Termos de Uso' | 'Termo de Consentimento'>('Politica de Privacidade');

  // Pre-fill selected sector when data is loaded
  useEffect(() => {
    if (qData?.sectors && qData.sectors.length > 0) {
      setSelectedSectorId(qData.sectors[0].id);
    }
  }, [qData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.user) return;
    if (!hasAccess) {
      setError('Sua assinatura não permite usar esta funcionalidade.');
      return;
    }
    if (!selectedSectorId) {
      setError('Por favor, selecione um setor que tenha sido mapeado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generateFn = httpsCallable(functions, 'generateDocumentFromTemplate');
      const result = await generateFn({
        userId: authState.user.id,
        sectorId: selectedSectorId,
        templateName: templateName
      });

      const data = result.data as { documentContent: string; title: string; createdAt: string };

      if (onDocumentGenerated) {
        onDocumentGenerated(data.title, data.documentContent);
      }

      setIsOpen(false);
    } catch (err: any) {
      console.error('Erro ao gerar documento por template:', err);
      setError(err.message || 'Falha ao gerar o documento com IA.');
    } finally {
      setLoading(false);
    }
  };

  const sectors = qData?.sectors || [];

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => {
            if (hasAccess) {
              setIsOpen(true);
            }
          }}
          disabled={isFree}
          className={`
            w-full flex items-center justify-between p-8 rounded-[2.5rem] border transition-all relative overflow-hidden text-left
            ${!hasAccess 
              ? 'bg-slate-100/80 border-slate-200 cursor-not-allowed opacity-60' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-700 border-blue-500 shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'}
          `}
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="h-16 w-16 text-white" />
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className={`p-4 rounded-2xl ${!hasAccess ? 'bg-slate-200 text-slate-500' : 'bg-white/20 text-white'}`}>
              {!hasAccess ? <Lock className="h-6 w-6" /> : <Zap className="h-6 w-6 animate-pulse" />}
            </div>
            <div className="text-left">
              <h3 className={`font-bold ${!hasAccess ? 'text-slate-500' : 'text-white'}`}>Gerador Automatizado de Documentos LGPD</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${!hasAccess ? 'text-slate-400' : 'text-blue-100'}`}>
                {isFree 
                  ? 'Faça o upgrade para o plano PRO ou entre em contato para o plano Personalité' 
                  : !hasAccess 
                    ? 'Exclusivo PRO / Personalité (Assinatura Inativa)' 
                    : 'Crie relatórios com base nos mapeamentos'}
              </p>
            </div>
          </div>

          {!hasAccess ? (
            <div className="bg-slate-300 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
              <Lock className="h-4 w-4" />
              <span>Bloqueado</span>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right relative z-10 text-white font-bold text-xs uppercase tracking-widest">
              Acessar Gerador
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
                    <h3 className="text-xl font-black tracking-tight">IA Document Generator</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Geração Automatizada com templates LGPD</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Setor Mapeado</label>
                    <select
                      value={selectedSectorId}
                      onChange={(e) => setSelectedSectorId(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] font-bold outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      {sectors.length === 0 ? (
                        <option value="">Nenhum setor disponível</option>
                      ) : (
                        sectors.map((sector) => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Template de Documento</label>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value as any)}
                      className="w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] font-bold outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all cursor-pointer"
                    >
                      <option value="Politica de Privacidade">Política de Privacidade</option>
                      <option value="Termos de Uso">Termos de Uso</option>
                      <option value="Termo de Consentimento">Termo de Consentimento</option>
                      <option value="LIA">Avaliação de Legítimo Interesse (LIA)</option>
                      <option value="RIPD">Relatório de Impacto (RIPD)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Informações do Fluxo</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    A inteligência artificial irá analisar todas as respostas inseridas no setor selecionado, carregar o template padrão e redigir o documento preenchendo todos os requisitos legais.
                  </p>
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
                    disabled={loading || sectors.length === 0}
                    className="flex-1 w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-30 always-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Gerando Documento por IA...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Gerar Documento por IA
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  Este processo consome os dados do Firestore para gerar documentos personalizados.
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
