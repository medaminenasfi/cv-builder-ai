'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
  /** Hide the default top bar (page provides its own header). */
  hideTopBar?: boolean
  /** Skip inner max-width wrapper (page controls layout). */
  fullBleed?: boolean
}

export function AppShell({
  children,
  title,
  actions,
  hideTopBar = false,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col sm:ml-14 pb-16 sm:pb-0 min-w-0">
        {!hideTopBar && <TopBar title={title} actions={actions} />}

        <main className="flex-1 overflow-y-auto">
          {fullBleed ? (
            children
          ) : (
            <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
          )}
        </main>
      </div>
    </div>
  )
}
