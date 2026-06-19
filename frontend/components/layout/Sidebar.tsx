'use client'

import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Settings,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  icon: React.ReactNode
  tooltip: string
  href: string
  id: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={20} />,
    tooltip: 'Dashboard',
    href: '/dashboard',
  },
  {
    id: 'resumes',
    icon: <FileText size={20} />,
    tooltip: 'Resumes',
    href: '/resumes',
  },
  {
    id: 'jobs',
    icon: <Briefcase size={20} />,
    tooltip: 'Job Match',
    href: '/job-match',
  },
  {
    id: 'settings',
    icon: <Settings size={20} />,
    tooltip: 'Settings',
    href: '/settings',
  },
]

export function Sidebar() {
  const [activeId, setActiveId] = useState('dashboard')
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 bg-slate-950 flex flex-col items-center justify-between py-6 border-r border-slate-800">
      {/* Logo / Top Icon */}
      <div className="flex flex-col items-center gap-8">
        {/* Logo Circle */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
          R
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => setActiveId(item.id)}
                onMouseEnter={() => setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeId === item.id
                    ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white'
                    : 'text-purple-300 hover:bg-slate-800'
                }`}
              >
                {item.icon}
              </button>

              {/* Tooltip */}
              {showTooltip === item.id && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 opacity-100 duration-100">
                  {item.tooltip}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-4 border-t border-slate-800 pt-4 w-full px-2">
        {/* User Avatar */}
        <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
          KM
        </button>

        {/* Logout Button */}
        <button className="w-10 h-10 rounded-xl text-purple-300 hover:bg-slate-800 flex items-center justify-center transition-colors relative group">
          <LogOut size={18} />
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 duration-100">
            Logout
          </div>
        </button>
      </div>

      {/* Plan Quota */}
      <div className="absolute bottom-20 left-0 right-0 px-2 text-center">
        <div className="text-xs text-purple-300 font-medium mb-1">
          2 / 3 used
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-500"
            style={{ width: '66%' }}
          />
        </div>
      </div>
    </aside>
  )
}
