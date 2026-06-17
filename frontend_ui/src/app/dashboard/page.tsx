import React from 'react';

export default function DashboardPage() {
  return (
    <main className="flex-grow flex flex-col gap-12 mt-8 max-w-4xl mx-auto w-full px-4">
      <div className="border border-blue-900 p-6 bg-black">
        <h1 className="text-blue-500 font-bold text-2xl mb-4 border-b border-blue-900 pb-2">
          <span className="text-red-500">root@newdash</span>:~# _
        </h1>
        <p className="text-blue-400 mb-6">
          Welcome to the NewDash module control center. You have successfully authenticated.
        </p>
        <div className="text-blue-800 text-sm mb-8">
          [System status: ONLINE] <br />
          [Active modules: 0]
        </div>
      </div>
    </main>
  );
}
