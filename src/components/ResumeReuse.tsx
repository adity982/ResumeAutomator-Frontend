import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { workspaceInputKey } from '../utils/workspace'
import type { WorkspaceData } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function ResumeReuse(): React.JSX.Element | null {
  const workspace = useWorkspace()
  const [selected, setSelected] = useState('')
  const documents = useQuery({ queryKey: ['documents'], queryFn: api.listDocuments })
  const reuse = useMutation({
    mutationFn: ({ id, input }: { id: number; input: WorkspaceData }) =>
      api.reuseResume(input.selected_job_id!, id),
    onSuccess: (draft, { input }) => {
      workspace.updateData(
        { resume_text: draft.content, evidence_ids: draft.evidence_ids, resume_logical_id: null },
        workspaceInputKey(input),
      )
      workspace.setTailored(
        {
          original: draft.content,
          tailored: draft.content,
          added_phrases: [],
          warnings: draft.warnings,
        },
        workspaceInputKey({ ...input, resume_text: draft.content }),
      )
    },
  })
  if (!workspace.selectedJob) return null
  const families = new Set<string>()
  const latest = (documents.data || [])
    .filter((doc) => doc.kind === 'resume')
    .sort((a, b) => b.version - a.version)
    .filter((doc) => {
      if (families.has(doc.logical_id)) return false
      families.add(doc.logical_id)
      return true
    })
  return (
    <Panel
      title="Start from work you have already reviewed"
      description="Choose a saved resume instead of rewriting from scratch. This creates a fresh draft for the current job; the saved version stays intact."
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-bold text-slate-700">
          Saved resume to reuse
          <select
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 p-3"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">Choose a starting version</option>
            {latest.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} · v{doc.version} · {doc.approved ? 'reviewed' : 'draft'}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={!selected}
          busy={reuse.isPending}
          onClick={() => {
            if (
              workspace.resumeText.trim() &&
              !window.confirm(
                'Replace the resume draft in this workspace with the selected version? Save progress first if you want to keep it.',
              )
            )
              return
            reuse.mutate({ id: Number(selected), input: { ...workspace.data } })
          }}
        >
          Use as starting draft
        </Button>
      </div>
      {!documents.isLoading && !latest.length && (
        <p className="mt-3 text-sm text-slate-600">
          Save a resume version once, then reuse it for another target here.
        </p>
      )}
      <StatusMessage
        message={documents.error?.message || reuse.error?.message || null}
        tone="error"
      />
      {reuse.data &&
        workspace.data.resume_text === reuse.data.content &&
        workspace.selectedJob.id === reuse.data.job_id && (
          <p className="mt-3 text-sm text-slate-700" role="status">
            Copied {reuse.data.source_title} v{reuse.data.source_version}. Check company names and
            relevance, then preview and approve again.
          </p>
        )}
    </Panel>
  )
}
