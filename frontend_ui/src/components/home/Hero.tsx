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
    <div className="flex flex-col items-center justify-center py-16 text-blue-500">
      <pre className="text-xs sm:text-sm md:text-base lg:text-lg font-bold leading-tight">
        {asciiArt}
      </pre>
      <div className="mt-8 text-blue-400 opacity-80 text-sm md:text-base">
        <span className="text-red-500">guest@newdash</span>:<span className="text-blue-500">~</span>$ ./start_dashboard.sh
      </div>
    </div>
  );
}
