import { useMutation, useQuery } from '@tanstack/react-query'
import { api, downloadBlob } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { DocumentVersion } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function DocumentLibrary({ jobId }: { jobId?: number }): React.JSX.Element {
  const documents = useQuery({ queryKey: ['documents'], queryFn: api.listDocuments })
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: api.listJobs })
  const workspace = useWorkspace()
  const download = useMutation({
    mutationFn: async ({
      document,
      format,
    }: {
      document: DocumentVersion
      format: 'pdf' | 'docx'
    }) => ({
      blob: await api.exportDocument({
        text: document.content,
        template: document.template,
        doc_type: document.kind,
        format,
        filename_hint: document.title,
      }),
      filename: `${document.title}_v${document.version}.${format}`,
    }),
    onSuccess: (result) => downloadBlob(result.blob, result.filename),
  })
  const edit = (document: DocumentVersion): void => {
    const job = jobs.data?.find((item) => item.id === document.job_id)
    workspace.setSelectedJob(job || null)
    if (document.kind === 'resume') {
      workspace.setResumeText(document.original_text || document.content)
      workspace.setTailored({
        original: document.original_text,
        tailored: document.content,
        added_phrases: [],
        warnings: ['Editing creates a new version. Review evidence again before approval.'],
      })
      workspace.updateData({
        resume_logical_id: document.logical_id,
        evidence_ids: document.evidence_snapshot.map((item) => item.evidence_id),
      })
    } else
      workspace.updateData({
        cover_letter: document.content,
        cover_logical_id: document.logical_id,
      })
    window.location.assign(job ? `#/jobs/${job.id}/prepare` : '#/jobs/new')
  }
  const filtered = (documents.data || []).filter((document) => !jobId || document.job_id === jobId)
  return (
    <Panel
      title="Saved document versions"
      description="Every save is immutable. Editing an approved document creates a new version that needs fresh review."
    >
      <StatusMessage
        message={documents.error?.message || download.error?.message || null}
        tone="error"
      />
      {documents.isLoading && <p role="status">Loading documents…</p>}
      {!documents.isLoading && !filtered.length && (
        <p className="text-ink-600">
          No saved documents yet. Prepare a resume or cover letter, preview it, then save a version.
        </p>
      )}
      <div className="space-y-4">
        {filtered.map((document) => (
          <article key={document.id} className="rounded-lg border border-ink-200 p-4">
            <h3 className="font-medium">{document.title}</h3>
            <p className="mt-1 text-sm text-ink-500">
              {document.kind.replace('_', ' ')} · Version {document.version} ·{' '}
              {document.approved ? 'Approved snapshot' : 'Draft'} ·{' '}
              {new Date(document.created_at).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => edit(document)}>
                Edit as next version
              </Button>
              {(['pdf', 'docx'] as const).map((format) => (
                <Button
                  key={format}
                  variant="secondary"
                  onClick={() => download.mutate({ document, format })}
                >
                  Download {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
