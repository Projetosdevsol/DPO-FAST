import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Loader2,
  ChevronDown
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
      setSuccess('E-mail de recuperação enviado.');
      setForgotPassMode(false);
    } catch (err) {
      setError('Erro ao recuperar senha. Verifique o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-y-auto">
      <div className="google-card animate-in fade-in zoom-in-95 duration-500 my-8">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <Link to="/" className="mb-2">
            <Logo className="h-8 md:h-10 w-auto" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-normal text-[var(--text-primary)]">Fazer login</h1>
            <p className="text-base text-[var(--text-primary)]">Prosseguir para o Dashboard</p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800/20 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800/20 animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}
          
          <form onSubmit={forgotPassMode ? handleForgotPassword : handleEmailLogin} className="space-y-6">
          <div className="google-input-container">
            <input 
              type="email" 
              id="email" 
              required 
              className="google-input peer" 
              placeholder=" " 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <label htmlFor="email" className="floating-label">E-mail ou telefone</label>
          </div>

          <div className="google-input-container">
            <input 
              type={showPassword ? 'text' : 'password'} 
              id="password" 
              required 
              className="google-input peer pr-12" 
              placeholder=" " 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <label htmlFor="password" className="floating-label">Digite sua senha</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1 z-20"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
            
            <div className="flex flex-col space-y-2">
              <button 
                type="button" 
                onClick={() => setForgotPassMode(!forgotPassMode)} 
                className="text-[var(--primary)] font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 w-fit px-2 py-1 rounded transition-colors -ml-2"
              >
                {forgotPassMode ? 'Voltar para login' : 'Esqueceu o e-mail?'}
              </button>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link to="/register" className="text-[var(--primary)] font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/10 px-4 py-2 rounded transition-colors w-full sm:w-auto text-center">
                Criar conta
              </Link>
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:min-w-[120px] flex items-center justify-center py-3 sm:py-2.5"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (forgotPassMode ? 'Próxima' : 'Entrar')}
              </button>
            </div>
          </form>

          {!forgotPassMode && (
            <div className="pt-6 border-t border-[var(--border)]">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"/>
                </svg>
                Google Identity
              </button>
            </div>
          )}
        </div>
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
