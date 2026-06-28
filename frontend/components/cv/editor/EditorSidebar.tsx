'use client'

import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages,
  Wrench,
  Award,
  FolderKanban,
  Settings,
} from 'lucide-react'

export const EDITOR_SECTIONS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'languages', label: 'Languages', icon: Languages },
  { id: 'technologies', label: 'Technologies', icon: Wrench },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export type EditorSectionId = (typeof EDITOR_SECTIONS)[number]['id']

interface EditorSidebarProps {
  active: EditorSectionId
  onSelect: (id: EditorSectionId) => void
  /** When set, hide nav items for disabled CV sections (Settings). */
  enabledSections?: string[]
}

const ALWAYS_VISIBLE: EditorSectionId[] = ['personal', 'settings']

function isNavSectionVisible(id: EditorSectionId, enabledSections?: string[]): boolean {
  if (ALWAYS_VISIBLE.includes(id)) return true
  if (!enabledSections?.length) return true
  return enabledSections.includes(id)
}

export function EditorSidebar({ active, onSelect, enabledSections }: EditorSidebarProps) {
  return (
    <nav className="flex flex-wrap lg:flex-col gap-1 lg:gap-0.5 mb-2 lg:mb-4 lg:pr-0 lg:border-r-0">
      {EDITOR_SECTIONS.filter(({ id }) => isNavSectionVisible(id, enabledSections)).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm text-left transition-colors ${
            active === id
              ? 'bg-purple-100 text-purple-800 font-medium'
              : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700 border border-transparent'
          }`}
        >
          <Icon size={14} className="shrink-0 hidden sm:block lg:block" />
          {label}
        </button>
      ))}
    </nav>
  )
}
