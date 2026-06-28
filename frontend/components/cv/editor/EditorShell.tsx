'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { EditorModeSwitch, type EditorPanelMode } from './EditorModeSwitch'
import { EditorSidebar, type EditorSectionId } from './EditorSidebar'

type MobileTab = 'panel' | 'preview'

interface EditorShellProps {
  mode: EditorPanelMode
  onModeChange: (mode: EditorPanelMode) => void
  sidebarActive: EditorSectionId
  onSectionSelect: (id: EditorSectionId) => void
  manualPanel: ReactNode
  aiPanel: ReactNode
  preview: ReactNode
  enabledSections?: string[]
  hideModeSwitch?: boolean
}

export function EditorShell({
  mode,
  onModeChange,
  sidebarActive,
  onSectionSelect,
  manualPanel,
  aiPanel,
  preview,
  enabledSections,
  hideModeSwitch = false,
}: EditorShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('panel')

  const scrollToSection = (id: EditorSectionId) => {
    onSectionSelect(id)
    document.getElementById(`editor-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="lg:hidden flex border-b border-purple-100 mb-4">
        {(['panel', 'preview'] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize ${
              mobileTab === tab ? 'text-purple-700 border-b-2 border-purple-600' : 'text-gray-500'
            }`}
          >
            {tab === 'panel' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,42%)_minmax(0,1fr)] xl:grid-cols-[minmax(380px,40%)_minmax(0,1.15fr)] gap-5 lg:gap-6 items-start">
        <section className={`min-w-0 ${mobileTab === 'preview' ? 'max-lg:hidden' : 'block'}`}>
          <div className="lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
            {!hideModeSwitch && <EditorModeSwitch mode={mode} onChange={onModeChange} />}

            {mode === 'manual' ? (
              <>
                <EditorSidebar
                  active={sidebarActive}
                  onSelect={scrollToSection}
                  enabledSections={enabledSections}
                />
                {manualPanel}
              </>
            ) : (
              aiPanel
            )}
          </div>
        </section>

        <aside
          className={`min-w-0 lg:sticky lg:top-[4.5rem] ${
            mobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          {preview}
        </aside>
      </div>
    </div>
  )
}
