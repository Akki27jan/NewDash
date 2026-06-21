"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function Features() {
  const features = [
    { name: 'GPA_CALC', desc: 'GPA calculator to track academics', perm: '-rwxr-xr-x', size: '2048' },
    { name: 'TODO_LIST', desc: 'To-do list for daily task management', perm: '-rwxr-xr-x', size: '8192' },
    { name: 'NOTES_CENTRE', desc: 'A hub where students can link notes', perm: 'drwxr-xr-x', size: '4096' },
    { name: 'TEST_CALENDAR', desc: 'Add test dates and assignment deadlines', perm: '-rwxr-xr-x', size: '1024' },
    { name: 'ATTENDANCE_TRACKER', desc: 'Track and manage your class attendance', perm: '-rwxr--r--', size: '4096' },
    { name: 'STUDY_TIMER', desc: 'Timers for focused study sessions', perm: '-rwxr-xr-x', size: '2048' },
  ];

  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount === 0) {
          let count = 0;
          const interval = setInterval(() => {
            count++;
            setVisibleCount(count);
            if (count >= features.length) {
              clearInterval(interval);
            }
          }, 150);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [features.length, visibleCount]);

  const mockDate = "Jun 22 01:25";

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto py-16 px-4 font-mono">
      <div className="mb-6 border-b border-theme-border inline-block">
        <h2 className="text-theme-primary font-bold text-xl">
          <span className="text-theme-accent">guest@newdash</span>:~/modules$ ls -la
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className={visibleCount > 0 ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
            <tr className="text-theme-muted text-xs border-b border-theme-border/30">
              <th className="font-normal pr-4 pb-2">PERMISSIONS</th>
              <th className="font-normal pr-4 pb-2 text-center">LINKS</th>
              <th className="font-normal pr-4 pb-2">OWNER</th>
              <th className="font-normal pr-4 pb-2">GROUP</th>
              <th className="font-normal pr-4 pb-2 text-right">SIZE</th>
              <th className="font-normal pr-4 pb-2">DATE</th>
              <th className="font-normal pr-4 pb-2">MODULE_NAME</th>
              <th className="font-normal pb-2">DESCRIPTION</th>
            </tr>
          </thead>
          <tbody className="text-theme-secondary text-sm">
            {features.slice(0, visibleCount).map((feature, index) => (
              <tr key={index} className="hover:bg-theme-border/20 transition-colors group cursor-default">
                <td className="pr-4 py-1.5 group-hover:text-theme-primary">{feature.perm}</td>
                <td className="pr-4 py-1.5 text-center group-hover:text-theme-primary">1</td>
                <td className="pr-4 py-1.5 group-hover:text-theme-primary">root</td>
                <td className="pr-4 py-1.5 group-hover:text-theme-primary">system</td>
                <td className="pr-4 py-1.5 text-right group-hover:text-theme-primary">{feature.size}</td>
                <td className="pr-4 py-1.5 group-hover:text-theme-primary">{mockDate}</td>
                <td className="pr-4 py-1.5 font-bold text-theme-accent group-hover:text-theme-accent-hover">{feature.name}</td>
                <td className="py-1.5 text-theme-muted group-hover:text-theme-primary">{"->"} {feature.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleCount === features.length && (
          <div className="mt-6 text-theme-secondary text-sm animate-fade-in">
            <span className="text-theme-accent">guest@newdash</span>:~/modules$ <span className="animate-pulse inline-block w-2 h-4 bg-theme-primary align-middle"></span>
          </div>
        )}
      </div>
    </div>
  );
}
