import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import type { Application, ApplicationStage, FollowUpTask } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

const stages: ApplicationStage[] = ['saved', 'applied', 'interview', 'offer', 'closed']

export function ApplicationBoard(): React.JSX.Element {
  const [company, setCompany] = useState('')
  const [jobId, setJobId] = useState('')
  const [role, setRole] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [resumeDocumentId, setResumeDocumentId] = useState('')
  const [coverLetterDocumentId, setCoverLetterDocumentId] = useState('')
  const [search, setSearch] = useState('')
  const [taskApplicationId, setTaskApplicationId] = useState('')
  const [taskTitle, setTaskTitle] = useState('Follow up with recruiter')
  const [taskType, setTaskType] = useState<FollowUpTask['task_type']>('follow_up')
  const [taskDue, setTaskDue] = useState('')
  const [packageApplicationId, setPackageApplicationId] = useState<number | null>(null)
  const [renderedAt] = useState(() => Date.now())
  const queryClient = useQueryClient()
  const applications = useQuery({ queryKey: ['applications'], queryFn: api.listApplications })
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: api.listJobs })
  const documents = useQuery({ queryKey: ['documents'], queryFn: api.listDocuments })
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: api.listTasks })
  const applicationPackage = useQuery({
    queryKey: ['application-package', packageApplicationId],
    queryFn: () => api.applicationPackage(packageApplicationId as number),
    enabled: packageApplicationId !== null,
  })
  const create = useMutation({
    mutationFn: () =>
      api.createApplication({
        job_id: jobId ? Number(jobId) : undefined,
        company,
        role,
        source_url: sourceUrl,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        notes,
        resume_document_id: resumeDocumentId ? Number(resumeDocumentId) : undefined,
        cover_letter_document_id: coverLetterDocumentId ? Number(coverLetterDocumentId) : undefined,
      }),
    onSuccess: () => {
      setCompany('')
      setJobId('')
      setRole('')
      setSourceUrl('')
      setDeadline('')
      setNotes('')
      setResumeDocumentId('')
      setCoverLetterDocumentId('')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
  const update = useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: number
      stage?: ApplicationStage
      outcome?: Application['outcome']
    }) => api.updateApplication(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['application-package'] })
    },
  })
  const remove = useMutation({
    mutationFn: api.deleteApplication,
    onSuccess: (_, id) => {
      if (packageApplicationId === id) setPackageApplicationId(null)
      if (taskApplicationId === String(id)) setTaskApplicationId('')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
  const createTask = useMutation({
    mutationFn: () =>
      api.createTask({
        application_id: Number(taskApplicationId),
        task_type: taskType,
        title: taskTitle,
        due_at: new Date(taskDue).toISOString(),
      }),
    onSuccess: () => {
      setTaskTitle('Follow up with recruiter')
      setTaskDue('')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
  const completeTask = useMutation({
    mutationFn: (task: FollowUpTask) => api.updateTask(task.id, { completed: !task.completed_at }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const removeTask = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const grouped = useMemo(() => {
    const result = Object.fromEntries(
      stages.map((stage) => [stage, [] as Application[]]),
    ) as Record<ApplicationStage, Application[]>
    for (const application of applications.data || []) {
      if (`${application.company} ${application.role}`.toLowerCase().includes(search.toLowerCase()))
        result[application.stage].push(application)
    }
    return result
  }, [applications.data, search])
  const openTasks = (tasks.data || []).filter((task) => !task.completed_at)

  return (
    <div className="space-y-5">
      <Panel
        title="Add an application"
        description="The board records every stage change in an audit history."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-ink-700">
            Saved job snapshot
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={jobId}
              onChange={(event) => {
                const value = event.target.value
                setJobId(value)
                const job = (jobs.data || []).find((item) => item.id === Number(value))
                if (job) {
                  setCompany(job.company)
                  setRole(job.title)
                  setSourceUrl(job.source_url)
                }
              }}
            >
              <option value="">None</option>
              {(jobs.data || []).map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company || 'Unknown company'} · {job.title} · v{job.version}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700">
            Company
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Role
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Source URL
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Deadline
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Resume version
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={resumeDocumentId}
              onChange={(event) => setResumeDocumentId(event.target.value)}
            >
              <option value="">None</option>
              {(documents.data || [])
                .filter((item) => item.kind === 'resume')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · v{item.version}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700">
            Cover-letter version
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={coverLetterDocumentId}
              onChange={(event) => setCoverLetterDocumentId(event.target.value)}
            >
              <option value="">None</option>
              {(documents.data || [])
                .filter((item) => item.kind === 'cover_letter')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · v{item.version}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700 md:col-span-2">
            Notes
            <textarea
              className="mt-1 h-24 w-full rounded-lg border border-ink-300 p-3"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>
        <Button
          className="mt-3"
          disabled={!company.trim() || !role.trim()}
          busy={create.isPending}
          onClick={() => create.mutate()}
        >
          Add to pipeline
        </Button>
        <StatusMessage
          message={create.error?.message || update.error?.message || remove.error?.message || null}
          tone="error"
        />
      </Panel>
      <Panel
        title="Follow-up planner"
        description="Link reminders to the exact application so interviews, thank-you notes, and recruiter follow-ups do not disappear into a spreadsheet."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-ink-700">
            Application
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={taskApplicationId}
              onChange={(event) => setTaskApplicationId(event.target.value)}
            >
              <option value="">Select application</option>
              {(applications.data || []).map((application) => (
                <option key={application.id} value={application.id}>
                  {application.company} · {application.role}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700">
            Reminder type
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={taskType}
              onChange={(event) => setTaskType(event.target.value as FollowUpTask['task_type'])}
            >
              <option value="follow_up">Follow up</option>
              <option value="interview">Interview</option>
              <option value="deadline">Deadline</option>
              <option value="networking">Networking</option>
              <option value="thank_you">Thank you</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700">
            Reminder title
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Due date and time
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              type="datetime-local"
              value={taskDue}
              onChange={(event) => setTaskDue(event.target.value)}
            />
          </label>
        </div>
        <Button
          className="mt-3"
          disabled={!taskApplicationId || !taskTitle.trim() || !taskDue}
          busy={createTask.isPending}
          onClick={() => createTask.mutate()}
        >
          Add reminder
        </Button>
        <StatusMessage
          message={
            createTask.error?.message ||
            completeTask.error?.message ||
            removeTask.error?.message ||
            null
          }
          tone="error"
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {openTasks.map((task) => {
            const application = (applications.data || []).find(
              (item) => item.id === task.application_id,
            )
            const overdue = new Date(task.due_at).getTime() < renderedAt
            return (
              <article
                key={task.id}
                className={`rounded-lg border p-3 ${overdue ? 'border-rose-300 bg-rose-50' : 'border-ink-200 bg-ink-50'}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {task.task_type.replace('_', ' ')} ·{' '}
                  {application ? `${application.company} / ${application.role}` : 'Application'}
                </p>
                <h3 className="mt-1 font-semibold text-ink-950">{task.title}</h3>
                <p
                  className={`mt-1 text-sm ${overdue ? 'font-medium text-rose-700' : 'text-ink-600'}`}
                >
                  {overdue ? 'Overdue · ' : ''}
                  {new Date(task.due_at).toLocaleString()}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" onClick={() => completeTask.mutate(task)}>
                    Complete
                  </Button>
                  <Button variant="danger" onClick={() => removeTask.mutate(task.id)}>
                    Delete
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </Panel>
      {applicationPackage.data && (
        <Panel
          title={`Application package · ${applicationPackage.data.readiness_score.toFixed(0)}% ready`}
          description={`${applicationPackage.data.ready_count} of ${applicationPackage.data.total_count} readiness checks complete.`}
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {applicationPackage.data.checklist.map((item) => (
              <li
                key={item.key}
                className={`rounded-lg border p-3 ${item.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
              >
                <p className="font-semibold text-ink-950">
                  {item.ready ? 'Ready' : 'Needs attention'} · {item.label}
                </p>
                <p className="mt-1 text-sm text-ink-600">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <StatusMessage message={applicationPackage.error?.message || null} tone="error" />
      <label className="block max-w-xl text-sm font-medium text-ink-700">
        Filter pipeline
        <input
          className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 bg-white px-3 text-ink-950"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <p className="text-xs text-ink-500 xl:hidden">Scroll across to see every stage.</p>
      <div className="pipeline-grid" role="region" aria-label="Application pipeline" tabIndex={0}>
        {stages.map((stage) => (
          <section
            key={stage}
            className="min-h-64 rounded-lg bg-ink-100/60 p-4"
            aria-labelledby={`stage-${stage}`}
          >
            <h2
              id={`stage-${stage}`}
              className="mb-5 flex items-center justify-between text-sm font-medium capitalize text-ink-950"
            >
              {stage}
              <span className="version-label">
                {grouped[stage].length}
              </span>
            </h2>
            <div className="space-y-3">
              {grouped[stage].map((application) => (
                <article
                  key={application.id}
                  className="rounded-lg bg-white p-3 text-ink-900 "
                >
                  <h3 className="font-semibold">{application.role}</h3>
                  <p className="text-sm text-ink-600">{application.company}</p>
                  {application.deadline && (
                    <p className="mt-2 text-xs text-ink-500">
                      Deadline {new Date(application.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {application.notes && (
                    <p className="mt-2 line-clamp-3 text-xs text-ink-600">{application.notes}</p>
                  )}
                  {(application.resume_document_id || application.cover_letter_document_id) && (
                    <p className="mt-2 text-xs font-medium text-brand-700">
                      Documents:{' '}
                      {application.resume_document_id
                        ? `resume #${application.resume_document_id}`
                        : ''}{' '}
                      {application.cover_letter_document_id
                        ? `cover #${application.cover_letter_document_id}`
                        : ''}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    className="mt-2 min-h-9 w-full px-2 py-1 text-xs"
                    busy={applicationPackage.isFetching && packageApplicationId === application.id}
                    onClick={() => setPackageApplicationId(application.id)}
                  >
                    Review package
                  </Button>
                  <label className="mt-3 block text-xs font-medium text-ink-600">
                    Move stage
                    <select
                      className="mt-1 min-h-10 w-full rounded-lg border border-ink-300 px-2"
                      value={application.stage}
                      onChange={(event) =>
                        update.mutate({
                          id: application.id,
                          stage: event.target.value as ApplicationStage,
                        })
                      }
                    >
                      {stages.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  {application.stage === 'closed' && (
                    <label className="mt-3 block text-xs font-medium text-ink-600">
                      Outcome
                      <select
                        className="mt-1 min-h-10 w-full rounded-lg border border-ink-300 px-2"
                        value={application.outcome || ''}
                        onChange={(event) =>
                          update.mutate({
                            id: application.id,
                            outcome: event.target.value as Application['outcome'],
                          })
                        }
                      >
                        <option value="">Not recorded</option>
                        {['rejected', 'withdrawn', 'expired', 'accepted'].map((outcome) => (
                          <option key={outcome}>{outcome}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <Button
                    variant="danger"
                    className="mt-2 min-h-9 w-full px-2 py-1 text-xs"
                    onClick={() => remove.mutate(application.id)}
                  >
                    Delete
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
