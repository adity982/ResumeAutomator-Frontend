import type { WorkspaceData } from '../types'

export function workspaceInputKey(data: WorkspaceData): string {
  return JSON.stringify([
    data.resume_text,
    data.jd_text,
    data.selected_job_id,
    data.target_title,
    data.target_company,
    data.target_url,
  ])
}
