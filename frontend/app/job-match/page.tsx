'use client'

import { Suspense } from 'react'
import JobMatchContent from './JobMatchContent'

export default function JobMatchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <JobMatchContent />
    </Suspense>
  )
}
