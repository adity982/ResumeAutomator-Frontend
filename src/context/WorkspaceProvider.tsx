import { useMemo, useState, type PropsWithChildren } from 'react'

import type { Analysis, Job, TailorResult } from '../types'
import { WorkspaceContext } from './workspace-context'

export function WorkspaceProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [tailored, setTailored] = useState<TailorResult | null>(null)
  const value = useMemo(
    () => ({ resumeText, setResumeText, jdText, setJdText, selectedJob, setSelectedJob, analysis, setAnalysis, tailored, setTailored }),
    [analysis, jdText, resumeText, selectedJob, tailored],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
