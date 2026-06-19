'use client'

import { AppShell } from '@/components/layout/AppShell'
import { TEMPLATES } from '@/lib/mockData'
import { useState } from 'react'

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0])

  const templateDescriptions: Record<string, string> = {
    Modern: 'Clean, contemporary design with emphasis on skills and achievements',
    Classic:
      'Traditional format that works with all ATS systems, perfect for corporate roles',
    Minimal: 'Distraction-free layout focusing entirely on content and experience',
    Executive:
      'Professional design for senior leadership and C-level positions',
    Creative: 'Modern design with visual elements for creative professionals',
  }

  return (
    <AppShell title="CV Templates">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Choose a template for your resume. Each template is optimized for ATS
          compatibility and visual appeal.
        </p>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => (
            <div
              key={template}
              className={`relative bg-white border-2 rounded-xl p-4 cursor-pointer transition-all ${
                activeTemplate === template
                  ? 'border-purple-500 shadow-lg'
                  : 'border-purple-100 hover:border-purple-300'
              }`}
              onClick={() => setActiveTemplate(template)}
            >
              {/* Template Thumbnail */}
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded mx-auto mb-2"></div>
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-gray-300 rounded mx-auto"></div>
                    <div className="h-2 w-20 bg-gray-300 rounded mx-auto"></div>
                  </div>
                </div>
              </div>

              {/* Template Name */}
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {template}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                {templateDescriptions[template]}
              </p>

              {/* Use Template Button */}
              <button
                className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTemplate === template
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                    : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
                }`}
              >
                {activeTemplate === template ? 'Selected' : 'Use Template'}
              </button>

              {/* Active Badge */}
              {activeTemplate === template && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Active
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Preview Section */}
        <div className="bg-white border border-purple-100 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {activeTemplate} Template Preview
          </h3>

          {/* Preview Content */}
          <div className="bg-gray-50 rounded-lg p-6 text-sm space-y-4">
            <div className="border-b-2 border-gray-300 pb-4">
              <h2 className="text-lg font-bold text-gray-900">John Doe</h2>
              <p className="text-xs text-gray-600">
                Senior Software Engineer | Full Stack Developer
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-gray-700 mb-2">
                Experience
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Senior Developer
                  </p>
                  <p className="text-xs text-gray-600">TechCorp • 2022 – Present</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase text-gray-700 mb-2">
                Skills
              </h3>
              <p className="text-xs text-gray-700">
                React, TypeScript, Node.js, PostgreSQL, Docker, AWS
              </p>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
              Use This Template
            </button>
            <button className="px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors">
              Preview Full
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
