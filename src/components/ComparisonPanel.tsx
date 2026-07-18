import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

interface TargetDraft {
  id: string
  label: string
  url: string
  jd_text: string
}

export function ComparisonPanel(): React.JSX.Element {
  const { resumeText, jdText } = useWorkspace()
  const [targets, setTargets] = useState<TargetDraft[]>([
    { id: crypto.randomUUID(), label: 'Current target', url: '', jd_text: jdText },
    { id: crypto.randomUUID(), label: 'Alternative role', url: '', jd_text: '' },
  ])
  const [sortDescending, setSortDescending] = useState(true)
  const comparison = useMutation({
    mutationFn: () => api.compare(resumeText, targets.map(({ label, jd_text }) => ({ label, jd_text }))),
  })
  const fetchTarget = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => ({ id, result: await api.scrapeJob(url) }),
    onSuccess: ({ id, result }) => setTargets((current) => current.map((target) => target.id === id ? { ...target, label: target.label || result.title, url: result.source_url, jd_text: result.description } : target)),
  })
  const rows = useMemo(() => [...(comparison.data || [])].sort((left, right) => (right.analysis.score - left.analysis.score) * (sortDescending ? 1 : -1)), [comparison.data, sortDescending])
  const valid = resumeText.length >= 30 && targets.length > 0 && targets.every((target) => target.label.trim() && target.jd_text.trim().length >= 30)

  const updateTarget = (id: string, field: 'label' | 'url' | 'jd_text', value: string): void => {
    setTargets((current) => current.map((target) => target.id === id ? { ...target, [field]: value } : target))
  }

  return (
    <Panel title="Multi-job comparison" description="Compare up to five roles using the same verified scoring contract.">
      <div className="space-y-4">
        {targets.map((target, index) => (
          <fieldset key={target.id} className="rounded-xl border border-slate-200 p-4">
            <legend className="px-2 text-sm font-black text-slate-700">Target {index + 1}</legend>
            <div className="grid gap-3 lg:grid-cols-[14rem_1fr_auto]">
              <label className="text-sm font-bold text-slate-700">Label<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={target.label} onChange={(event) => updateTarget(target.id, 'label', event.target.value)} /></label>
              <label className="text-sm font-bold text-slate-700">Optional public URL<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="url" value={target.url} onChange={(event) => updateTarget(target.id, 'url', event.target.value)} /></label>
              <Button variant="secondary" className="self-end" disabled={!target.url} busy={fetchTarget.isPending} onClick={() => fetchTarget.mutate({ id: target.id, url: target.url })}>Fetch URL</Button>
              <span className="hidden lg:block" />
              <label className="text-sm font-bold text-slate-700">Job description<textarea className="mt-1 h-28 w-full rounded-xl border border-slate-300 p-3 font-normal" value={target.jd_text} onChange={(event) => updateTarget(target.id, 'jd_text', event.target.value)} /></label>
              <Button variant="danger" className="self-end" disabled={targets.length === 1} onClick={() => setTargets((current) => current.filter((item) => item.id !== target.id))}>Remove</Button>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={targets.length >= 5} onClick={() => setTargets((current) => [...current, { id: crypto.randomUUID(), label: `Target ${current.length + 1}`, url: '', jd_text: '' }])}>Add target</Button>
        <Button disabled={!valid} busy={comparison.isPending} onClick={() => comparison.mutate()}>Rank roles</Button>
      </div>
      <StatusMessage message={comparison.error?.message || fetchTarget.error?.message || null} tone="error" />
      {rows.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <caption className="sr-only">Ranked job comparison</caption>
            <thead><tr className="border-b border-slate-300"><th className="p-3">Role</th><th className="p-3"><button className="font-bold underline" onClick={() => setSortDescending((value) => !value)}>Score {sortDescending ? '↓' : '↑'}</button></th><th className="p-3">Skills</th><th className="p-3">Keywords</th><th className="p-3">Highest gaps</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.label} className="border-b border-slate-100"><th className="p-3 font-bold">{row.label}</th><td className="p-3 font-mono text-lg font-black text-cyan-700">{row.analysis.score.toFixed(1)}</td><td className="p-3">{row.analysis.dimensions.find((item) => item.key === 'skills')?.score.toFixed(1) ?? '—'}</td><td className="p-3">{row.analysis.dimensions.find((item) => item.key === 'keywords')?.score.toFixed(1) ?? '—'}</td><td className="p-3">{row.analysis.gap_plan.slice(0, 3).map((item) => item.keyword).join(', ') || 'None'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
