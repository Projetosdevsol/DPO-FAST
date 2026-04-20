import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { Logo } from './Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassMode, setForgotPassMode] = useState(false);

  const { authState, login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.isAuthenticated && !authState.loading) {
      navigate('/dashboard');
    }
  }, [authState.isAuthenticated, authState.loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      
      if (err.message === "SUSPENDED_ACCOUNT") {
        setError('Conta suspensa. Contate o suporte.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciais incorretas.');
      } else {
        setError('Erro ao acessar. Tente novamente.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError('Falha na autenticação Google.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Insira seu e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSuccess('E-mail enviado.');
      setForgotPassMode(false);
    } catch (err) {
      setError('Erro ao recuperar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] items-center justify-center px-6 py-12 relative overflow-hidden transition-colors duration-500">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-10 left-6 lg:left-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[var(--text-primary)] transition-all group z-50"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao início
      </Link>

      <div className="w-full max-w-[400px] z-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <Link to="/">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Entrar na Platforma</h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Insira suas credenciais para continuar.</p>
        </div>

        <div className="space-y-8">
          {(error || success) && (
            <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-500 ${
              error ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
            }`}>
              {error || success}
            </div>
          )}
          
          <form onSubmit={forgotPassMode ? handleForgotPassword : handleEmailLogin} className="space-y-6">
            <div className="space-y-1">
              <input
                type="email"
                placeholder="E-mail Corporativo"
                className="w-full px-0 py-4 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {!forgotPassMode && (
              <div className="space-y-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha de Acesso"
                  className="w-full px-0 py-4 bg-transparent border-b border-[var(--border)] focus:border-blue-500 outline-none transition-all text-sm font-medium text-[var(--text-primary)] placeholder:text-slate-500"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-4 text-slate-500 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-end pt-1">
              <button type="button" onClick={() => setForgotPassMode(!forgotPassMode)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
                {forgotPassMode ? 'Voltar para login' : 'Recuperar senha?'}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 rounded-2xl always-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (forgotPassMode ? 'Enviar Link de Recuperação' : 'Entrar no Dashboard')}
            </button>
          </form>

          {!forgotPassMode && (
            <div className="space-y-8 pt-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-[var(--border)]"></div>
                <span className="relative px-4 bg-[var(--background)] text-[9px] font-black text-slate-500 uppercase tracking-widest transition-colors duration-500">ou continue com</span>
              </div>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-transparent border border-[var(--border)] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
              >
                Google Identity
              </button>
            </div>
          )}

          <div className="text-center pt-8 border-t border-[var(--border)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Novo no LGPD Fácil? <Link to="/register" className="text-blue-600 hover:underline ml-2">Criar conta grátis</Link>
            </p>
          </div>
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
