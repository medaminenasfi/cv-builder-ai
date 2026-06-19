'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
  Palette,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'

interface NavItem {
  icon: React.ReactNode
  tooltip: string
  href: string
  id: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, tooltip: 'Dashboard', href: '/dashboard' },
  { id: 'templates', icon: <Palette size={20} />, tooltip: 'Templates', href: '/templates' },
  { id: 'jobs', icon: <Briefcase size={20} />, tooltip: 'Job Match', href: '/job-match' },
  { id: 'settings', icon: <Settings size={20} />, tooltip: 'Settings', href: '/settings' },
]

function getInitials(email: string): string {
  const part = email.split('@')[0] ?? 'U'
  return part.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, hasAdminSession } = useAuth()
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const activeId =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.id ?? 'dashboard'

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-slate-950 flex flex-col items-center justify-between py-6 border-r border-slate-800">
      <div className="flex flex-col items-center gap-8">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
        >
          R
        </Link>

        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <Link
                href={item.href}
                onMouseEnter={() => setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeId === item.id
                    ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white'
                    : 'text-purple-300 hover:bg-slate-800'
                }`}
              >
                {item.icon}
              </Link>
              {showTooltip === item.id && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                  {item.tooltip}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-slate-800 pt-4 w-full px-2">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold"
          title={user?.email ?? 'Not logged in'}
        >
          {user ? getInitials(user.email) : '?'}
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="w-10 h-10 rounded-xl text-purple-300 hover:bg-slate-800 flex items-center justify-center transition-colors relative group"
        >
          <LogOut size={18} />
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100">
            User logout
          </div>
        </button>

        {hasAdminSession && (
          <Link
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-center text-purple-400 hover:text-purple-300 leading-tight"
            title="Admin panel (separate session)"
          >
            Admin ↗
          </Link>
        )}
      </div>

      {user?.plan === 'free' && (
        <div className="absolute bottom-20 left-0 right-0 px-2 text-center">
          <div className="text-xs text-purple-300 font-medium mb-1">Free plan</div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500" style={{ width: '33%' }} />
          </div>
        </div>
      )}
    </aside>
  )
}
