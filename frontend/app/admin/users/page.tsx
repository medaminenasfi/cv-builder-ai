'use client'

import { useEffect, useState } from 'react'
import { listUsers, updateUserBlock, updateUserPlan, updateUserRole, type AdminUser } from '@/lib/admin-api'
import { ApiError } from '@/lib/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await listUsers()
      setUsers(r.items)
      setTotal(r.total)
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAction = async (action: () => Promise<unknown>) => {
    try {
      await action()
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Action failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">User Management</h1>
      <p className="text-sm text-gray-500 mb-6">{total} users total</p>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.plan}
                      onChange={(e) =>
                        handleAction(() => updateUserPlan(u.id, e.target.value as 'free' | 'pro'))
                      }
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleAction(() => updateUserRole(u.id, e.target.value as 'user' | 'admin'))
                      }
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
                      onClick={() => handleAction(() => updateUserBlock(u.id, !u.isBlocked))}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
