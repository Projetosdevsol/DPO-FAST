import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ChevronDown, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Botão de Voltar */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all group z-50"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </Link>

      <div className="auth-card max-w-2xl animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="mb-6 transform hover:scale-105 transition-transform">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Começar Agora</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inicie sua jornada de adequação à LGPD</p>
          </div>
          
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 shadow-sm shadow-blue-500/5">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Plano Selecionado:</span>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{selectedPlan}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {errors.general}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="name" className="auth-label">Seu Nome</label>
              <input type="text" id="name" required className="auth-input" placeholder="João Silva" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="auth-label">E-mail Profissional</label>
              <input type="email" id="email" required className="auth-input" placeholder="joao@empresa.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label htmlFor="companyName" className="auth-label">Nome da Organização</label>
              <input type="text" id="companyName" required className="auth-input" placeholder="Empresa S.A." value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label htmlFor="cnpj" className={`auth-label ${errors.cnpj ? 'text-red-500' : ''}`}>Documento (CNPJ)</label>
              <input type="text" id="cnpj" required maxLength={18} className={`auth-input ${errors.cnpj ? 'border-red-200 bg-red-50/30' : ''}`} placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={handleCnpjChange} />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="auth-label">Sua Senha</label>
              <input type="password" id="password" required minLength={6} className="auth-input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Finalizar e Acessar'}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ou</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Link 
              to="/login" 
              className="flex items-center justify-center w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 hover:border-slate-200 transition-all"
            >
              Já tenho uma conta
            </Link>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed font-bold uppercase tracking-widest max-w-[280px] mx-auto">
            Ao continuar, você concorda com nossos <span className="text-blue-500 cursor-pointer hover:underline">Termos</span> e <span className="text-blue-500 cursor-pointer hover:underline">Privacidade</span>.
          </p>
        </form>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none">
        DPO FAST © {new Date().getFullYear()}
      </div>
    </div>
  );
};
