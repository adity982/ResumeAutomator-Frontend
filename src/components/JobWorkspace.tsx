import { lazy, Suspense, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { useRoute } from '../hooks/useRoute'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { Workbench } from './Workbench'
import { ProjectSelector } from './ProjectSelector'
import { DocumentLibrary } from './DocumentLibrary'
import { JobApplicationPanel } from './JobApplicationPanel'

const OutreachStudio = lazy(() =>
  import('./OutreachStudio').then((m) => ({ default: m.OutreachStudio })),
)
const InterviewCoach = lazy(() =>
  import('./InterviewCoach').then((m) => ({ default: m.InterviewCoach })),
)

export function JobWorkspace({ id }: { id: number }): React.JSX.Element {
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id) })
  const { setSelectedJob } = useWorkspace()
  const route = useRoute()
  const section = route.split('/')[3] || 'prepare'
  useEffect(() => {
    if (job.data) setSelectedJob(job.data)
  }, [job.data, setSelectedJob])
  if (job.isLoading)
    return (
      <Panel title="Opening job workspace">
        <p role="status">Loading saved job…</p>
      </Panel>
    )
  if (!job.data || job.error)
    return (
      <Panel title="Job unavailable">
        <StatusMessage message={job.error?.message || 'This job was removed.'} tone="error" />
        <a href="#/jobs" className="text-cyan-800 underline">
          Back to jobs
        </a>
      </Panel>
    )
  const tabs = [
    ['prepare', 'Prepare application'],
    ['projects', 'Choose projects'],
    ['documents', 'Documents'],
    ['tracking', 'Track application'],
    ['outreach', 'Contacts and outreach'],
    ['interview', 'Interview practice'],
  ]
  return (
    <div className="space-y-5">
      <div>
        <a className="text-sm text-cyan-300 underline" href="#/jobs">
          All jobs
        </a>
        <h2 className="mt-3 text-3xl font-bold text-white">{job.data.title}</h2>
        <p className="mt-1 text-slate-400">
          {job.data.company || 'Company not specified'} · Snapshot {job.data.version}
        </p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Job workspace">
        {tabs.map(([value, label]) => (
          <a
            key={value}
            className={`shrink-0 rounded-lg px-4 py-3 text-sm font-bold ${section === value ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
            aria-current={section === value ? 'page' : undefined}
            href={`#/jobs/${id}/${value}`}
          >
            {label}
          </a>
        ))}
      </nav>
      <Suspense fallback={<Panel title="Loading tools…" />}>
        {section === 'prepare' && <Workbench />}
        {section === 'projects' && <ProjectSelector job={job.data} />}
        {section === 'documents' && <DocumentLibrary jobId={id} />}
        {section === 'tracking' && <JobApplicationPanel job={job.data} />}
        {section === 'outreach' && <OutreachStudio key={id} />}
        {section === 'interview' && <InterviewCoach key={id} />}
        {!tabs.some(([value]) => value === section) && (
          <Panel title="This page does not exist">
            <a href={`#/jobs/${id}/prepare`} className="text-cyan-800 underline">
              Prepare this application
            </a>
          </Panel>
        )}
      </Suspense>
    </div>
  )
}
