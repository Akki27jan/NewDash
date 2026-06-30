"use client";

import React, { useState, useEffect } from 'react';

export default function Hero() {
  const TARGET_LOGO = "[ N E W D A S H ]";
  const GLITCH_CHARS = "!<>-_\\\\/[]{}—=+*^?#________";

  const [bootLog, setBootLog] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [glitchText, setGlitchText] = useState(TARGET_LOGO);
  const [isGlitching, setIsGlitching] = useState(false);

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
      // Start Glitch Effect
      setIsGlitching(true);
      let iterations = 0;
      const glitchInterval = setInterval(() => {
        setGlitchText(prev => prev.split('').map((char, index) => {
          if (char === ' ') return ' '; // Preserve spaces
          if (index < iterations / 3) return TARGET_LOGO[index];
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }).join(''));
        
        if (iterations >= TARGET_LOGO.length * 3) {
          clearInterval(glitchInterval);
          setIsGlitching(false);
          setGlitchText(TARGET_LOGO);
        }
        iterations += 1;
      }, 50);

      let charIndex = 0;
      const typeInterval = setInterval(() => {
        setTypedText(targetText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= targetText.length) {
          clearInterval(typeInterval);
        }
      }, 70);

      return () => {
        clearInterval(glitchInterval);
        clearInterval(typeInterval);
      };
    }
  }, [booting]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-theme-primary min-h-[300px] w-full px-4">
      {booting ? (
        <div className="w-full max-w-2xl text-left text-xs sm:text-sm text-theme-secondary opacity-70 font-mono flex flex-col justify-end">
          {bootLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          <div className="animate-pulse w-2 h-4 bg-theme-secondary mt-1"></div>
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col items-center w-full">
          <div 
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight font-mono text-center break-words w-full px-2"
            style={{ 
              textShadow: isGlitching ? "0 0 20px rgba(239, 68, 68, 0.8)" : "0 0 12px rgba(59, 130, 246, 0.8)", 
              opacity: 0.95,
              color: isGlitching ? '#ef4444' : 'currentColor',
              transition: 'color 0.3s ease-out'
            }}
          >
            {glitchText}
          </div>
          <div className="mt-8 text-theme-secondary opacity-80 text-sm md:text-base flex items-center flex-wrap justify-center text-center">
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
