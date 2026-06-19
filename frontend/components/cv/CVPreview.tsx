'use client'

import { CV } from '@/lib/mockData'

interface CVPreviewProps {
  cv: CV
  template: string
}

export function CVPreview({ cv, template }: CVPreviewProps) {
  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden h-full sticky top-6">
      {/* Preview Content */}
      <div className="p-6 text-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-4">
            <h1 className="text-lg font-bold text-gray-900">{cv.title}</h1>
            <p className="text-xs text-gray-500">
              {cv.summary || 'Professional Summary'}
            </p>
          </div>

          {/* Experience */}
          {cv.experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                Experience
              </h2>
              <div className="space-y-3">
                {cv.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{exp.title}</p>
                        <p className="text-xs text-gray-600">{exp.company}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {exp.start} – {exp.end}
                      </p>
                    </div>
                    <ul className="list-disc list-inside text-xs text-gray-700 mt-1 space-y-0.5">
                      {exp.bullets.slice(0, 2).map((bullet) => (
                        <li key={bullet.id} className="text-gray-600">
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {cv.skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1">
                {cv.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Badge */}
      <div className="bg-purple-50 px-6 py-3 border-t border-purple-100 text-xs text-purple-700">
        <span className="font-medium">{template}</span> Template
      </div>
    </div>
  )
}
