'use client'

import { AppShell } from '@/components/layout/AppShell'
import { CVCard } from '@/components/cv/CVCard'
import { MOCK_CVS } from '@/lib/mockData'
import { Plus, FileText } from 'lucide-react'
import { useState } from 'react'

export default function DashboardPage() {
  const [cvs, setCVs] = useState(MOCK_CVS)

  const handleNewResume = () => {
    alert('New resume creation not yet implemented')
  }

  const handleEdit = (id: string) => {
    alert(`Edit CV ${id}`)
  }

  const handleDuplicate = (id: string) => {
    const cvToDuplicate = cvs.find((cv) => cv.id === id)
    if (cvToDuplicate) {
      const newCV = {
        ...cvToDuplicate,
        id: Date.now().toString(),
        title: `${cvToDuplicate.title} (Copy)`,
      }
      setCVs([...cvs, newCV])
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this CV?')) {
      setCVs(cvs.filter((cv) => cv.id !== id))
    }
  }

  const handleShare = (id: string) => {
    alert(`Share link for CV ${id}`)
  }

  const actions = (
    <button
      onClick={handleNewResume}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
    >
      <Plus size={18} />
      New Resume
    </button>
  )

  return (
    <AppShell title="My Resumes" actions={actions}>
      {cvs.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-96">
          <FileText size={48} className="text-purple-200 mb-4" />
          <p className="text-sm text-gray-700 font-medium mb-4">
            No resumes yet
          </p>
          <button
            onClick={handleNewResume}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Your First Resume
          </button>
        </div>
      ) : (
        /* CV Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cvs.map((cv) => (
            <CVCard
              key={cv.id}
              cv={cv}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </AppShell>
  )
}
