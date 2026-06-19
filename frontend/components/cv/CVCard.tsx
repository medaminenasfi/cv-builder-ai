'use client'

import { MoreHorizontal, Copy, Trash2, Share2 } from 'lucide-react'
import { CV } from '@/lib/mockData'
import { useState } from 'react'

interface CVCardProps {
  cv: CV
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
}

function getATSBadgeColor(score: number) {
  if (score >= 70) {
    return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
  } else if (score >= 40) {
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  } else {
    return 'bg-red-50 text-red-600 border border-red-200'
  }
}

function getLanguageFlag(lang: string) {
  const flags: Record<string, string> = {
    EN: '🇬🇧',
    FR: '🇫🇷',
    AR: '🇸🇦',
  }
  return flags[lang] || '🌐'
}

export function CVCard({
  cv,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
}: CVCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden hover:border-purple-300 transition-colors">
      {/* Left Accent Bar */}
      <div className="flex">
        <div className="w-1 h-full bg-gradient-to-b from-purple-600 to-purple-500"></div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {cv.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{cv.template} template</p>
            </div>

            {/* More Menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-purple-100 rounded-lg shadow-lg z-10 min-w-max">
                  <button
                    onClick={() => {
                      onEdit?.(cv.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate?.(cv.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onShare?.(cv.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                  <hr className="border-purple-100" />
                  <button
                    onClick={() => {
                      onDelete?.(cv.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="text-xs text-gray-400 mb-3">
            Last edited: {cv.last_edited}
          </div>

          {/* Footer: ATS Score + Language */}
          <div className="flex items-center justify-between">
            <div
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${getATSBadgeColor(
                cv.ats_score
              )}`}
            >
              ATS {cv.ats_score}
            </div>
            <span className="text-lg">{getLanguageFlag(cv.lang)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
