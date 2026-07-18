import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { Job } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function JobLibrary(): React.JSX.Element {
  const { setSelectedJob, setJdText } = useWorkspace()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: api.listJobs })
  const archive = useMutation({ mutationFn: ({ id, archived }: Pick<Job, 'id' | 'archived'>) => api.updateJob(id, { archived }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }) })
  const refresh = useMutation({ mutationFn: api.refreshJob, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }) })
  const remove = useMutation({ mutationFn: api.deleteJob, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }) })
  const filtered = (jobs.data || []).filter((job) => `${job.title} ${job.company}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <Panel title="Saved job library" description="Every refresh creates a new normalized snapshot instead of overwriting history.">
      <label className="block max-w-lg text-sm font-bold text-slate-700">Search saved jobs<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <StatusMessage message={jobs.error?.message || archive.error?.message || refresh.error?.message || remove.error?.message || null} tone="error" />
      {jobs.isLoading && <p role="status" className="mt-4">Loading jobs…</p>}
      {!jobs.isLoading && filtered.length === 0 && <p className="mt-4 rounded-xl bg-slate-50 p-6 text-slate-600">No saved jobs match this search.</p>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <article key={job.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-950">{job.title}</h3><p className="text-sm text-slate-600">{job.company || 'Company not set'} · {job.location || 'Location not set'}</p></div><span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800">v{job.version}</span></div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => { setSelectedJob(job); setJdText(job.description) }}>Use in workbench</Button>
              <Button variant="secondary" disabled={!job.source_url} busy={refresh.isPending} onClick={() => refresh.mutate(job.id)}>Refresh snapshot</Button>
              <Button variant="secondary" onClick={() => archive.mutate({ id: job.id, archived: true })}>Archive</Button>
              <Button variant="danger" onClick={() => remove.mutate(job.id)}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
