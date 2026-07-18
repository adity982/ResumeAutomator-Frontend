import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'

import type { Analysis } from '../types'
import { Panel } from './Panel'

interface AnalysisPanelProps {
  analysis: Analysis
  confirmedFacts: string[]
  onToggleFact: (keyword: string) => void
}

export function AnalysisPanel({ analysis, confirmedFacts, onToggleFact }: AnalysisPanelProps): React.JSX.Element {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title="Verified ATS dimensions" description={`Methodology ${analysis.methodology_version}. Every value comes from the analysis response.`}>
        <div className="h-80" aria-label="ATS scoring dimensions chart">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={analysis.dimensions} outerRadius="70%">
              <PolarGrid stroke="#cbd5e1" />
              <PolarAngleAxis dataKey="label" tick={{ fill: '#334155', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar dataKey="score" stroke="#0891b2" fill="#22d3ee" fillOpacity={0.3} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} / 100`, 'Measured score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.dimensions.map((dimension) => (
            <article key={dimension.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold text-slate-900">{dimension.label}</h3>
                <span className="font-mono text-lg font-black text-cyan-700">{dimension.score.toFixed(1)}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{dimension.definition}</p>
              <p className="mt-2 text-xs text-slate-500">Confidence {Math.round(dimension.confidence * 100)}%</p>
              {dimension.evidence.length > 0 && <p className="mt-1 text-xs text-slate-700">Evidence: {dimension.evidence.join(', ')}</p>}
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Evidence-backed gap plan" description="Confirm only facts you can support. Unconfirmed terms are never inserted into the tailored resume.">
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-slate-950 p-4 text-white">
          <span className="font-mono text-4xl font-black text-cyan-300">{analysis.score.toFixed(1)}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Overall evidence match</p>
            <p className="mt-1 text-sm text-slate-200">{analysis.verdict}</p>
          </div>
        </div>
        <ul className="space-y-3">
          {analysis.gap_plan.map((gap) => {
            const checked = confirmedFacts.includes(gap.keyword)
            return (
              <li key={gap.keyword} className="rounded-xl border border-slate-200 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input className="mt-1 size-4 accent-cyan-600" type="checkbox" checked={checked} onChange={() => onToggleFact(gap.keyword)} />
                  <span>
                    <span className="font-bold text-slate-950">{gap.keyword}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-600">{gap.importance}</span>
                    <span className="mt-1 block text-sm text-slate-600">{gap.suggestion}</span>
                    <span className="mt-2 block border-l-2 border-cyan-300 pl-3 text-xs leading-5 text-slate-500">Job evidence: {gap.jd_evidence}</span>
                    {gap.resume_evidence && <span className="mt-1 block pl-3 text-xs leading-5 text-emerald-700">Resume evidence: {gap.resume_evidence}</span>}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
