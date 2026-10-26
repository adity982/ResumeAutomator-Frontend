import { createContext } from 'react'

import type { Analysis, Job, TailorResult, WorkspaceData } from '../types'

export interface WorkspaceState {
  resumeText: string
  setResumeText: (value: string) => void
  jdText: string
  setJdText: (value: string) => void
  selectedJob: Job | null
  setSelectedJob: (value: Job | null) => void
  analysis: Analysis | null
  setAnalysis: (value: Analysis | null, expectedInput?: string) => void
  tailored: TailorResult | null
  setTailored: (value: TailorResult | null, expectedInput?: string) => void
  data: WorkspaceData
  updateData: (value: Partial<WorkspaceData>, expectedInput?: string) => void
  saveProgress: () => void
  restoreProgress: () => void
  forgetProgress: () => Promise<void>
  hasRecovery: boolean
  saveStatus: string
  saveError: string | null
  dirty: boolean
}

export const WorkspaceContext = createContext<WorkspaceState | null>(null)
