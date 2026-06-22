'use client'

import { PenLine, Sparkles } from 'lucide-react'

export type EditorPanelMode = 'manual' | 'ai'

interface EditorModeSwitchProps {
  mode: EditorPanelMode
  onChange: (mode: EditorPanelMode) => void
}

export function EditorModeSwitch({ mode, onChange }: EditorModeSwitchProps) {
  return (
    <div className="flex p-1 bg-purple-50 rounded-xl border border-purple-100 mb-4">
      <button
        type="button"
        onClick={() => onChange('manual')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
          mode === 'manual'
            ? 'bg-white text-purple-800 shadow-sm border border-purple-100'
            : 'text-gray-500 hover:text-purple-700'
        }`}
      >
        <PenLine size={16} />
        Manual
      </button>
      <button
        type="button"
        onClick={() => onChange('ai')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
          mode === 'ai'
            ? 'bg-white text-purple-800 shadow-sm border border-purple-100'
            : 'text-gray-500 hover:text-purple-700'
        }`}
      >
        <Sparkles size={16} />
        AI Assistant
      </button>
    </div>
  )
}
