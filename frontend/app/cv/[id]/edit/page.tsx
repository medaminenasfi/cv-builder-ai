'use client'

import { AppShell } from '@/components/layout/AppShell'
import { BulletRow } from '@/components/cv/BulletRow'
import { CVPreview } from '@/components/cv/CVPreview'
import { MOCK_CVS, TEMPLATES } from '@/lib/mockData'
import { useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  Download,
  Share2,
  ChevronDown,
} from 'lucide-react'

export default function CVEditorPage({
  params,
}: {
  params: { id: string }
}) {
  const cv = MOCK_CVS.find((c) => c.id === params.id) || MOCK_CVS[0]
  const [title, setTitle] = useState(cv.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [template, setTemplate] = useState(cv.template)
  const [language, setLanguage] = useState(cv.lang)
  const [activeTab, setActiveTab] = useState('experience')
  const [isSaving, setIsSaving] = useState(false)
  const [tone, setTone] = useState<'professional' | 'technical' | 'creative'>(
    'professional'
  )
  const [cvData, setCvData] = useState(cv)

  const handleUpdateBullet = (bulletId: string, text: string) => {
    setCvData({
      ...cvData,
      experience: cvData.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) =>
          b.id === bulletId ? { ...b, text } : b
        ),
      })),
    })
  }

  const handleDeleteBullet = (bulletId: string) => {
    setCvData({
      ...cvData,
      experience: cvData.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.filter((b) => b.id !== bulletId),
      })),
    })
  }

  const handleAddBullet = (expId: string) => {
    setCvData({
      ...cvData,
      experience: cvData.experience.map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              bullets: [
                ...exp.bullets,
                {
                  id: `bullet-${Date.now()}`,
                  text: 'Add your achievement here',
                },
              ],
            }
          : exp
      ),
    })
  }

  const actions = (
    <div className="flex items-center gap-3">
      {/* Save Status */}
      <div className="flex items-center gap-2 text-sm">
        {isSaving ? (
          <>
            <Loader2 size={16} className="animate-spin text-gray-500" />
            <span className="text-gray-600">Saving…</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-gray-600">All saved</span>
          </>
        )}
      </div>

      {/* Template Switcher */}
      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="px-3 py-2 bg-white border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
      >
        {TEMPLATES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Language Selector */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="px-3 py-2 bg-white border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
      >
        <option value="EN">English</option>
        <option value="FR">Français</option>
        <option value="AR">العربية</option>
      </select>

      {/* Export Dropdown */}
      <div className="relative group">
        <button className="flex items-center gap-1 px-3 py-2 bg-white border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors">
          <Download size={16} />
          Export
          <ChevronDown size={14} />
        </button>
        <div className="absolute right-0 mt-1 w-32 bg-white border border-purple-100 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50">
            Export as PDF
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50">
            Export as DOCX
          </button>
        </div>
      </div>

      {/* Share Button */}
      <button className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
        <Share2 size={16} />
        Share
      </button>
    </div>
  )

  return (
    <AppShell title="Edit Resume" actions={actions}>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Left: Editor (55%) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title Edit */}
          <div className="mb-6 pb-6 border-b border-purple-100">
            {isEditingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                }}
                className="text-xl font-medium text-gray-900 border-b border-purple-300 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-medium text-gray-900 cursor-pointer hover:text-purple-700 transition-colors"
              >
                {title}
                <span className="text-purple-400 ml-2 text-sm">✏️</span>
              </h2>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-purple-100 mb-6">
            {['summary', 'experience', 'education', 'skills', 'languages', 'certifications'].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? 'text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-500"></div>
                  )}
                </button>
              )
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
            {activeTab === 'experience' && (
              <div className="space-y-6">
                {cvData.experience.map((exp) => (
                  <div key={exp.id} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.title}
                        placeholder="Job Title"
                        className="px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        placeholder="Company"
                        className="px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.start}
                        placeholder="Start Date"
                        className="px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <input
                        type="text"
                        value={exp.end}
                        placeholder="End Date"
                        className="px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>

                    {/* Bullets */}
                    <div className="space-y-3 mt-4">
                      <h4 className="text-xs font-semibold text-gray-600">
                        Achievements
                      </h4>
                      {exp.bullets.map((bullet) => (
                        <BulletRow
                          key={bullet.id}
                          bullet={bullet}
                          onUpdate={handleUpdateBullet}
                          onDelete={handleDeleteBullet}
                          tone={tone}
                        />
                      ))}
                      <button
                        onClick={() => handleAddBullet(exp.id)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-2"
                      >
                        + Add Bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button className="text-purple-400 hover:text-purple-600">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a skill and press Enter"
                  className="w-full px-3 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            )}

            {['summary', 'education', 'languages', 'certifications'].includes(
              activeTab
            ) && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{' '}
                  section editor coming soon
                </p>
              </div>
            )}
          </div>

          {/* Tone Selector */}
          <div className="bg-purple-50 border-t border-purple-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Tone
            </p>
            <div className="flex gap-2">
              {(['professional', 'technical', 'creative'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    tone === t
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                      : 'bg-white border border-purple-200 text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview (45%) */}
        <div className="w-[45%]">
          <CVPreview cv={cvData} template={template} />
        </div>
      </div>
    </AppShell>
  )
}
