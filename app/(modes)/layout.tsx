import type { ReactNode } from 'react';
import { AppShell } from '@/app/components/navigation/AppShell';

export default function ModesLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
