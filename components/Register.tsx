import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ChevronLeft, Loader2, ShieldCheck, User, Building, Mail, Lock, Hash, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

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

  useEffect(() => {
    if (authState.isAuthenticated && !authState.loading) {
      navigate('/dashboard', { state: { isFirstVisit: true } });
    }
  }, [authState.isAuthenticated, authState.loading, navigate]);

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
    } catch (err: any) {
      setLoading(false);
      setErrors({ general: 'Erro ao cadastrar. Tente outro e-mail.' });
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] items-center justify-center px-6 py-20 relative overflow-hidden transition-colors duration-500">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-10 left-6 lg:left-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--text-primary)] transition-all group z-50"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao início
      </Link>

      <div className="w-full max-w-2xl z-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Link to="/">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Criar sua Conta</h1>
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Plano Selecionado:</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{selectedPlan}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {errors.general && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 text-center">{errors.general}</div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
              <input type="text" required className="w-full px-0 py-3 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-200" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: João Silva" />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail Profissional</label>
              <input type="email" required className="w-full px-0 py-3 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-200" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="joao@empresa.com" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome da Organização</label>
              <input type="text" required className="w-full px-0 py-3 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-200" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Sua Empresa Ltda" />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Documento (CNPJ)</label>
              <input type="text" required maxLength={18} className={`w-full px-0 py-3 bg-transparent border-b outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-200 ${errors.cnpj ? 'border-red-500 text-red-500' : 'border-[var(--border)] focus:border-blue-500'}`} value={formData.cnpj} onChange={handleCnpjChange} placeholder="00.000.000/0000-00" />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha de Segurança</label>
              <input type="password" required minLength={6} className="w-full px-0 py-3 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-200" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-5 rounded-2xl always-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Finalizar e Acessar'}
            </button>
            <p className="mt-6 text-center text-[9px] text-slate-500 font-medium leading-relaxed">
              Ao clicar em finalizar, você concorda com nossos <span className="text-blue-500 cursor-pointer underline">Termos</span> e com a <span className="text-blue-500 cursor-pointer underline">Política de Privacidade</span>.
            </p>
          </div>
        </form>

        <div className="text-center pt-8 border-t border-[var(--border)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Já possui uma conta? <Link to="/login" className="text-blue-600 hover:underline ml-2">Entrar agora</Link>
          </p>
        </div>
      </div>

      <footer className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] pointer-events-auto">
            Solution © 2026 | Desenvolvido por <a href="https://felipe-84bca.web.app/" target="_blank" className="text-blue-600 hover:underline">Felipe Sadrak</a>
         </p>
      </footer>
    </div>
  );
};
