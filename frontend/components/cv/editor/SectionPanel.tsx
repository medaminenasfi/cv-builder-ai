'use client'

import type { ReactNode } from 'react'
import type { EditorSectionId } from './EditorSidebar'

interface SectionPanelProps {
  sectionId: EditorSectionId
  children: ReactNode
}

/** Scroll anchor for sidebar navigation — all sections stay visible (reference-style). */
export function SectionPanel({ sectionId, children }: SectionPanelProps) {
  return (
    <div id={`editor-section-${sectionId}`} className="scroll-mt-4">
      {children}
    </div>
  )
}
