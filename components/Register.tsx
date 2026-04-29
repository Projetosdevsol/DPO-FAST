import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { STRIPE_LINKS } from '../lib/stripe';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    cnpj: '',
    address: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { authState, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'basico';

  // Removido useEffect de redirecionamento automático para não interferir no fluxo do Stripe após cadastro

  const validateCnpj = (cnpj: string) => {
    const digitsOnly = cnpj.replace(/\D/g, '');
    return digitsOnly.length === 14;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 14);
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) formatted += '.' + value.substring(2, 5);
      if (value.length > 5) formatted += '.' + value.substring(5, 8);
      if (value.length > 8) formatted += '/' + value.substring(8, 12);
      if (value.length > 12) formatted += '-' + value.substring(12, 14);
    }
    setFormData({ ...formData, cnpj: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateCnpj(formData.cnpj)) {
      setErrors({ cnpj: 'CNPJ inválido.' });
      return;
    }
    setLoading(true);
    try {
      await register({ ...formData, plan: selectedPlan });
      
      if (['basico', 'pro', 'personalite'].includes(selectedPlan)) {
        const stripeUrl = STRIPE_LINKS[selectedPlan as keyof typeof STRIPE_LINKS];
        console.log('Iniciando redirecionamento para o Stripe:', selectedPlan, stripeUrl);

        if (stripeUrl && stripeUrl.startsWith('http')) {
          window.location.href = stripeUrl;
          return;
        }
      }
      
      navigate('/dashboard', { state: { isFirstVisit: true } });
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: 'Erro ao cadastrar. Tente outro e-mail.' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-y-auto">
      <div className="google-card max-w-2xl animate-in fade-in zoom-in-95 duration-500 my-8">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <Link to="/" className="mb-2">
            <Logo className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-normal text-[var(--text-primary)]">Criar sua Conta</h1>
            <p className="text-base text-[var(--text-primary)]">Comece sua jornada de conformidade</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-full">
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Plano:</span>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">{selectedPlan}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800/20 animate-in fade-in slide-in-from-top-2">
              {errors.general}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="google-input-container">
              <input type="text" id="name" required className="google-input peer" placeholder=" " value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <label htmlFor="name" className="floating-label">Nome Completo</label>
            </div>

            <div className="google-input-container">
              <input type="email" id="email" required className="google-input peer" placeholder=" " value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <label htmlFor="email" className="floating-label">E-mail Profissional</label>
            </div>

            <div className="google-input-container md:col-span-2">
              <input type="text" id="companyName" required className="google-input peer" placeholder=" " value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
              <label htmlFor="companyName" className="floating-label">Nome da Organização</label>
            </div>

            <div className="google-input-container">
              <input type="text" id="cnpj" required maxLength={18} className={`google-input peer ${errors.cnpj ? 'border-red-500' : ''}`} placeholder=" " value={formData.cnpj} onChange={handleCnpjChange} />
              <label htmlFor="cnpj" className={`floating-label ${errors.cnpj ? 'text-red-500' : ''}`}>Documento (CNPJ)</label>
            </div>

            <div className="google-input-container">
              <input type="password" id="password" required minLength={6} className="google-input peer" placeholder=" " value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <label htmlFor="password" className="floating-label">Senha de Segurança</label>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link to="/login" className="text-[var(--primary)] font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 px-4 py-2 rounded transition-colors w-full sm:w-auto text-center">
              Já tenho uma conta
            </Link>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full sm:min-w-[160px] flex items-center justify-center py-3 sm:py-2.5"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Finalizar e Acessar'}
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] text-center leading-relaxed max-w-md mx-auto">
            Ao clicar em finalizar, você concorda com nossos <span className="text-[var(--primary)] cursor-pointer hover:underline">Termos</span> e <span className="text-[var(--primary)] cursor-pointer hover:underline">Política de Privacidade</span>.
          </p>
        </form>
      </div>

      <footer className="mt-auto py-8 w-full max-w-4xl px-6 flex flex-col md:flex-row justify-between items-center text-xs text-[var(--text-muted)] space-y-6 md:space-y-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
            Português (Brasil) <ChevronDown className="h-3 w-3" />
          </div>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Ajuda</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacidade</a>
          <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Termos</a>
        </div>
      </footer>
    </div>
  );
};
