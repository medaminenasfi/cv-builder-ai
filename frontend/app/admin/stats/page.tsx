'use client';

import { useEffect, useState } from 'react';
import { getStats, type AdminStats } from '@/lib/admin-api';

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <p className="text-gray-500">Loading stats...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Platform Stats</h1>
      <div className="bg-white rounded-xl border p-6 space-y-3 text-sm">
        <p><strong>Total users:</strong> {stats.totalUsers}</p>
        <p><strong>Admins:</strong> {stats.totalAdmins}</p>
        <p><strong>CVs:</strong> {stats.totalCvs}</p>
        <p><strong>Active templates:</strong> {stats.activeTemplates}</p>
        <p className="text-gray-400 text-xs">Updated: {new Date(stats.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}
