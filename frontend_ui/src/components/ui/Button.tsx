import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  color?: 'red' | 'blue' | 'yellow' | 'green';
}

export default function Button({ label, color = 'red', className = '', ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-1 border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
  
  const colorClasses = color === 'red' 
    ? 'border-theme-accent text-theme-accent hover:bg-theme-accent-bg focus:ring-theme-accent' 
    : color === 'yellow'
    ? 'border-theme-warning text-theme-warning hover:bg-theme-border-bg focus:ring-theme-warning'
    : color === 'green'
    ? 'border-theme-success text-theme-success hover:bg-theme-success-bg focus:ring-theme-success'
    : 'border-theme-primary text-theme-primary hover:bg-theme-border-bg focus:ring-theme-primary';

  return (
    <button className={`${baseClasses} ${colorClasses} ${className}`} {...props}>
      [{label}]
    </button>
  );
}
