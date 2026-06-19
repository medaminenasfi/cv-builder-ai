'use client'

import { Bell } from 'lucide-react'
import React from 'react'

interface TopBarProps {
  title: string
  actions?: React.ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-purple-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <h1 className="text-xl font-medium text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {actions}

        {/* Notification Bell */}
        <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Bell size={20} />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
          KM
        </div>
      </div>
    </header>
  )
}
