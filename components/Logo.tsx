
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8" }) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M256 48C150.4 48 64 88 64 192C64 328 256 464 256 464C256 464 448 328 448 192C448 88 361.6 48 256 48Z" 
        fill="#0033CC" 
      />
      <path 
        d="M310 140L160 290H250L200 400L350 250H260L310 140Z" 
        fill="#00E5FF" 
        stroke="white" 
        strokeWidth="10" 
        strokeLinejoin="round"
      />
    </svg>
  );
};
