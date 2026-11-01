import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { CareerEvidence } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

type Candidate = Omit<CareerEvidence, 'id' | 'created_at' | 'updated_at'>

export function ProfileEvidence(): React.JSX.Element {
  const [platform, setPlatform] = useState('linkedin')
  const [handle, setHandle] = useState('')
  const [csv, setCsv] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const client = useQueryClient()
  const preview = useMutation({ mutationFn: api.previewProfile })
  const pdf = useMutation({ mutationFn: api.previewLinkedInPdf })
  const candidates = pdf.data || preview.data
  const save = useMutation({
    mutationFn: async (item: Candidate) => {
      const existing = await api.listEvidence()
      if (!existing.some(e => e.source === item.source && e.statement === item.statement)) {
        await api.createEvidence({ ...item, verified: false })
      }
      return item.statement
    },
    onSuccess: (statement) => {
      setSaved(items => [...items, statement])
      client.invalidateQueries({ queryKey: ['evidence'] })
    },
  })
  const reset = (): void => { preview.reset(); pdf.reset(); setSaved([]) }
  return <Panel title="Bring your profiles together" description="Build a reusable record of experience, credentials and coding achievements. Each imported fact starts as a draft; review it in your evidence vault before tailoring.">
    <label className="block text-sm font-medium">Profile source
      <select className="mt-2 min-h-11 w-full rounded-lg border border-ink-300 px-3" value={platform} onChange={e => { setPlatform(e.target.value); reset() }}>
        <option value="linkedin">LinkedIn — import your data export</option>
        <option value="codeforces">Codeforces — public rating snapshot</option>
        <option value="leetcode">LeetCode — link and manual evidence</option>
        <option value="codechef">CodeChef — link and manual evidence</option>
        <option value="atcoder">AtCoder — link and manual evidence</option>
      </select>
    </label>
    {platform === 'linkedin' ? <>
      <p className="my-3 text-sm text-ink-600">LinkedIn sign-in does not supply your complete work or certification history. Request your own data archive in LinkedIn Settings → Data privacy → Get a copy of your data. Open Positions.csv or Certifications.csv and paste its contents below. Import both files separately to keep them together in your vault. No LinkedIn password or browser cookies are needed.</p>
      <label className="my-3 block text-sm font-medium">Or preview your LinkedIn profile PDF
        <input type="file" accept="application/pdf,.pdf" className="my-2 block w-full text-sm" disabled={pdf.isPending} onChange={event => { const file = event.target.files?.[0]; if (file) { reset(); pdf.mutate(file) } event.target.value = '' }} />
      </label>
      {pdf.isPending && <p role="status">Reading profile PDF…</p>}
      <label className="block text-sm font-medium">LinkedIn CSV contents<textarea className="mt-2 h-36 w-full rounded-lg border border-ink-300 p-3" value={csv} maxLength={100000} onChange={e => { setCsv(e.target.value); reset() }} /></label>
    </> : <label className="my-3 block text-sm font-medium">Profile handle<input className="mt-2 min-h-11 w-full rounded-lg border border-ink-300 px-3" value={handle} maxLength={64} onChange={e => { setHandle(e.target.value); reset() }} /></label>}
    <Button variant="secondary" disabled={platform === 'linkedin' ? !csv.trim() : !handle.trim()} busy={preview.isPending} onClick={() => preview.mutate({ platform, handle, csv_text: csv })}>Preview profile evidence</Button>
    <StatusMessage message={pdf.error?.message || preview.error?.message || save.error?.message || null} tone="error" />
    {candidates && (pdf.data || (preview.variables?.platform === platform && preview.variables?.handle === handle && preview.variables?.csv_text === csv)) && <div className="mt-4 space-y-4">
      <p className="text-sm text-ink-600">{candidates.notice}</p>
      {preview.data?.profile_url && <a className="underline" href={preview.data.profile_url} target="_blank" rel="noreferrer">Open profile — copy this link into Source or proof below</a>}
      {candidates.items.map((item, i) => <div key={i} className="border-t border-ink-200 pt-3">
        <h3 className="font-semibold">{item.title}</h3><p className="my-2 whitespace-pre-wrap text-sm">{item.statement}</p>
        <Button variant="secondary" busy={save.isPending} disabled={saved.includes(item.statement)} onClick={() => save.mutate(item)}>{saved.includes(item.statement) ? 'Saved as draft' : 'Save to evidence for review'}</Button>
      </div>)}
    </div>}
  </Panel>
}
