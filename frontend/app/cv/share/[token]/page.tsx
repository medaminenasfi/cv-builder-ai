'use client'

import { MOCK_CVS } from '@/lib/mockData'
import { Download, Share2 } from 'lucide-react'

export default function CVSharePage({
  params,
}: {
  params: { token: string }
}) {
  const cv = MOCK_CVS[0] // In real app, fetch by token

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Resume Content */}
        <div className="bg-white">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {cv.title}
            </h1>
            <p className="text-gray-600">
              {cv.summary || 'Professional Resume'}
            </p>
          </div>

          {/* Experience */}
          {cv.experience.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">
                Experience
              </h2>
              <div className="space-y-6">
                {cv.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {exp.title}
                        </p>
                        <p className="text-gray-600">{exp.company}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {exp.start} – {exp.end}
                      </p>
                    </div>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                      {exp.bullets.map((bullet) => (
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
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex gap-3 sticky bottom-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Download size={16} />
            Download PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-500">
            Made with{' '}
            <span className="text-purple-600 font-semibold">ResumeAI</span> •
            Your ATS-optimized resume builder
          </p>
        </div>
      </div>
    </div>
  )
}
