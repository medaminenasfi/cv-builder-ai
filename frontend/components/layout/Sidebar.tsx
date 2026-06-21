'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
  Palette,
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { listCVs } from '@/lib/cvs-api'

const FREE_CV_LIMIT = 3

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

const ACTIVE_GRADIENT = 'linear-gradient(135deg, #7c3aed, #a855f7)'

function getInitials(email: string): string {
  const part = email.split('@')[0] ?? 'U'
  return part.slice(0, 2).toUpperCase()
}

function NavLink({
  item,
  activeId,
  layout,
}: {
  item: NavItem
  activeId: string
  layout: 'sidebar' | 'bottom'
}) {
  const isActive = activeId === item.id

  if (layout === 'bottom') {
    return (
      <Link
        href={item.href}
        aria-label={item.tooltip}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
      >
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive ? 'text-white' : 'text-purple-300'
          }`}
          style={isActive ? { background: ACTIVE_GRADIENT } : undefined}
        >
          {item.icon}
        </span>
      </Link>
    )
  }

  return (
    <div className="relative group">
      <Link
        href={item.href}
        aria-label={item.tooltip}
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isActive
            ? 'text-white'
            : 'text-purple-300 hover:bg-purple-50 hover:text-purple-500 bg-transparent'
        }`}
        style={isActive ? { background: ACTIVE_GRADIENT } : undefined}
      >
        {item.icon}
      </Link>
      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none z-50">
        {item.tooltip}
      </div>
    </div>
  )
}

function DesktopSidebar({ activeId }: { activeId: string }) {
  const { user, logout } = useAuth()
  const [cvCount, setCvCount] = useState(0)

  useEffect(() => {
    if (!user) return
    listCVs()
      .then((cvs) => setCvCount(cvs.length))
      .catch(() => setCvCount(0))
  }, [user])

  return (
    <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-14 bg-white flex-col items-center border-r border-purple-100 z-40">
      <div className="h-14 w-full flex items-center justify-center shrink-0">
        <Link
          href="/dashboard"
          aria-label="Resume Builder home"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ background: ACTIVE_GRADIENT }}
        >
          R
        </Link>
      </div>

      <nav className="flex flex-col items-center gap-2 flex-1 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.id} item={item} activeId={activeId} layout="sidebar" />
        ))}
      </nav>

      {user?.plan === 'free' && (
        <div
          className="text-[9px] text-center text-purple-500 px-1 leading-tight mb-2"
          title="Free plan CV quota"
        >
          {cvCount} / {FREE_CV_LIMIT}
          <br />
          resumes
        </div>
      )}

      <div className="w-full flex flex-col items-center gap-2 border-t border-purple-100 py-4 shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ background: ACTIVE_GRADIENT }}
          title={user?.email ?? 'Not logged in'}
        >
          {user ? getInitials(user.email) : '?'}
        </div>

        <div className="relative group">
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Logout"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 hover:bg-purple-50 hover:text-purple-500 bg-transparent"
          >
            <LogOut size={18} />
          </button>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none z-50">
            Logout
          </div>
        </div>
      </div>
    </aside>
  )
}

function MobileBottomNav({ activeId }: { activeId: string }) {
  const { logout } = useAuth()

  return (
    <nav className="flex sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-purple-100 z-40 items-stretch">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.id} item={item} activeId={activeId} layout="bottom" />
      ))}
      <button
        type="button"
        onClick={() => logout()}
        aria-label="Logout"
        className="flex flex-1 flex-col items-center justify-center py-2 text-purple-300"
      >
        <span className="w-10 h-10 rounded-xl flex items-center justify-center">
          <LogOut size={20} />
        </span>
      </button>
    </nav>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  const activeId =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.id ?? 'dashboard'

  return (
    <>
      <DesktopSidebar activeId={activeId} />
      <MobileBottomNav activeId={activeId} />
    </>
  )
}
