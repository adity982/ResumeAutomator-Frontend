import { createContext } from 'react'

import type { Analysis, Job, TailorResult } from '../types'

export interface WorkspaceState {
  resumeText: string
  setResumeText: (value: string) => void
  jdText: string
  setJdText: (value: string) => void
  selectedJob: Job | null
  setSelectedJob: (value: Job | null) => void
  analysis: Analysis | null
  setAnalysis: (value: Analysis | null) => void
  tailored: TailorResult | null
  setTailored: (value: TailorResult | null) => void
}

export const WorkspaceContext = createContext<WorkspaceState | null>(null)
