import type { Analysis } from '../types'
import { Panel } from './Panel'

interface AnalysisPanelProps {
  analysis: Analysis
  confirmedFacts: string[]
  onToggleFact: (keyword: string) => void
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps): React.JSX.Element {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel
        title="Resume evidence coverage"
        description="An explainable keyword and structure baseline. This is not an employer ATS score or a prediction of interview success."
      >
        <p className="font-mono text-4xl font-medium text-brand-800">{analysis.score.toFixed(1)}</p>
        <p className="mt-3 text-sm leading-6 text-ink-600">{analysis.verdict}</p>
        <div className="mt-5 space-y-4">
          {analysis.dimensions.map((dimension) => (
            <article key={dimension.key} className="border-l-2 border-ink-200 pl-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium text-ink-900">{dimension.label}</h3>
                <span className="font-mono text-sm text-ink-600">
                  {dimension.score.toFixed(0)} / 100
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-600">{dimension.definition}</p>
              {dimension.evidence.length > 0 && (
                <p className="mt-2 text-xs text-ink-500">
                  Matched text: {dimension.evidence.join(', ')}
                </p>
              )}
            </article>
          ))}
        </div>
        <details className="mt-5 text-sm text-ink-600">
          <summary className="cursor-pointer font-medium">Method and limitations</summary>
          <p className="mt-2">
            {analysis.methodology.label} · {analysis.methodology_version}
          </p>
          {analysis.methodology.limitations.map((limitation) => (
            <p key={limitation} className="mt-2">
              {limitation}
            </p>
          ))}
          <p className="mt-2 break-all font-mono text-xs">
            Input fingerprint {analysis.input_fingerprint}
          </p>
        </details>
      </Panel>
      <Panel
        title="Requirements that need evidence"
        description="A missing term is not proof of a missing skill. Find a supporting example or leave the claim out."
      >
        <div className="space-y-4">
          {analysis.gap_plan.map((gap) => (
            <article key={gap.keyword} className="rounded-lg bg-ink-50 p-4">
              <h3 className="font-medium text-ink-900">{gap.keyword}</h3>
              <p className="mt-2 text-sm text-ink-600">{gap.suggestion}</p>
              <p className="mt-3 text-xs leading-5 text-ink-500">
                Job evidence: {gap.jd_evidence}
              </p>
              {gap.resume_evidence && (
                <p className="mt-2 text-xs text-ink-600">
                  Possible resume evidence: {gap.resume_evidence}
                </p>
              )}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
