import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { SavedSearch } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

const splitList = (value: string): string[] => value.split(',').map((item) => item.trim()).filter(Boolean)

export function DiscoveryPanel(): React.JSX.Element {
  const { resumeText } = useWorkspace()
  const [name, setName] = useState('My job search')
  const [titles, setTitles] = useState('')
  const [excluded, setExcluded] = useState('')
  const [skills, setSkills] = useState('')
  const [locations, setLocations] = useState('')
  const [workMode, setWorkMode] = useState('remote')
  const [seniority, setSeniority] = useState('any')
  const [minimumSalary, setMinimumSalary] = useState('')
  const [active, setActive] = useState<SavedSearch | null>(null)
  const queryClient = useQueryClient()
  const searches = useQuery({ queryKey: ['searches'], queryFn: api.listSearches })
  const create = useMutation({
    mutationFn: () => api.createSearch({ name, resume_text: resumeText, preferences: { desired_titles: splitList(titles), excluded_titles: splitList(excluded), skills: splitList(skills), locations: splitList(locations), work_modes: [workMode], seniority, minimum_salary: minimumSalary ? Number(minimumSalary) : null } }),
    onSuccess: (search) => { setActive(search); queryClient.invalidateQueries({ queryKey: ['searches'] }) },
  })

  return (
    <div className="space-y-5">
      <Panel title="Personalized job discovery" description="Preferences shape explainable recommendations and provider deep links; this feature does not scrape job boards.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold text-slate-700">Search name<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Desired titles, comma separated<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={titles} onChange={(event) => setTitles(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Excluded titles<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={excluded} onChange={(event) => setExcluded(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Priority skills<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={skills} onChange={(event) => setSkills(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Locations<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={locations} onChange={(event) => setLocations(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Work mode<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={workMode} onChange={(event) => setWorkMode(event.target.value)}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></label>
          <label className="text-sm font-bold text-slate-700">Seniority<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={seniority} onChange={(event) => setSeniority(event.target.value)}><option value="any">Any</option><option value="entry">Entry</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option></select></label>
          <label className="text-sm font-bold text-slate-700">Minimum salary<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="number" min="0" value={minimumSalary} onChange={(event) => setMinimumSalary(event.target.value)} /></label>
        </div>
        <Button className="mt-3" disabled={resumeText.length < 30 || !name.trim()} busy={create.isPending} onClick={() => create.mutate()}>Save and rank search</Button>
        <StatusMessage message={resumeText.length < 30 ? 'Add resume evidence in the Workbench first.' : create.error?.message || null} tone={create.error ? 'error' : 'info'} />
      </Panel>
      {active && <Panel title={active.name} description={`${active.results.length} ranked recommendations`}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{active.results.map((result) => <article key={result.title} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-black text-slate-950">{result.title}</h3><span className="font-mono font-black text-cyan-700">{result.fit_score}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{result.reason}</p><div className="mt-3 flex flex-wrap gap-2">{Object.entries(result.links).map(([provider, link]) => <a key={provider} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" href={link} target="_blank" rel="noreferrer">{provider}</a>)}</div></article>)}</div></Panel>}
      <Panel title="Saved searches"><div className="flex flex-wrap gap-2">{(searches.data || []).map((search) => <button key={search.id} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-bold" onClick={() => setActive(search)}>{search.name}</button>)}</div></Panel>
    </div>
  )
}
