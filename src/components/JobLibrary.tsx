import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { Job } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function JobLibrary(): React.JSX.Element {
  const { selectedJob, setSelectedJob } = useWorkspace()
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)
  const [offset, setOffset] = useState(0)
  const queryClient = useQueryClient()
  const jobs = useQuery({
    queryKey: ['jobs', archived, search, offset],
    queryFn: () => api.searchJobs(archived, search, offset),
  })
  const archive = useMutation({
    mutationFn: ({ id, archived }: Pick<Job, 'id' | 'archived'>) => api.updateJob(id, { archived }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  })
  const refresh = useMutation({
    mutationFn: api.refreshJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  })
  const remove = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: (_, id) => {
      if (selectedJob?.id === id) setSelectedJob(null)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
  const filtered = (jobs.data || []).filter((job) =>
    `${job.title} ${job.company}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Panel
      title="Saved job library"
      description="Every refresh creates a new normalized snapshot instead of overwriting history."
    >
      <label className="block max-w-lg text-sm font-bold text-slate-700">
        Search saved jobs
        <input
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setOffset(0)
          }}
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={archived}
          onChange={(event) => {
            setArchived(event.target.checked)
            setOffset(0)
          }}
        />
        Show archived jobs
      </label>
      <StatusMessage
        message={
          jobs.error?.message ||
          archive.error?.message ||
          refresh.error?.message ||
          remove.error?.message ||
          null
        }
        tone="error"
      />
      {jobs.isLoading && (
        <p role="status" className="mt-4">
          Loading jobs…
        </p>
      )}
      {!jobs.isLoading && filtered.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 p-6 text-slate-600">
          No saved jobs match this search.
        </p>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <article key={job.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{job.title}</h3>
                <p className="text-sm text-slate-600">
                  {job.company || 'Company not set'} · {job.location || 'Location not set'}
                </p>
              </div>
              <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-800">
                v{job.version}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setSelectedJob(job)
                  window.location.hash = `#/jobs/${job.id}/prepare`
                }}
              >
                Open application workspace
              </Button>
              <Button
                variant="secondary"
                disabled={!job.source_url}
                busy={refresh.isPending}
                onClick={() => refresh.mutate(job.id)}
              >
                Refresh snapshot
              </Button>
              <Button
                variant="secondary"
                onClick={() => archive.mutate({ id: job.id, archived: !job.archived })}
              >
                {job.archived ? 'Restore' : 'Archive'}
              </Button>
              <Button variant="danger" onClick={() => remove.mutate(job.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          variant="secondary"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous jobs
        </Button>
        <Button
          variant="secondary"
          disabled={(jobs.data?.length || 0) < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next jobs
        </Button>
      </div>
    </Panel>
  )
}
