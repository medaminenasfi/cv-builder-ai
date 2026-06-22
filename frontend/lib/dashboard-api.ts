import { apiFetch } from './api';

export interface DashboardStats {
  totalResumes: number;
  avgAtsScore: number | null;
  jobMatchesCompleted: number;
  aiEnhancementsUsed: number;
  resumeViews: number;
  exportCount: number;
  trends: {
    resumes: number;
    atsScore: number;
    jobMatches: number;
    aiUsage: number;
    views: number;
    exports: number;
  };
}

export function getDashboardStats() {
  return apiFetch<DashboardStats>('/dashboard/stats');
}

export function getCvAtsScores() {
  return apiFetch<Record<string, number>>('/dashboard/cv-ats-scores');
}
