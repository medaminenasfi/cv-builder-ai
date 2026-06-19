'use client'

interface CVPreviewProps {
  title: string
  summary?: string
  template?: string
}

export function CVPreview({ title, summary, template = 'Modern' }: CVPreviewProps) {
  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden h-full sticky top-6">
      <div className="p-6 text-sm">
        <div className="space-y-4">
          <div className="border-b-2 border-gray-200 pb-4">
            <h1 className="text-lg font-bold text-gray-900">{title || 'Untitled Resume'}</h1>
            <p className="text-xs text-gray-500 mt-2">
              {summary || 'Your professional summary will appear here...'}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-purple-50 px-6 py-3 border-t border-purple-100 text-xs text-purple-700">
        <span className="font-medium">{template}</span> Template Preview
      </div>
    </div>
  )
}
