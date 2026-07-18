import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { api, downloadBlob } from '../api/client'
import type { AnalyticsSummary } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

function exportCsv(summary: AnalyticsSummary): void {
  const rows = [['metric', 'label', 'value'], ...Object.entries(summary.applications_by_stage).map(([stage, count]) => ['applications', stage, String(count)]), ...summary.score_trend.map((item) => ['score', item.date, String(item.score)]), ...summary.recurring_gaps.map((item) => ['gap', item.keyword, String(item.count)])]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'resume-automator-analytics.csv')
}

export function AnalyticsDashboard(): React.JSX.Element {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const filters = { date_from: dateFrom, date_to: dateTo, company, role }
  const summary = useQuery({ queryKey: ['analytics', filters], queryFn: () => api.analytics(filters) })
  if (summary.isLoading) return <Panel title="Career analytics"><p role="status">Loading analytics…</p></Panel>
  if (summary.error || !summary.data) return <StatusMessage message={summary.error?.message || 'Analytics are unavailable.'} tone="error" />
  const data = summary.data
  const stageData = Object.entries(data.applications_by_stage).map(([stage, count]) => ({ stage, count }))
  return (
    <div className="space-y-5">
      <Panel title="Analytics filters" description="Metrics and sample sizes update to the selected reporting window.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold text-slate-700">From<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">To<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Company<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={company} onChange={(event) => setCompany(event.target.value)} /></label>
          <label className="text-sm font-bold text-slate-700">Role<input className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" value={role} onChange={(event) => setRole(event.target.value)} /></label>
        </div>
      </Panel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Average match"><p className="font-mono text-4xl font-black text-cyan-700">{data.average_match_score?.toFixed(1) ?? '—'}</p><p className="mt-1 text-xs text-slate-500">Across {data.sample_size} verified analyses</p></Panel>
        <Panel title="Interview conversion"><p className="font-mono text-4xl font-black text-cyan-700">{data.interview_conversion_rate !== null ? `${data.interview_conversion_rate.toFixed(1)}%` : '—'}</p><p className="mt-1 text-xs text-slate-500">Applied applications reaching interview or later</p></Panel>
        <Panel title="Applications"><p className="font-mono text-4xl font-black text-cyan-700">{Object.values(data.applications_by_stage).reduce((total, value) => total + value, 0)}</p><p className="mt-1 text-xs text-slate-500">Across all pipeline stages</p></Panel>
        <Panel title="Data controls"><Button variant="secondary" onClick={() => exportCsv(data)}>Export CSV</Button><p className="mt-2 text-xs text-slate-500">Exports the underlying defined metrics.</p></Panel>
      </div>
      {data.sample_size < 3 && <StatusMessage message="There is not enough history for a reliable trend yet. Add at least three analyses." />}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Application stages"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={stageData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="stage" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#0891b2" /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Match-score history"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.score_trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#0891b2" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel>
        <Panel title="Recurring gaps" className="xl:col-span-2"><div className="flex flex-wrap gap-2">{data.recurring_gaps.map((gap) => <span key={gap.keyword} className="rounded-full bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{gap.keyword} · {gap.count}</span>)}</div></Panel>
      </div>
    </div>
  )
}
