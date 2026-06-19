'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
}

export function AppShell({ children, title, actions }: AppShellProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-14">
        {/* Top Bar */}
        <TopBar title={title} actions={actions} />

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
