'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/play');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">
          Cortina
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Loading Play Mode</h1>
        <p className="mt-4 text-sm text-zinc-400">
          If you are not redirected automatically,{' '}
          <Link href="/play" className="text-zinc-100 underline">
            continue to Play
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
