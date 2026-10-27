import type {
  Analysis,
  AnalysisHistory,
  AnalyticsSummary,
  Application,
  ApplicationPackage,
  ApplicationStage,
  CareerEvidence,
  DocumentVersion,
  FollowUpTask,
  InterviewSession,
  Job,
  OutreachKit,
  SavedSearch,
  TailorResult,
  PortfolioSource,
  ProjectEvidence,
  ProjectRecommendation,
  WorkspaceData,
  Contact,
} from '../types'

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : '/api/v1')
const DEFAULT_TIMEOUT = 30_000

type TokenProvider = () => Promise<string | null>
let tokenProvider: TokenProvider = async () =>
  import.meta.env.DEV
    ? (import.meta.env.VITE_DEV_AUTH_TOKEN as string | undefined) ||
      'dev:local-user:local@example.com'
    : null

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider
}

export class ApiError extends Error {
  readonly status: number
  readonly requestId: string | null
  readonly fields: Record<string, string>

  constructor(
    message: string,
    status: number,
    requestId: string | null = null,
    fields: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
    this.fields = fields
  }
}

interface ErrorPayload {
  error?: { message?: string; request_id?: string; fields?: Record<string, string> }
  detail?: string
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const upstreamSignal = init.signal
  const abort = () => controller.abort()
  upstreamSignal?.addEventListener('abort', abort, { once: true })
  try {
    const token = await tokenProvider()
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !(init.body instanceof FormData))
      headers.set('Content-Type', 'application/json')
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    })
    if (!response.ok) {
      let payload: ErrorPayload = {}
      try {
        payload = (await response.json()) as ErrorPayload
      } catch {
        payload = {}
      }
      throw new ApiError(
        payload.error?.message ||
          payload.detail ||
          `Request failed with status ${response.status}.`,
        response.status,
        payload.error?.request_id || response.headers.get('x-request-id'),
        payload.error?.fields,
      )
    }
    if (response.status === 204) return undefined as T
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return (await response.json()) as T
    return (await response.blob()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request was cancelled or timed out.', 408)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    upstreamSignal?.removeEventListener('abort', abort)
  }
}

const json = (value: object): string => JSON.stringify(value)

