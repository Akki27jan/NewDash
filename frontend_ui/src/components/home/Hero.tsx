import React from 'react';

export default function Hero() {
  const asciiArt = `
███    ██ ███████ ██     ██ ██████  █████  ██████  ██   ██ 
████   ██ ██      ██     ██ ██   ██ ██  ██ ██      ██   ██ 
██ ██  ██ █████   ██  █  ██ ██   ██ ██████ ██████  ███████ 
██  ██ ██ ██      ██ ███ ██ ██   ██ ██  ██     ██  ██   ██ 
██   ████ ███████  ███ ███  ██████  ██  ██ ██████  ██   ██ 
  `;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-theme-primary">
      <pre className="text-xs sm:text-sm md:text-base lg:text-lg font-bold leading-tight">
        {asciiArt}
      </pre>
      <div className="mt-8 text-theme-secondary opacity-80 text-sm md:text-base">
        <span className="text-theme-accent">guest@newdash</span>:<span className="text-theme-primary">~</span>$ ./start_dashboard.sh
      </div>
    </div>
  );
}
