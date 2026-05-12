import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Loader2,
  ChevronDown,
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
      setSuccess('E-mail de recuperação enviado.');
      setForgotPassMode(false);
    } catch (err) {
      setError('Erro ao recuperar senha. Verifique o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Botão de Voltar */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all group z-50"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </Link>

      <div className="auth-card animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <Link to="/" className="mb-6 transform hover:scale-105 transition-transform">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Bem-vindo de volta</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acesse sua jornada de conformidade</p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 text-green-600 text-xs font-bold rounded-2xl border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {success}
            </div>
          )}
          
          <form onSubmit={forgotPassMode ? handleForgotPassword : handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="auth-label">E-mail Profissional</label>
              <input 
                type="email" 
                id="email" 
                required 
                className="auth-input" 
                placeholder="nome@empresa.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-2">
                <label htmlFor="password" className="auth-label !mb-0 !ml-0">Sua Senha</label>
                <button 
                  type="button" 
                  onClick={() => setForgotPassMode(!forgotPassMode)} 
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {forgotPassMode ? 'Voltar' : 'Esqueceu?'}
                </button>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  required 
                  className="auth-input pr-12" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (forgotPassMode ? 'Enviar Link' : 'Entrar no Dashboard')}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ou</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <Link 
                to="/register" 
                className="flex items-center justify-center w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 hover:border-slate-200 transition-all"
              >
                Criar conta gratuita
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer minimalista */}
      <div className="absolute bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none">
        DPO FAST © {new Date().getFullYear()}
      </div>
    </div>
  );
};
