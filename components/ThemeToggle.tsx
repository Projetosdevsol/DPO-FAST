import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-500/10 transition-colors border border-transparent hover:border-white/5 group"
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-slate-600 group-hover:text-blue-500" />
      ) : (
        <Sun className="h-4 w-4 text-slate-400 group-hover:text-cyan-400" />
      )}
    </button>
  );
};
