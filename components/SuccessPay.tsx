import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../lib/firebase';

export const SuccessPay: React.FC = () => {
  const navigate = useNavigate();
  const { authState, updateUser } = useAuth();

  useEffect(() => {
    const activateSubscription = async () => {
      if (authState.user?.id) {
        try {
          // Atualiza no Firestore para garantir persistência
          await updateDoc(doc(db, 'users', authState.user.id), {
            status_assinatura: 'active'
          });
          // Atualiza o estado local para navegação imediata
          await updateUser({ status_assinatura: 'active' });
          console.log('Assinatura ativada com sucesso via página de retorno.');
        } catch (error) {
          console.error('Erro ao ativar assinatura:', error);
        }
      }
    };

    activateSubscription();
  }, [authState.user?.id, authState.user?.status_assinatura]);

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
          <p className="text-[var(--text-muted)] font-medium leading-relaxed">Sua conta agora está sob a proteção da rede <span className="text-blue-500 font-bold">LGPD Fácil</span>.</p>
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
          Ambiente Seguro LGPD Fácil
        </div>
      </div>
    </div>
  );
};
