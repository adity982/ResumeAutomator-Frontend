import { useCallback, useReducer, useState, type PropsWithChildren } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { Analysis, Job, TailorResult, WorkspaceData } from '../types'
import { WorkspaceContext } from './workspace-context'
import { workspaceInputKey } from '../utils/workspace'

const empty: WorkspaceData = {
  resume_text: '',
  jd_text: '',
  selected_job_id: null,
  tailored_text: '',
  cover_letter: '',
  evidence_ids: [],
  resume_logical_id: null,
  cover_logical_id: null,
  target_title: 'Target role',
  target_company: '',
  target_url: '',
}
interface State {
  data: WorkspaceData
  selectedJob: Job | null
  analysis: Analysis | null
  tailored: TailorResult | null
}
type Action =
  | { type: 'update'; patch: Partial<WorkspaceData>; expectedInput?: string }
  | { type: 'job'; job: Job | null }
  | { type: 'analysis'; value: Analysis | null; expectedInput?: string }
  | { type: 'tailored'; value: TailorResult | null; expectedInput?: string }
  | { type: 'restore'; data: WorkspaceData; job: Job | null }
  | { type: 'reset' }
const initial: State = { data: empty, selectedJob: null, analysis: null, tailored: null }
function reducer(state: State, action: Action): State {
  if (
    'expectedInput' in action &&
    action.expectedInput &&
    action.expectedInput !== workspaceInputKey(state.data)
  )
    return state
  if (action.type === 'reset') return initial
  if (action.type === 'analysis') return { ...state, analysis: action.value }
  if (action.type === 'tailored')
    return {
      ...state,
      tailored: action.value,
      data: { ...state.data, tailored_text: action.value?.tailored || '' },
    }
  if (action.type === 'restore')
    return {
      data: action.data,
      selectedJob: action.job,
      analysis: null,
      tailored: action.data.tailored_text
        ? {
            original: action.data.resume_text,
            tailored: action.data.tailored_text,
            added_phrases: [],
            warnings: ['Recovered draft. Recheck evidence before approving.'],
          }
        : null,
    }
  if (action.type === 'job') {
    const job = action.job
    if (job && state.selectedJob?.id === job.id) return state
    return {
      ...state,
      selectedJob: job,
      analysis: null,
      tailored: null,
      data: {
        ...state.data,
        selected_job_id: job?.id || null,
        tailored_text: '',
        cover_letter: '',
        evidence_ids: [],
        resume_logical_id: null,
        cover_logical_id: null,
        ...(job
          ? {
              jd_text: job.description,
              target_title: job.title,
              target_company: job.company,
              target_url: job.source_url,
            }
          : {}),
      },
    }
  }
  const changed = [
    'resume_text',
    'jd_text',
    'selected_job_id',
    'target_title',
    'target_company',
    'target_url',
  ].some(
    (key) =>
      key in action.patch &&
      action.patch[key as keyof WorkspaceData] !== state.data[key as keyof WorkspaceData],
  )
  return {
    ...state,
    ...(changed ? { analysis: null, tailored: null } : {}),
    selectedJob: action.patch.selected_job_id === null ? null : state.selectedJob,
    data: {
      ...state.data,
      ...(changed
        ? {
            tailored_text: '',
            cover_letter: '',
            evidence_ids: [],
            resume_logical_id: null,
            cover_logical_id: null,
          }
        : {}),
      ...action.patch,
    },
  }
}

export function WorkspaceProvider({
  children,
  uid = 'local-user',
}: PropsWithChildren<{ uid?: string }>): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, initial)
  const selectJob = useCallback((job: Job | null) => dispatch({ type: 'job', job }), [])
  const [restored, setRestored] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const client = useQueryClient()
  const saved = useQuery({ queryKey: ['workspace', uid], queryFn: api.workspace })
  const save = useMutation({
    mutationFn: () => api.saveWorkspace(saved.data?.revision || 0, state.data),
    onSuccess: (value) => {
      client.setQueryData(['workspace', uid], value)
      setRestored(true)
    },
    onError: () => {
      void saved.refetch()
    },
  })
  const restore = useMutation({
    mutationFn: async () => {
      const latest = await api.workspace()
      const data = { ...empty, ...latest.data }
      const job = data.selected_job_id
        ? await api.getJob(data.selected_job_id).catch(() => null)
        : null
      return { latest, data: { ...data, selected_job_id: job?.id || null }, job }
    },
    onSuccess: ({ latest, data, job }) => {
      client.setQueryData(['workspace', uid], latest)
      dispatch({ type: 'restore', data, job })
      setRestored(true)
      setRestoreError(null)
    },
    onError: (error) => setRestoreError(error.message),
  })
  const forgetProgress = async (): Promise<void> => {
    await api.clearWorkspace()
    client.setQueryData(['workspace', uid], { revision: 0, data: empty })
    dispatch({ type: 'reset' })
    setRestored(true)
  }
  const dirty = JSON.stringify(state.data) !== JSON.stringify({ ...empty, ...saved.data?.data })
  return (
    <WorkspaceContext.Provider
      value={{
        data: state.data,
        updateData: (patch, expectedInput) => dispatch({ type: 'update', patch, expectedInput }),
        resumeText: state.data.resume_text,
        setResumeText: (value) => dispatch({ type: 'update', patch: { resume_text: value } }),
        jdText: state.data.jd_text,
        setJdText: (value) =>
          dispatch({ type: 'update', patch: { jd_text: value, selected_job_id: null } }),
        selectedJob: state.selectedJob,
        setSelectedJob: selectJob,
        analysis: state.analysis,
        setAnalysis: (value, expectedInput) => dispatch({ type: 'analysis', value, expectedInput }),
        tailored: state.tailored,
        setTailored: (value, expectedInput) => dispatch({ type: 'tailored', value, expectedInput }),
        saveProgress: () => save.mutate(),
        restoreProgress: () => restore.mutate(),
        forgetProgress,
        hasRecovery: !restored && Boolean(saved.data?.revision),
        saveStatus: save.isPending
          ? 'Saving progress…'
          : dirty
            ? 'Unsaved changes'
            : saved.data?.revision
              ? 'Progress saved to your account'
              : 'Progress stays in this tab until you save',
        saveError: save.error?.message || saved.error?.message || restoreError,
        dirty,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
