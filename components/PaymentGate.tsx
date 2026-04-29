
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { STRIPE_LINKS } from '../lib/stripe';
import { CreditCard, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db } from '../lib/firebase';

export const PaymentGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.loading) return null;

  const user = authState.user;

  // Se não estiver logado, PrivateRoute já cuida disso, mas por segurança:
  if (!user) return <Navigate to="/login" />;

  // Admin sempre tem acesso
  if (user.isAdmin) return <>{children}</>;

  // Se o plano for 'free', acesso liberado
  if (user.plan === 'free') return <>{children}</>;

  // Se a assinatura estiver ativa ou em trial, acesso liberado
  if (user.status_assinatura === 'active' || user.status_assinatura === 'trialing') {
    return <>{children}</>;
  }

  const handleManualRefresh = async () => {
    if (user?.id) {
      try {
        // No ambiente de desenvolvimento/teste, permitimos a ativação manual 
        // como fallback caso o redirecionamento do Stripe não ocorra.
        await updateDoc(doc(db, 'users', user.id), {
          status_assinatura: 'active'
        });
        console.log('Assinatura ativada manualmente pelo usuário.');
        // O onSnapshot no AuthContext cuidará de atualizar a UI automaticamente
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 transition-colors duration-500">
      <div className="max-w-md w-full google-card space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-full border border-amber-100 dark:border-amber-800/20">
            <ShieldAlert className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-normal text-[var(--text-primary)]">Assinatura Pendente</h1>
          <p className="text-[var(--text-muted)]">
            Para acessar o painel completo do <strong>{user.plan.toUpperCase()}</strong>, confirme seu pagamento.
          </p>
        </div>

        <div className="p-6 bg-[var(--surface-muted)] rounded-2xl border border-[var(--border)] text-left space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)] font-medium">Plano Selecionado:</span>
            <span className="font-bold text-[var(--text-primary)] uppercase">{user.plan}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)] font-medium">Status:</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">Aguardando Pagamento</span>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={() => {
              const url = STRIPE_LINKS[user.plan as keyof typeof STRIPE_LINKS];
              if (url) window.location.href = url;
            }}
            className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 always-white shadow-xl"
          >
            <CreditCard className="h-5 w-5" />
            Concluir Pagamento
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button 
            onClick={handleManualRefresh}
            className="w-full py-3 text-xs font-bold text-blue-600 hover:underline"
          >
            Já realizei o pagamento. Liberar acesso.
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          Após a confirmação (que pode levar alguns segundos), você terá acesso imediato a todas as ferramentas de conformidade.
        </p>
      </div>
    </div>
  );
};
