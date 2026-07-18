import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api, downloadBlob } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

const templates = ['standard', 'modern', 'executive', 'minimalist', 'creative'] as const

export function DocumentPreview(): React.JSX.Element {
  const { tailored, selectedJob } = useWorkspace()
  const [template, setTemplate] = useState<(typeof templates)[number]>('standard')
  const [approved, setApproved] = useState(false)
  const queryClient = useQueryClient()
  const content = tailored?.tailored || ''
  const estimatedPages = Math.max(1, Math.ceil(content.length / 3_500))
  const filename = `${selectedJob?.company || 'Tailored'}_${selectedJob?.title || 'Resume'}`.replace(/\s+/g, '_')

  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'docx') => api.exportDocument({ text: content, template, doc_type: 'resume', format, filename_hint: filename }),
    onSuccess: (blob, format) => downloadBlob(blob, `${filename}.${format}`),
  })
  const saveMutation = useMutation({
    mutationFn: () => api.createDocument({ job_id: selectedJob?.id, kind: 'resume', title: filename, original_text: tailored?.original || '', content, template, approved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  if (!tailored) return <Panel title="Document preview" description="Tailor a resume to preview and export it." />
  return (
    <Panel title="Live document preview" description="Check pagination and overflow before creating a versioned PDF or DOCX.">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold text-slate-700">
          Template
          <select className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-white px-3" value={template} onChange={(event) => setTemplate(event.target.value as (typeof templates)[number])}>
            {templates.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /> Approved version
        </label>
        <Button onClick={() => saveMutation.mutate()} busy={saveMutation.isPending}>Save version</Button>
        <Button variant="secondary" onClick={() => exportMutation.mutate('pdf')} busy={exportMutation.isPending}>Export PDF</Button>
        <Button variant="secondary" onClick={() => exportMutation.mutate('docx')} busy={exportMutation.isPending}>Export DOCX</Button>
      </div>
      <StatusMessage message={estimatedPages > 2 ? `Estimated ${estimatedPages} pages. Consider shortening the document.` : `Estimated ${estimatedPages} page${estimatedPages === 1 ? '' : 's'}.`} tone={estimatedPages > 2 ? 'error' : 'info'} />
      <StatusMessage message={saveMutation.isSuccess ? 'Document version saved.' : saveMutation.error?.message || exportMutation.error?.message || null} tone={saveMutation.isSuccess ? 'success' : saveMutation.error || exportMutation.error ? 'error' : 'info'} />
      <article className={`mx-auto mt-5 min-h-[52rem] max-w-3xl whitespace-pre-wrap border bg-white p-10 shadow-xl template-${template}`} aria-label="Document print preview">
        {content}
      </article>
    </Panel>
  )
}
