
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
  ShieldAlert
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
        setError('Sua conta está suspensa. Por favor, entre em contato com o suporte para reativação.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      } else {
        setError('Ocorreu um erro ao acessar. Tente novamente.');
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
      if (err.message === "SUSPENDED_ACCOUNT") {
        setError('Esta conta Google está vinculada a um perfil suspenso. Contate o suporte.');
      } else {
        setError('Falha na autenticação com o Google.');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, insira seu e-mail primeiro.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setForgotPassMode(false);
    } catch (err) {
      setError('Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f9fafb] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-8 group"
        >
          <div className="p-1.5 bg-white rounded-lg border border-gray-100 group-hover:border-blue-100 shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Voltar ao início
        </Link>

        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">LGPD Fácil</h1>
          <p className="text-gray-500 mt-2 font-medium">Sua plataforma de adequação inteligente</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 space-y-8">
          {error && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${error.includes('suspensa') ? 'bg-red-600 text-white' : 'bg-red-50 border border-red-100 text-red-700'}`}>
              {error.includes('suspensa') ? <ShieldAlert className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <div>
                <p className="leading-tight">{error}</p>
                {error.includes('suspensa') && <p className="mt-1 text-[10px] opacity-80 uppercase tracking-wider">Acesso Negado</p>}
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {success}
            </div>
          )}
          <form onSubmit={forgotPassMode ? handleForgotPassword : handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  placeholder="nome@empresa.com.br"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all text-sm font-bold text-slate-950 placeholder:text-slate-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {!forgotPassMode && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Sua Senha</label>
                  <button type="button" onClick={() => setForgotPassMode(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">Esqueceu?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all text-sm font-bold text-slate-950 placeholder:text-slate-500"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{forgotPassMode ? 'Enviar Link' : 'Acessar Painel'} {!forgotPassMode && <ArrowRight className="h-5 w-5" />}</>}
            </button>
          </form>
          {!forgotPassMode && (
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-4 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Login
            </button>
          )}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500 font-medium">Ainda não tem conta? <Link to="/register" className="text-blue-600 font-bold hover:underline ml-1">Começar agora</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};
