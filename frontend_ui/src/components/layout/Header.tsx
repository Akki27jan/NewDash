import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 border-b border-theme-border">
      <Link href="/" className="text-theme-primary font-bold text-xl tracking-widest hover:text-theme-accent transition-colors">
        NewDash_
      </Link>
      
      <div className="flex gap-4">
        <Link href="/login">
          <Button label="LOGIN" color="red" />
        </Link>
        <Link href="/signup">
          <Button label="SIGNUP" color="red" />
        </Link>
      </div>
    </header>
  );
}
