import type { ReactNode } from 'react';

import { AppShell } from '@/core/ui/AppShell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
