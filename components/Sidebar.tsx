import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  ShieldCheck, 
  LogOut,
  Settings,
  Menu,
  X,
  ChevronRight,
  Trophy,
  Layers,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const Sidebar: React.FC = () => {
  const { logout, authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const menuItems = [
    { name: 'Início', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Departamentos', path: '/dashboard/departamentos', icon: Layers, end: false },
    { name: 'Mapeamento', path: '/dashboard/mapeamento', icon: ClipboardList, end: false },
    { name: 'Documentos', path: '/dashboard/documentos', icon: FileText, end: false },
    { name: 'Conformidade', path: '/dashboard/conformidade', icon: ShieldCheck, end: false },
    { name: 'Conquistas', path: '/dashboard/conquistas', icon: Trophy, end: false },
    { name: 'Ajustes', path: '/dashboard/configuracoes', icon: Settings, end: false },
  ];

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[var(--surface)] border-b border-[var(--border)] z-[40] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
          <span className="font-bold text-xl text-[var(--text-primary)]">LGPD Fácil</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 hover:bg-slate-500/10 rounded-xl transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[45]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed left-0 top-0 bottom-0 w-80 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col z-[50] transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-auto shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-[var(--text-primary)] tracking-tighter">LGPD Fácil</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Compliance AI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Menu Principal</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'text-slate-500 hover:bg-slate-500/10 hover:text-[var(--text-primary)]'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] space-y-4">
          {authState.user?.plan === 'basico' && (
            <div className="mx-4 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg mb-4 group overflow-hidden relative">
              <div className="absolute -top-4 -right-4 h-16 w-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 relative">Plano Limitado</p>
              <h4 className="text-sm font-bold text-white mb-3 relative">Desbloqueie o Pro</h4>
              <button 
                onClick={() => navigate('/planos')}
                className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black hover:bg-blue-50 transition-all relative"
              >
                Ver Planos
              </button>
            </div>
          )}

          <div className="px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold shrink-0 relative">
              {authState.user?.name.charAt(0)}
              <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[var(--surface)] flex items-center justify-center ${
                authState.user?.plan === 'personalite' ? 'bg-amber-400' : 
                authState.user?.plan === 'pro' ? 'bg-blue-600' : 'bg-slate-400'
              }`}>
                {authState.user?.plan === 'personalite' ? <Star className="h-2 w-2 text-white fill-white" /> : <ShieldCheck className="h-2 w-2 text-white" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate">{authState.user?.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  authState.user?.plan === 'personalite' ? 'bg-amber-100 text-amber-700' :
                  authState.user?.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {authState.user?.plan}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[60px]">{authState.user?.companyName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-2xl transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Sair do Sistema
          </button>

          <footer className="pt-4 text-center">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                Solution © 2026<br/>
                Desenvolvido por <a href="https://felipe-84bca.web.app/" target="_blank" className="text-blue-600 hover:underline">Felipe Sadrak</a>
             </p>
          </footer>
        </div>
      </aside>
    </>
  );
};
