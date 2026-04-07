
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
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export const Sidebar: React.FC = () => {
  const { logout, authState } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-[40] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-slate-900">LGPD Fácil</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 flex flex-col z-[50] transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center gap-3">
          <Logo className="h-10 w-10 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-xl text-slate-900 tracking-tight">LGPD Fácil</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Compliance AI</span>
          </div>
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
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
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

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-4">
          <div className="px-4 py-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
              {authState.user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{authState.user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{authState.user?.companyName}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
          >
            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
};
