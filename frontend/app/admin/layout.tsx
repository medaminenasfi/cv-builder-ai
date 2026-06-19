'use client';

import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public admin login — no sidebar guard
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <AdminGuard>{children}</AdminGuard>;
}
