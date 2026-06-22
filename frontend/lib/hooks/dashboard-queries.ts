'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getCvAtsScores } from '@/lib/dashboard-api'
import { listCVs } from '@/lib/cvs-api'
import { listActiveTemplates } from '@/lib/templates-api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  })
}

export function useCvAtsScores() {
  return useQuery({
    queryKey: ['dashboard', 'cv-ats-scores'],
    queryFn: getCvAtsScores,
  })
}

export function useCVList() {
  return useQuery({
    queryKey: ['cvs'],
    queryFn: listCVs,
  })
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates', 'active'],
    queryFn: listActiveTemplates,
  })
}
