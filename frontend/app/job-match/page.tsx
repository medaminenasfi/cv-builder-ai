'use client'

import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { CheckCircle2, XCircle, Zap, TrendingUp } from 'lucide-react'

export default function JobMatchPage() {
  const [inputType, setInputType] = useState<'url' | 'text'>('url')
  const [jobInput, setJobInput] = useState('')
  const [showResults, setShowResults] = useState(false)

  const handleScrape = () => {
    if (jobInput.trim()) {
      setShowResults(true)
    }
  }

  const mockResults = {
    atsScore: 78,
    foundKeywords: [
      'React',
      'TypeScript',
      'Node.js',
      'REST API',
      'Agile',
      'Team Leadership',
    ],
    missingKeywords: [
      'AWS Lambda',
      'GraphQL',
      'Kubernetes',
      'Machine Learning',
    ],
    gap: 'Your resume is strong, but consider adding AWS Lambda and GraphQL experience to boost your ATS score. Your leadership skills align well with the role requirements.',
    scoreHistory: [65, 68, 72, 75, 78],
  }

  return (
    <AppShell title="Job Match Analysis">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Input Card */}
        <div className="bg-white border border-purple-100 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Analyze Job Description
          </h2>

          {/* Input Type Tabs */}
          <div className="flex gap-3 mb-4">
            {[
              { type: 'url' as const, label: 'Job URL' },
              { type: 'text' as const, label: 'Paste Text' },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setInputType(tab.type)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  inputType === tab.type
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Input Field */}
          {inputType === 'url' ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://example.com/job-posting"
                className="flex-1 px-4 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleScrape}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Scrape
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="Paste the job description here..."
                rows={4}
                className="flex-1 px-4 py-2 border border-purple-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleScrape}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity h-fit"
              >
                Analyze
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="space-y-6">
            {/* ATS Score */}
            <div className="bg-white border border-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    ATS Score
                  </h3>
                  <p className="text-xs text-gray-600">
                    Compatibility with job description
                  </p>
                </div>

                {/* Donut Chart Placeholder */}
                <div className="relative w-32 h-32">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradientStroke)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(mockResults.atsScore / 100) * 282.7} 282.7`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradientStroke"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7c3aed"
                        />
                        <stop
                          offset="100%"
                          stopColor="#a855f7"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {mockResults.atsScore}
                      </p>
                      <p className="text-xs text-gray-500">/ 100</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Found Keywords */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Found Keywords
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockResults.foundKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="bg-white border border-purple-100 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle size={18} className="text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Missing Keywords
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockResults.missingKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Gap Analysis */}
            <div className="bg-gradient-to-r from-purple-50 to-transparent border border-purple-100 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Zap size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Gap Analysis
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {mockResults.gap}
                  </p>
                </div>
              </div>
            </div>

            {/* Rewrite Resume Button */}
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
              Rewrite Resume with AI
            </button>

            {/* Score History */}
            <div className="bg-white border border-purple-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Your Score History
                </h3>
              </div>
              <div className="flex items-end gap-2 h-16">
                {mockResults.scoreHistory.map((score, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-full bg-gradient-to-t from-purple-600 to-purple-500 rounded-t relative group"
                    style={{ height: `${(score / 100) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
