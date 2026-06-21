"use client";

import React, { useState, useEffect } from 'react';

export default function Hero() {
  const asciiArt = `
███    ██ ███████ ██     ██ ██████  █████  ██████  ██   ██ 
████   ██ ██      ██     ██ ██   ██ ██  ██ ██      ██   ██ 
██ ██  ██ █████   ██  █  ██ ██   ██ ██████ ██████  ███████ 
██  ██ ██ ██      ██ ███ ██ ██   ██ ██  ██     ██  ██   ██ 
██   ████ ███████  ███ ███  ██████  ██  ██ ██████  ██   ██ 
  `;

  const [bootLog, setBootLog] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [typedText, setTypedText] = useState("");
  const targetText = "./start_dashboard.sh";

  useEffect(() => {
    const logs = [
      "Initializing kernel...",
      "Mounting /dev/nvme0n1p2...",
      "Loading drivers... OK",
      "Checking filesystem... CLEAN",
      "Starting student services...",
      "Bypassing firewall... [DONE]",
      "Sequence initiated."
    ];
    let step = 0;
    const bootInterval = setInterval(() => {
      setBootLog(prev => [...prev, logs[step]]);
      step++;
      if (step >= logs.length) {
        clearInterval(bootInterval);
        setTimeout(() => setBooting(false), 500);
      }
    }, 150);

    return () => clearInterval(bootInterval);
  }, []);

  useEffect(() => {
    if (!booting) {
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        setTypedText(targetText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= targetText.length) {
          clearInterval(typeInterval);
        }
      }, 70);

      return () => clearInterval(typeInterval);
    }
  }, [booting]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-theme-primary min-h-[300px]">
      {booting ? (
        <div className="w-full max-w-2xl text-left text-xs sm:text-sm text-theme-secondary opacity-70 font-mono flex flex-col justify-end">
          {bootLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          <div className="animate-pulse w-2 h-4 bg-theme-secondary mt-1"></div>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center">
          <pre
            className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold leading-tight"
            style={{ textShadow: "0 0 10px currentColor", opacity: 0.9 }}
          >
            {asciiArt}
          </pre>
          <div className="mt-8 text-theme-secondary opacity-80 text-sm md:text-base flex items-center">
            <span className="text-theme-accent">guest@newdash</span>
            <span className="text-theme-primary mx-1">:~$</span>
            <span className="text-theme-primary">{typedText}</span>
            <span className="animate-pulse ml-1 inline-block w-2 h-4 bg-theme-primary"></span>
          </div>
        </div>
      )}
    </div>
  );
}
