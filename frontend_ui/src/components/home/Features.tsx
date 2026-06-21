import React from 'react';

export default function Features() {
  const features = [
    { name: 'DRIVE_LINKER', desc: 'Linking college lecture classes drive folders' },
    { name: 'GPA_CALC', desc: 'GPA calculator to track academic performance' },
    { name: 'TODO_LIST', desc: 'To-do list for daily task management' },
    { name: 'NOTES_CENTRE', desc: 'A hub where students can link and share notes' },
    { name: 'TEST_CALENDAR', desc: 'Add test dates and assignment deadlines' },
    { name: 'ATTENDANCE_TRACKER', desc: 'Track and manage your class attendance' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 border-b border-theme-border inline-block">
        <h2 className="text-theme-primary font-bold text-xl">
          <span className="text-theme-accent">#</span> AVAILABLE_MODULES
        </h2>
      </div>
      
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="text-theme-accent font-bold whitespace-nowrap">
              [{String(index + 1).padStart(2, '0')}] {feature.name}
            </span>
            <span className="hidden sm:inline text-theme-muted">.....</span>
            <span className="text-theme-secondary text-sm sm:text-base">
              {feature.desc}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
