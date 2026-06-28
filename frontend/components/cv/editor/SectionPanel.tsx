'use client'

import type { ReactNode } from 'react'
import type { EditorSectionId } from './EditorSidebar'

interface SectionPanelProps {
  sectionId: EditorSectionId
  children: ReactNode
  /** Hide entire block when section disabled in Settings */
  visible?: boolean
}

/** Scroll anchor for sidebar navigation. */
export function SectionPanel({ sectionId, children, visible = true }: SectionPanelProps) {
  if (!visible) return null
  return (
    <div id={`editor-section-${sectionId}`} className="scroll-mt-4">
      {children}
    </div>
  )
}
