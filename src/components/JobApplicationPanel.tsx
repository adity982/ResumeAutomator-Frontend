import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { ApplicationStage, Job } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { ApplicationFollowUps } from './ApplicationFollowUps'

export function JobApplicationPanel({ job }: { job: Job }): React.JSX.Element {
  const client = useQueryClient()
  const [resume, setResume] = useState('')
  const [letter, setLetter] = useState('')
  const [deadline, setDeadline] = useState('')
  const applications = useQuery({ queryKey: ['applications'], queryFn: api.listApplications })
  const documents = useQuery({ queryKey: ['documents'], queryFn: api.listDocuments })
  const application = applications.data?.find((item) => item.job_id === job.id)
  const events = useQuery({
    queryKey: ['application-events', application?.id],
    queryFn: () => api.applicationEvents(application!.id),
    enabled: Boolean(application),
  })
  const refresh = (): void => {
    client.invalidateQueries({ queryKey: ['applications'] })
    client.invalidateQueries({ queryKey: ['application-events'] })
    client.invalidateQueries({ queryKey: ['analytics'] })
    client.invalidateQueries({ queryKey: ['application-package'] })
    client.invalidateQueries({ queryKey: ['work-queue'] })
  }
  const create = useMutation({
    mutationFn: () =>
      api.createApplication({
        job_id: job.id,
        company: job.company || 'Company not specified',
        role: job.title,
        source_url: job.source_url,
        resume_document_id: resume ? Number(resume) : undefined,
        cover_letter_document_id: letter ? Number(letter) : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    onSuccess: refresh,
  })
  const attach = useMutation({
    mutationFn: () =>
      api.updateApplication(application!.id, {
        resume_document_id: resume ? Number(resume) : null,
        cover_letter_document_id: letter ? Number(letter) : null,
      }),
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: (stage: ApplicationStage) => api.updateApplication(application!.id, { stage }),
    onSuccess: refresh,
  })
  const eligible = (kind: string) =>
    (documents.data || []).filter(
      (document) => document.job_id === job.id && document.kind === kind && document.approved,
    )
  return (
    <Panel
      title="Application package and timeline"
      description="Attach approved document snapshots and record what happened. Stage history drives your conversion metrics."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">
          Approved resume
          <select
            className="mt-2 block w-full rounded-lg border border-ink-300 p-3"
            value={resume}
            onChange={(event) => setResume(event.target.value)}
          >
            <option value="">Select version</option>
            {eligible('resume').map((document) => (
              <option key={document.id} value={document.id}>
                {document.title} · v{document.version}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Approved cover letter
          <select
            className="mt-2 block w-full rounded-lg border border-ink-300 p-3"
            value={letter}
            onChange={(event) => setLetter(event.target.value)}
          >
            <option value="">None / not required</option>
            {eligible('cover_letter').map((document) => (
              <option key={document.id} value={document.id}>
                {document.title} · v{document.version}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Deadline if known
          <input
            className="mt-2 block w-full rounded-lg border border-ink-300 p-3"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {application ? (
          <>
            <Button
              disabled={!resume && !letter}
              busy={attach.isPending}
              onClick={() => attach.mutate()}
            >
              Attach selected versions
            </Button>
            <label className="text-sm font-medium">
              Stage
              <select
                className="ml-2 rounded-lg border border-ink-300 p-3"
                value={application.stage}
                onChange={(event) => update.mutate(event.target.value as ApplicationStage)}
              >
                {['saved', 'applied', 'interview', 'offer', 'closed'].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <p className="text-sm text-ink-600">
              Current package: resume {application.resume_document_id || 'not attached'}, cover
              letter {application.cover_letter_document_id || 'not attached'}
            </p>
          </>
        ) : (
          <Button busy={create.isPending} onClick={() => create.mutate()}>
            Add this job to my application tracker
          </Button>
        )}
      </div>
      <StatusMessage
        message={
          create.error?.message ||
          attach.error?.message ||
          update.error?.message ||
          documents.error?.message ||
          applications.error?.message ||
          events.error?.message ||
          null
        }
        tone="error"
      />
      {!eligible('resume').length && (
        <p className="mt-3 text-sm text-ink-600">
          Next step: preview and approve a resume in Prepare application.
        </p>
      )}
      {application && application.stage !== 'closed' && (
        <ApplicationFollowUps
          key={application.id}
          applicationId={application.id}
          role={job.title}
        />
      )}
      {events.data && (
        <ol className="mt-6 space-y-3">
          {events.data.map((event) => (
            <li key={event.id} className="border-l-2 border-brand-200 pl-4 text-sm">
              <p className="font-medium">
                {event.event_type.replaceAll('_', ' ')}
                {event.to_stage ? ` · ${event.to_stage}` : ''}
              </p>
              <time className="text-ink-500">{new Date(event.created_at).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
