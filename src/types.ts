export type ApplicationStage = 'saved' | 'applied' | 'interview' | 'offer' | 'closed'

export interface Job {
  id: number
  title: string
  company: string
  location: string
  source_url: string
  description: string
  extraction_method: string
  content_hash: string
  version: number
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Dimension {
  key: string
  label: string
  score: number
  definition: string
  evidence: string[]
  confidence: number
}

export interface GapAction {
  keyword: string
  importance: 'high' | 'medium' | 'low'
  action: 'add' | 'clarify' | 'learn' | 'leave_unchanged'
  jd_evidence: string
  resume_evidence: string | null
  suggestion: string
  confidence: number
}

export interface Analysis {
  id?: number
  score: number
  verdict: string
  dimensions: Dimension[]
  gap_plan: GapAction[]
  methodology_version: string
}

export interface TailorResult {
  original: string
  tailored: string
  added_phrases: string[]
  warnings: string[]
}

export interface DocumentVersion {
  id: number
  logical_id: string
  job_id: number | null
  kind: 'resume' | 'cover_letter'
  title: string
  original_text: string
  content: string
  template: string
  version: number
  approved: boolean
  created_at: string
}

export interface Application {
  id: number
  job_id: number | null
  company: string
  role: string
  source_url: string
  stage: ApplicationStage
  deadline: string | null
  notes: string
  resume_document_id: number | null
  cover_letter_document_id: number | null
  created_at: string
  updated_at: string
}

export interface InterviewFeedback {
  score: number
  dimensions: Record<string, number>
  feedback: string
  matched_terms: string[]
  stronger_answer_outline: string
}

export interface InterviewSession {
  id: number
  job_id: number | null
  document_id: number | null
  interview_type: string
  questions: Array<{ id: number; type: string; question: string }>
  answers: Array<{ question_index: number; answer: string; feedback: InterviewFeedback }>
  status: string
  created_at: string
  updated_at: string
}

export interface OutreachKit {
  id: number
  job_id: number | null
  recipient_name: string
  recipient_role: string
  company: string
  tone: string
  variants: {
    subjects: string[]
    recruiter_email: string
    hiring_manager_note: string
    referral_request: string
    linkedin_message: string
    follow_ups: string[]
    evidence: string[]
  }
  created_at: string
}

export interface SearchResult {
  title: string
  fit_score: number
  reason: string
  links: Record<string, string>
}

export interface SavedSearch {
  id: number
  name: string
  preferences: Record<string, unknown>
  results: SearchResult[]
  created_at: string
  updated_at: string
}

export interface AnalyticsSummary {
  applications_by_stage: Record<ApplicationStage, number>
  average_match_score: number | null
  score_trend: Array<{ date: string; score: number; analysis_id: number }>
  recurring_gaps: Array<{ keyword: string; count: number }>
  interview_conversion_rate: number | null
  sample_size: number
}

export interface AuthSession {
  uid: string
  email: string
  displayName: string
  isDevelopment: boolean
}
