import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-16 py-8 border-t border-blue-900 flex flex-col items-center justify-center text-center px-4">
      <div className="text-blue-600 italic">
        {'>'} "Built for students, by students. 100% Open Source."
      </div>
      <div className="text-blue-600 italic">
        {'>'} <a href="https://github.com/Akki27jan/NewDash.git">"https://github.com/Akki27jan/NewDash.git"</a>
      </div>
      <div className="mt-4 text-xs text-blue-800">
        EOF
      </div>
    </footer>
  );
}
