'use client'

import { useEffect, useState } from 'react'
import { listUsers, updateUserBlock, updateUserPlan, updateUserRole, type AdminUser } from '@/lib/admin-api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)

  const load = () =>
    listUsers().then((r) => {
      setUsers(r.items)
      setTotal(r.total)
    })

  useEffect(() => { load() }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">User Management</h1>
      <p className="text-sm text-gray-500 mb-6">{total} users total</p>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan}
                    onChange={(e) => updateUserPlan(u.id, e.target.value as 'free' | 'pro').then(load)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value as 'user' | 'admin').then(load)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={u.isBlocked ? 'text-red-600' : 'text-green-600'}>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => updateUserBlock(u.id, !u.isBlocked).then(load)}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
