import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { OutreachKit } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function OutreachStudio(): React.JSX.Element {
  const { resumeText, jdText, selectedJob } = useWorkspace()
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState('Recruiter')
  const [company, setCompany] = useState(selectedJob?.company || '')
  const [tone, setTone] = useState('professional')
  const [callToAction, setCallToAction] = useState('a brief 10-minute conversation')
  const [active, setActive] = useState<OutreachKit | null>(null)
  const [copied, setCopied] = useState('')
  const queryClient = useQueryClient()
  const history = useQuery({ queryKey: ['outreach'], queryFn: api.listOutreach })
  const create = useMutation({
    mutationFn: () => api.createOutreach({ resume_text: resumeText, jd_text: jdText, recipient_name: recipientName, recipient_role: recipientRole, company, tone, call_to_action: callToAction }),
    onSuccess: (kit) => { setActive(kit); queryClient.invalidateQueries({ queryKey: ['outreach'] }) },
  })
  const copy = async (label: string, value: string): Promise<void> => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
  }
  const ready = resumeText.length >= 30 && jdText.length >= 30

  return (
    <div className="space-y-5">
      <Panel title="Networking outreach kit" description="Generate editable variants for each channel. Nothing is sent automatically.">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm font-bold text-slate-700">Recipient name<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Recipient role<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={recipientRole} onChange={(event) => setRecipientRole(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Company<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={company} onChange={(event) => setCompany(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Tone<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={tone} onChange={(event) => setTone(event.target.value)}><option value="professional">Professional</option><option value="warm">Warm</option><option value="concise">Concise</option></select></label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">Call to action<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={callToAction} onChange={(event) => setCallToAction(event.target.value)} /></label>
        </div>
        <Button className="mt-3" disabled={!ready} busy={create.isPending} onClick={() => create.mutate()}>Create kit</Button>
        {!ready && <StatusMessage message="Add resume and job-description evidence in the Workbench first." />}
        <StatusMessage message={create.error?.message || (copied ? `${copied} copied to clipboard.` : null)} tone={create.error ? 'error' : 'success'} />
      </Panel>
      {active && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries({ 'Recruiter email': active.variants.recruiter_email, 'Hiring manager note': active.variants.hiring_manager_note, 'Referral request': active.variants.referral_request, 'LinkedIn message': active.variants.linkedin_message }).map(([label, value]) => (
            <Panel key={label} title={label} action={<Button variant="secondary" onClick={() => void copy(label, value)}>Copy</Button>}><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p></Panel>
          ))}
          <Panel title="Follow-up sequence" className="lg:col-span-2"><ol className="space-y-3">{active.variants.follow_ups.map((value, index) => <li key={value} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>Follow-up {index + 1}:</strong> {value} <button className="ml-2 font-bold text-cyan-700 underline" onClick={() => void copy(`Follow-up ${index + 1}`, value)}>Copy</button></li>)}</ol></Panel>
        </div>
      )}
      <Panel title="Saved kits"><div className="flex flex-wrap gap-2">{(history.data || []).map((kit) => <button key={kit.id} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50" onClick={() => setActive(kit)}>{kit.company || 'Untitled'} · {kit.recipient_role}</button>)}</div></Panel>
    </div>
  )
}
