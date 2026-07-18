import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import type { Application, ApplicationStage } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

const stages: ApplicationStage[] = ['saved', 'applied', 'interview', 'offer', 'closed']

export function ApplicationBoard(): React.JSX.Element {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [resumeDocumentId, setResumeDocumentId] = useState('')
  const [coverLetterDocumentId, setCoverLetterDocumentId] = useState('')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const applications = useQuery({ queryKey: ['applications'], queryFn: api.listApplications })
  const documents = useQuery({ queryKey: ['documents'], queryFn: api.listDocuments })
  const create = useMutation({
    mutationFn: () => api.createApplication({ company, role, source_url: sourceUrl, deadline: deadline ? new Date(deadline).toISOString() : null, notes, resume_document_id: resumeDocumentId ? Number(resumeDocumentId) : undefined, cover_letter_document_id: coverLetterDocumentId ? Number(coverLetterDocumentId) : undefined }),
    onSuccess: () => {
      setCompany(''); setRole(''); setSourceUrl(''); setDeadline(''); setNotes(''); setResumeDocumentId(''); setCoverLetterDocumentId('')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
  const update = useMutation({ mutationFn: ({ id, stage }: Pick<Application, 'id' | 'stage'>) => api.updateApplication(id, { stage }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) })
  const remove = useMutation({ mutationFn: api.deleteApplication, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) })
  const grouped = useMemo(() => {
    const result = Object.fromEntries(stages.map((stage) => [stage, [] as Application[]])) as Record<ApplicationStage, Application[]>
    for (const application of applications.data || []) {
      if (`${application.company} ${application.role}`.toLowerCase().includes(search.toLowerCase())) result[application.stage].push(application)
    }
    return result
  }, [applications.data, search])

  return (
    <div className="space-y-5">
      <Panel title="Add an application" description="The board records every stage change in an audit history.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold text-slate-700">Company<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={company} onChange={(event) => setCompany(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Role<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={role} onChange={(event) => setRole(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Source URL<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Deadline<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Resume version<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={resumeDocumentId} onChange={(event) => setResumeDocumentId(event.target.value)}><option value="">None</option>{(documents.data || []).filter((item) => item.kind === 'resume').map((item) => <option key={item.id} value={item.id}>{item.title} · v{item.version}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700">Cover-letter version<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={coverLetterDocumentId} onChange={(event) => setCoverLetterDocumentId(event.target.value)}><option value="">None</option>{(documents.data || []).filter((item) => item.kind === 'cover_letter').map((item) => <option key={item.id} value={item.id}>{item.title} · v{item.version}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">Notes<textarea className="mt-1 h-24 w-full rounded-xl border border-slate-300 p-3" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        </div>
        <Button className="mt-3" disabled={!company.trim() || !role.trim()} busy={create.isPending} onClick={() => create.mutate()}>Add to pipeline</Button>
        <StatusMessage message={create.error?.message || update.error?.message || remove.error?.message || null} tone="error" />
      </Panel>
      <label className="block max-w-xl text-sm font-bold text-slate-200">Filter pipeline<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 text-white" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="grid gap-4 xl:grid-cols-5">
        {stages.map((stage) => (
          <section key={stage} className="min-h-64 rounded-2xl border border-slate-700 bg-slate-900/70 p-4" aria-labelledby={`stage-${stage}`}>
            <h2 id={`stage-${stage}`} className="mb-3 flex items-center justify-between font-black capitalize text-white">{stage}<span className="rounded-full bg-slate-700 px-2 py-1 text-xs">{grouped[stage].length}</span></h2>
            <div className="space-y-3">
              {grouped[stage].map((application) => (
                <article key={application.id} className="rounded-xl bg-white p-3 text-slate-900 shadow-sm">
                  <h3 className="font-black">{application.role}</h3><p className="text-sm text-slate-600">{application.company}</p>
                  {application.deadline && <p className="mt-2 text-xs text-slate-500">Deadline {new Date(application.deadline).toLocaleDateString()}</p>}
                  {application.notes && <p className="mt-2 line-clamp-3 text-xs text-slate-600">{application.notes}</p>}
                  {(application.resume_document_id || application.cover_letter_document_id) && <p className="mt-2 text-xs font-bold text-cyan-700">Documents: {application.resume_document_id ? `resume #${application.resume_document_id}` : ''} {application.cover_letter_document_id ? `cover #${application.cover_letter_document_id}` : ''}</p>}
                  <label className="mt-3 block text-xs font-bold text-slate-600">Move stage<select className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2" value={application.stage} onChange={(event) => update.mutate({ id: application.id, stage: event.target.value as ApplicationStage })}>{stages.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <Button variant="danger" className="mt-2 min-h-9 w-full px-2 py-1 text-xs" onClick={() => remove.mutate(application.id)}>Delete</Button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
