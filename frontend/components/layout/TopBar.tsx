'use client'

import { Bell } from 'lucide-react'
import React from 'react'
import { useAuth } from '@/providers/AuthProvider'

interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

function getInitials(email: string): string {
  const part = email.split('@')[0] ?? 'U'
  return part.slice(0, 2).toUpperCase()
}

export function TopBar({ title, actions }: TopBarProps) {
  const { user } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-purple-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <h1 className="text-xl font-medium text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {actions}

        <button type="button" className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Bell size={20} />
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          title={user?.email ?? 'User account'}
        >
          {user ? getInitials(user.email) : '?'}
        </div>
      </div>
    </header>
  )
}
