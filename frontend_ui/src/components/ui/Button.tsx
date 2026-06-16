import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  color?: 'red' | 'blue';
}

export default function Button({ label, color = 'red', className = '', ...props }: ButtonProps) {
  const baseClasses = 'px-4 py-1 border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
  
  const colorClasses = color === 'red' 
    ? 'border-red-500 text-red-500 hover:bg-red-950 focus:ring-red-500' 
    : 'border-blue-500 text-blue-500 hover:bg-blue-950 focus:ring-blue-500';

  return (
    <button className={`${baseClasses} ${colorClasses} ${className}`} {...props}>
      [{label}]
    </button>
  );
}
