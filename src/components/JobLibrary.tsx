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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['work-queue'] })
    },
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
      queryClient.invalidateQueries({ queryKey: ['work-queue'] })
    },
  })
  const filtered = (jobs.data || []).filter((job) =>
    `${job.title} ${job.company}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Panel
      className="jobs-panel"
      title="Saved job library"
      description="The opportunities you’re considering. Open one to pick up where you left off."
    >
      <label className="block max-w-lg text-sm font-medium text-ink-700">
        Search saved jobs
        <input
          className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setOffset(0)
          }}
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
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
        <p className="mt-4 rounded-lg bg-ink-50 p-6 text-ink-600">
          No saved jobs match this search.
        </p>
      )}
      <div className="job-list">
        {filtered.map((job) => (
          <article key={job.id} className="job-row">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink-950">{job.title}</h3>
                <p className="text-sm text-ink-600">
                  {job.company || 'Company not set'} · {job.location || 'Location not set'}
                </p>
              </div>
              <span className="version-label" title="Saved job snapshot">
                v{job.version}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-600">{job.description}</p>
            <div className="job-row-actions">
              <Button
                onClick={() => {
                  setSelectedJob(job)
                  window.location.hash = `#/jobs/${job.id}/prepare`
                }}
              >
                Open application workspace
              </Button>
              <Button
                variant="ghost"
                disabled={!job.source_url}
                busy={refresh.isPending}
                onClick={() => refresh.mutate(job.id)}
              >
                Refresh snapshot
              </Button>
              <Button
                variant="ghost"
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
