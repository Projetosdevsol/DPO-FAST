import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const SuccessPay: React.FC = () => {
  const navigate = useNavigate();
  const { authState, updateUser } = useAuth();
  const [isActivating, setIsActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se o estado de autenticação ainda está carregando, aguarde.
    if (authState.loading) return;

    // Se o estado terminou de carregar mas não há usuário logado:
    if (!authState.user) {
      setError('Nenhum usuário autenticado encontrado. Por favor, faça login.');
      setIsActivating(false);
      return;
    }

    const activateSubscription = async () => {
      try {
        // Atualiza no Firestore para garantir persistência no banco
        await updateDoc(doc(db, 'users', authState.user!.id), {
          status_assinatura: 'active'
        });
        
        // Atualiza o estado local do contexto de autenticação imediatamente
        await updateUser({ status_assinatura: 'active' });
        
        console.log('Assinatura ativada com sucesso via página de retorno.');
        setIsActivating(false);
      } catch (err: any) {
        console.error('Erro ao ativar assinatura:', err);
        setError('Houve um erro ao processar a ativação da sua assinatura. Por favor, tente atualizar a página.');
        setIsActivating(false);
      }
    };

    // Só dispara se o status atual do usuário for diferente de 'active'
    if (authState.user.status_assinatura !== 'active') {
      activateSubscription();
    } else {
      setIsActivating(false);
    }
  }, [authState.loading, authState.user?.id]);

  if (isActivating) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <h2 className="text-xl font-black text-[var(--text-primary)]">Ativando sua assinatura...</h2>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Aguardando confirmação segura do banco de dados</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6 text-center space-y-6">
        <h2 className="text-xl font-black text-red-500">Erro de Ativação</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest always-white">
          Ir para Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6 py-12 relative overflow-hidden transition-colors duration-500">
      {/* Background Glow - Subtle & Theme-Aware */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/[0.05] blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="max-w-md w-full glass-card p-12 text-center space-y-10 animate-in zoom-in-95 duration-700 relative z-10">
        <div className="flex justify-center">
           <div className="p-1 bg-blue-600/10 rounded-full">
              <div className="p-8 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-900/50 relative overflow-hidden always-white">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <CheckCircle2 className="h-16 w-16 relative" />
              </div>
           </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <Logo className="h-8 w-10 opacity-50" />
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Assinatura Ativada!</h1>
          <p className="text-[var(--text-muted)] font-medium leading-relaxed">Sua conta agora está sob a proteção da rede <span className="text-blue-500 font-bold">DPO Fast</span>.</p>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          {[
            "Blindagem jurídica desbloqueada",
            "Mapeamento ilimitado de processos",
            "DPO IA Qwen disponível 24/7"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3 justify-center group">
              <Sparkles className="h-4 w-4 text-blue-400 opacity-50 group-hover:opacity-100 transition-all" />
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{text}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-primary w-full py-5 text-sm flex items-center justify-center gap-3 always-white"
        >
          Acessar Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
        
        <div className="flex items-center justify-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
          <ShieldCheck className="h-4 w-4" />
          Ambiente Seguro DPO Fast
        </div>
      </div>
    </div>
  );
};
