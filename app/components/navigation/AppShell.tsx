'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from '@/app/components/navigation/Sidebar';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleClose = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}

        <Sidebar open={sidebarOpen} onClose={handleClose} />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200/70 bg-white/80 px-4 py-3 text-zinc-900 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-50 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-800/70 dark:text-zinc-200"
            >
              Menu
            </button>
            <span className="text-sm font-semibold tracking-wide">Cortina</span>
          </header>

          <main className="flex flex-1 items-center justify-center p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
