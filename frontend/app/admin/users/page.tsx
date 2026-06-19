'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  plan: 'free' | 'pro'
  cvs: number
  aiCalls: number
  joined: string
  status: 'active' | 'blocked'
}

export default function AdminUsersPage() {
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Karim Mansouri',
      email: 'karim@example.com',
      avatar: 'KM',
      plan: 'free',
      cvs: 2,
      aiCalls: 4,
      joined: '2024-01-10',
      status: 'active',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: 'SJ',
      plan: 'pro',
      cvs: 5,
      aiCalls: 25,
      joined: '2023-12-15',
      status: 'active',
    },
    {
      id: '3',
      name: 'Alex Chen',
      email: 'alex@example.com',
      avatar: 'AC',
      plan: 'free',
      cvs: 1,
      aiCalls: 2,
      joined: '2024-01-20',
      status: 'blocked',
    },
  ])

  const [currentPage, setCurrentPage] = useState(1)
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = users.filter((user) => {
    const matchesPlan = planFilter === 'all' || user.plan === planFilter
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPlan && matchesSearch
  })

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(
    startIdx,
    startIdx + itemsPerPage
  )

  return (
    <AppShell title="User Management">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value as 'all' | 'free' | 'pro')
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-purple-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-purple-50 border-b border-purple-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  User
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Plan
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  CVs
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  AI Calls/mo
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Joined
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-t border-purple-100 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'
                  } hover:bg-purple-100 transition-colors`}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.plan === 'free'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {user.plan === 'free' ? 'Free' : 'Pro'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-900">{user.cvs}</td>
                  <td className="px-6 py-3 text-gray-900">{user.aiCalls}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(user.joined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`relative inline-flex h-5 w-8 items-center rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            user.status === 'active'
                              ? 'translate-x-3.5'
                              : 'translate-x-0.5'
                          }`}
                        ></span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {user.status === 'active' ? 'Active' : 'Blocked'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button className="p-1 text-gray-400 hover:text-gray-900 hover:bg-purple-50 rounded transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Showing {startIdx + 1} to{' '}
            {Math.min(startIdx + itemsPerPage, filteredUsers.length)} of{' '}
            {filteredUsers.length} users
          </p>
          <div className="flex gap-1">
            <button
              onClick={() =>
                setCurrentPage(Math.max(1, currentPage - 1))
              }
              disabled={currentPage === 1}
              className="p-2 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                  currentPage === i + 1
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                    : 'border border-purple-200 text-gray-700 hover:bg-purple-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
