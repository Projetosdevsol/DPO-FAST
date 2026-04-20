import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-auto" }) => {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center transition-all duration-500">
      <img 
        src="/assets/logo.png" 
        alt="LGPD Fácil Logo" 
        className={`object-contain transition-all duration-500 ${className}`}
        style={{ minHeight: '32px' }}
      />
    </div>
  );
};
