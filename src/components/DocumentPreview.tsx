import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api, downloadBlob } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { ResumeChangeReview } from './ResumeChangeReview'

const templates = ['standard', 'modern', 'executive', 'minimalist', 'creative'] as const

export function DocumentPreview({
  kind = 'resume',
}: {
  kind?: 'resume' | 'cover_letter'
}): React.JSX.Element {
  const { tailored, selectedJob, data, updateData } = useWorkspace()
  const [template, setTemplate] = useState<(typeof templates)[number]>('standard')
  const [approvalKey, setApprovalKey] = useState('')
  const [preview, setPreview] = useState<{ url: string; identity: string } | null>(null)
  const queryClient = useQueryClient()
  const content = kind === 'resume' ? tailored?.tailored || '' : data.cover_letter
  const evidenceIds = kind === 'resume' ? data.evidence_ids : []
  const identity = JSON.stringify([content, template, kind, evidenceIds, selectedJob?.id])
  const approved = approvalKey === identity
  const filename =
    `${selectedJob?.company || 'Target'}_${selectedJob?.title || 'Application'}_${kind}`.replace(
      /\s+/g,
      '_',
    )
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url)
    },
    [preview],
  )
  const previewMutation = useMutation({
    mutationFn: async () => ({
      blob: await api.exportDocument({
        text: content,
        template,
        doc_type: kind,
        format: 'pdf',
        filename_hint: filename,
      }),
      identity,
    }),
    onSuccess: (value) =>
      setPreview({ url: URL.createObjectURL(value.blob), identity: value.identity }),
  })

  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'docx') =>
      api.exportDocument({
        text: content,
        template,
        doc_type: kind,
        format,
        filename_hint: filename,
      }),
    onSuccess: (blob, format) => downloadBlob(blob, `${filename}.${format}`),
  })
  const saveMutation = useMutation({
    mutationFn: () =>
      api.createDocument({
        logical_id:
          (kind === 'resume' ? data.resume_logical_id : data.cover_logical_id) || undefined,
        job_id: selectedJob?.id,
        kind,
        title: filename,
        original_text: kind === 'resume' ? tailored?.original || '' : '',
        content,
        template,
        approved,
        evidence_snapshot: evidenceIds,
      }),
    onSuccess: (document) => {
      updateData(
        kind === 'resume'
          ? { resume_logical_id: document.logical_id }
          : { cover_logical_id: document.logical_id },
      )
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['application-package'] })
    },
  })

  if (!content)
    return <Panel title="Document preview" description="Create a draft to preview and export it." />
  return (
    <Panel
      title={
        kind === 'resume' ? 'Resume preview and versions' : 'Cover letter preview and versions'
      }
      description="Preview the actual generated PDF. Approval applies only to this content, template, job and evidence selection."
    >
      {kind === 'resume' && (
        <ResumeChangeReview original={tailored?.original || ''} draft={content} />
      )}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold text-slate-700">
          Template
          <select
            className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-white px-3"
            value={template}
            onChange={(event) => setTemplate(event.target.value as (typeof templates)[number])}
          >
            {templates.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={approved}
            disabled={preview?.identity !== identity}
            onChange={(event) => setApprovalKey(event.target.checked ? identity : '')}
          />{' '}
          I reviewed this exact version
        </label>
        <Button onClick={() => saveMutation.mutate()} busy={saveMutation.isPending}>
          Save version
        </Button>
        <Button
          variant="secondary"
          busy={previewMutation.isPending}
          onClick={() => previewMutation.mutate()}
        >
          Preview PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportMutation.mutate('pdf')}
          busy={exportMutation.isPending}
        >
          Export PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportMutation.mutate('docx')}
          busy={exportMutation.isPending}
        >
          Export DOCX
        </Button>
      </div>
      <StatusMessage
        message={
          saveMutation.data
            ? `Saved ${saveMutation.data.approved ? 'approved' : 'draft'} version ${saveMutation.data.version}. Save progress to recover this document family later.`
            : null
        }
        tone="success"
      />
      <StatusMessage
        message={
          saveMutation.error?.message ||
          exportMutation.error?.message ||
          previewMutation.error?.message ||
          null
        }
        tone="error"
      />
      {preview?.identity === identity ? (
        <>
          <iframe
            title="Exported PDF preview"
            className="mt-5 h-[45rem] w-full rounded-lg border border-slate-300"
            src={preview.url}
          />
          <a
            className="mt-2 inline-block text-sm text-cyan-800 underline"
            target="_blank"
            rel="noreferrer"
            href={preview.url}
          >
            Open this PDF in a new tab
          </a>
        </>
      ) : (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
          Generate a fresh preview after changing the document. Review pagination, names and links
          before approving.
        </p>
      )}
    </Panel>
  )
}
