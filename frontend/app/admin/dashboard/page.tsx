import { redirect } from 'next/navigation';

/** Alias: /admin/dashboard → /admin */
export default function AdminDashboardAliasPage() {
  redirect('/admin');
}
