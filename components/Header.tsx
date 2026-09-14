import React from 'react';
import { Shield } from 'lucide-react';
import { getAppName } from '../src/utils/app';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const appName = getAppName();
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-extrabold text-[var(--text-primary)]">{appName}</span>
        {title && <span className="text-sm font-medium text-[var(--text-muted)]">| {title}</span>}
      </div>
    </header>
  );
};