export const api = {
  getJob: (id: number): Promise<Job> => request(`/jobs/${id}`),
  applicationEvents: (
    id: number,
  ): Promise<
    Array<{
      id: number
      event_type: string
      from_stage: string
      to_stage: string
      created_at: string
    }>
  > => request(`/applications/${id}/events`),
  async parseResume(file: File): Promise<{
    extracted_data: {
      raw_content: string
      name: string
      email: string
      phone: string
      links: string[]
      page_count: number
    }
  }> {
    const form = new FormData()
    form.append('file', file)
    return request('/resumes/parse', { method: 'POST', body: form })
  },
  scrapeJob(
    url: string,
  ): Promise<{ title: string; description: string; source_url: string; cached: boolean }> {
    return request('/jobs/scrape', { method: 'POST', body: json({ url }) })
  },
  listJobs(): Promise<Job[]> {
    return request('/jobs?limit=100')
  },
  searchJobs(archived = false, search = '', offset = 0): Promise<Job[]> {
    return request(
      `/jobs?archived=${archived}&search=${encodeURIComponent(search)}&offset=${offset}&limit=50`,
    )
  },
  createJob(payload: {
    title: string
    company: string
    location?: string
    source_url?: string
    description: string
    extraction_method?: string
  }): Promise<Job> {
    return request('/jobs', { method: 'POST', body: json(payload) })
  },
  updateJob(
    id: number,
    payload: Partial<Pick<Job, 'title' | 'company' | 'location' | 'archived'>>,
  ): Promise<Job> {
    return request(`/jobs/${id}`, { method: 'PATCH', body: json(payload) })
  },
  refreshJob(id: number): Promise<Job> {
    return request(`/jobs/${id}/refresh`, { method: 'POST' })
  },
  deleteJob(id: number): Promise<void> {
    return request(`/jobs/${id}`, { method: 'DELETE' })
  },
  analyze(payload: {
    resume_text: string
    jd_text: string
    job_id?: number
    document_id?: number
  }): Promise<Analysis> {
    return request('/analysis', { method: 'POST', body: json(payload) })
  },
  analysisHistory(): Promise<AnalysisHistory[]> {
    return request('/analysis/history')
  },
  compare(
    resumeText: string,
    targets: Array<{ label: string; jd_text: string }>,
  ): Promise<Array<{ label: string; analysis: Analysis }>> {
    return request('/analysis/batch', {
      method: 'POST',
      body: json({ resume_text: resumeText, targets }),
    })
  },
  tailor(payload: {
    resume_text: string
    jd_text: string
    confirmed_facts: string[]
    evidence_ids?: number[]
  }): Promise<TailorResult> {
    return request('/ai/tailor', { method: 'POST', body: json(payload) })
  },
  coverLetter(payload: {
    resume_text: string
    jd_text: string
    company: string
    role: string
  }): Promise<{ text: string }> {
    return request('/ai/cover-letter', { method: 'POST', body: json(payload) })
  },
  listDocuments(): Promise<DocumentVersion[]> {
    return request('/documents')
  },
  createDocument(payload: {
    logical_id?: string
    job_id?: number
    kind: string
    title: string
    original_text: string
    content: string
    template: string
    approved: boolean
    evidence_snapshot?: number[]
  }): Promise<DocumentVersion> {
    return request('/documents', { method: 'POST', body: json(payload) })
  },
  exportDocument(payload: {
    text: string
    template: string
    doc_type: string
    format: 'pdf' | 'docx'
    filename_hint: string
  }): Promise<Blob> {
    return request('/documents/export', { method: 'POST', body: json(payload) })
  },
  listApplications(): Promise<Application[]> {
    return request('/applications')
  },
  createApplication(payload: {
    company: string
    role: string
    source_url?: string
    stage?: ApplicationStage
    notes?: string
    deadline?: string | null
    job_id?: number
    resume_document_id?: number
    cover_letter_document_id?: number
  }): Promise<Application> {
    return request('/applications', { method: 'POST', body: json(payload) })
  },
  updateApplication(id: number, payload: Partial<Application>): Promise<Application> {
    return request(`/applications/${id}`, { method: 'PATCH', body: json(payload) })
  },
  deleteApplication(id: number): Promise<void> {
    return request(`/applications/${id}`, { method: 'DELETE' })
  },
  applicationPackage(id: number): Promise<ApplicationPackage> {
    return request(`/applications/${id}/package`)
  },
  listTasks(): Promise<FollowUpTask[]> {
    return request('/tasks')
  },
  createTask(payload: {
    application_id: number
    task_type: FollowUpTask['task_type']
    title: string
    due_at: string
    notes?: string
  }): Promise<FollowUpTask> {
    return request('/tasks', { method: 'POST', body: json(payload) })
  },
  updateTask(
    id: number,
    payload: {
      completed?: boolean
      title?: string
      due_at?: string
      notes?: string
      task_type?: FollowUpTask['task_type']
    },
  ): Promise<FollowUpTask> {
    return request(`/tasks/${id}`, { method: 'PATCH', body: json(payload) })
  },
  deleteTask(id: number): Promise<void> {
    return request(`/tasks/${id}`, { method: 'DELETE' })
  },
  listInterviews(): Promise<InterviewSession[]> {
    return request('/interviews')
  },
  createInterview(payload: {
    resume_text: string
    jd_text: string
    interview_type: string
    job_id?: number
  }): Promise<InterviewSession> {
    return request('/interviews', { method: 'POST', body: json(payload) })
  },
  answerInterview(id: number, questionIndex: number, answer: string): Promise<InterviewSession> {
    return request(`/interviews/${id}/answers`, {
      method: 'POST',
      body: json({ question_index: questionIndex, answer }),
    })
  },
  listOutreach(): Promise<OutreachKit[]> {
    return request('/outreach')
  },
  createOutreach(payload: {
    resume_text: string
    jd_text: string
    recipient_name: string
    recipient_role: string
    company: string
    tone: string
    call_to_action: string
    job_id?: number
    contact_id?: number
  }): Promise<OutreachKit> {
    return request('/outreach', { method: 'POST', body: json(payload) })
  },
  listSearches(): Promise<SavedSearch[]> {
    return request('/searches')
  },
  createSearch(payload: {
    name: string
    resume_text: string
    preferences: Record<string, unknown>
  }): Promise<SavedSearch> {
    return request('/searches', { method: 'POST', body: json(payload) })
  },
  listEvidence(): Promise<CareerEvidence[]> {
    return request('/evidence')
  },
  createEvidence(payload: {
    category: CareerEvidence['category']
    title: string
    statement: string
    source?: string
    verified?: boolean
    tags?: string[]
  }): Promise<CareerEvidence> {
    return request('/evidence', { method: 'POST', body: json(payload) })
  },
  updateEvidence(
    id: number,
    payload: Partial<
      Pick<CareerEvidence, 'category' | 'title' | 'statement' | 'source' | 'verified' | 'tags'>
    >,
  ): Promise<CareerEvidence> {
    return request(`/evidence/${id}`, { method: 'PATCH', body: json(payload) })
  },
  deleteEvidence(id: number): Promise<void> {
    return request(`/evidence/${id}`, { method: 'DELETE' })
  },
  analytics(
    filters: { date_from?: string; date_to?: string; company?: string; role?: string } = {},
  ): Promise<AnalyticsSummary> {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => Boolean(value)) as Array<[string, string]>,
    )
    return request(`/analytics/summary${params.size ? `?${params}` : ''}`)
  },
  deleteAccount(): Promise<void> {
    return request('/account', { method: 'DELETE' })
  },
  sources: (): Promise<PortfolioSource[]> => request('/sources'),
  previewSource: (url: string, useConnection = false): Promise<PortfolioSource> =>
    request(
      '/sources/preview',
      { method: 'POST', body: json({ url, use_connected_github: useConnection }) },
      90_000,
    ),
  githubConnection: (): Promise<{
    configured: boolean
    installation_url: string | null
    connected: boolean
    login: string | null
    expires_at: string | null
  }> => request('/connections/github'),
  startGitHubConnection: (): Promise<{ authorization_url: string }> =>
    request('/connections/github/start', { method: 'POST' }),
  completeGitHubConnection: (code: string, state: string): Promise<{ connected: boolean }> =>
    request('/connections/github/complete', { method: 'POST', body: json({ code, state }) }),
  disconnectGitHub: (): Promise<void> => request('/connections/github', { method: 'DELETE' }),
  importSource: (
    id: number,
    paths: string[],
    relationship: string,
    contribution: string,
  ): Promise<{ id: number; status: string }> =>
    request(`/sources/${id}/import`, {
      method: 'POST',
      body: json({ paths, relationship, contribution }),
    }),
  deleteSource: (id: number): Promise<void> => request(`/sources/${id}`, { method: 'DELETE' }),
  imports: (): Promise<Array<{ id: number; source_id: number; status: string; error: string }>> =>
    request('/imports'),
  cancelImport: (id: number): Promise<{ status: string }> =>
    request(`/imports/${id}/cancel`, { method: 'POST' }),
  projectEvidence: (id: number): Promise<ProjectEvidence[]> => request(`/sources/${id}/evidence`),
  reviewEvidence: (id: number, status: string, statement: string): Promise<unknown> =>
    request(`/project-evidence/${id}`, { method: 'PATCH', body: json({ status, statement }) }),
  recommendProjects: (id: number, maxProjects = 2): Promise<ProjectRecommendation> =>
    request(
      `/jobs/${id}/projects`,
      { method: 'POST', body: json({ max_projects: maxProjects, mode: 'hybrid' }) },
      90_000,
    ),
  projectHistory: (
    id: number,
  ): Promise<
    Array<{
      id: number
      result: ProjectRecommendation & { invalidated?: boolean; reason?: string }
    }>
  > => request(`/jobs/${id}/projects`),
  workspace: (): Promise<{ revision: number; data: WorkspaceData }> => request('/workspace'),
  saveWorkspace: (
    revision: number,
    data: WorkspaceData,
  ): Promise<{ revision: number; data: WorkspaceData }> =>
    request('/workspace', { method: 'PUT', body: json({ revision, data }) }),
  clearWorkspace: (): Promise<void> => request('/workspace', { method: 'DELETE' }),
  contacts: (jobId?: number): Promise<Contact[]> =>
    request(`/contacts${jobId ? `?job_id=${jobId}` : ''}`),
  createContact: (payload: Omit<Contact, 'id'>): Promise<Contact> =>
    request('/contacts', { method: 'POST', body: json(payload) }),
  updateContact: (
    id: number,
    payload: Partial<Pick<Contact, 'status' | 'follow_up_at' | 'stop_follow_up'>>,
  ): Promise<Contact> => request(`/contacts/${id}`, { method: 'PATCH', body: json(payload) }),
  deleteContact: (id: number): Promise<void> => request(`/contacts/${id}`, { method: 'DELETE' }),
  updateOutreach: (
    id: number,
    revision: number,
    payload: { status?: OutreachKit['status']; variants?: Partial<OutreachKit['variants']> },
  ): Promise<OutreachKit> =>
    request(`/outreach/${id}`, { method: 'PATCH', body: json({ revision, ...payload }) }),
  feedback: (payload: {
    job_id?: number
    task: string
    rating: number
    comment: string
    completed_without_help: boolean
  }): Promise<{ saved: boolean }> =>
    request('/pilot/feedback', { method: 'POST', body: json(payload) }),
  exportAccount: (): Promise<Record<string, unknown>> => request('/account/export'),
  capabilities: (): Promise<{ embedding_provider: string; embedding_version: string }> =>
    request('/capabilities'),
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
