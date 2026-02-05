'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/play',
    label: 'Play',
    description: 'Free play and instrument mode',
  },
  {
    href: '/learn',
    label: 'Learn',
    description: 'Guided lessons and practice',
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() ?? '';

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200/80 bg-white/90 backdrop-blur transition-transform duration-200 dark:border-zinc-800/80 dark:bg-zinc-950/80',
        open ? 'translate-x-0' : '-translate-x-full',
        'md:static md:translate-x-0 md:bg-white/70 md:dark:bg-zinc-950/70',
      ].join(' ')}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between px-5 py-4">
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Cortina
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Music training studio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-900 md:hidden"
          >
            Close
          </button>
        </div>

        <nav className="flex-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'mb-2 block rounded-xl px-4 py-3 transition',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/15 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900/70',
                ].join(' ')}
              >
                <div className="text-sm font-semibold">{item.label}</div>
                <div
                  className={[
                    'text-xs',
                    isActive
                      ? 'text-white/80 dark:text-zinc-700'
                      : 'text-zinc-500 dark:text-zinc-400',
                  ].join(' ')}
                >
                  {item.description}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200/70 px-5 py-4 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
          Courses and progress tracking are coming soon.
        </div>
      </div>
    </aside>
  );
}
