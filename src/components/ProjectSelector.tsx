import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { Job, ProjectRecommendation } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { workspaceInputKey } from '../utils/workspace'

export function ProjectSelector({ job }: { job: Job }): React.JSX.Element {
  const [maxProjects, setMaxProjects] = useState(2)
  const [selected, setSelected] = useState<number[]>([])
  const [current, setCurrent] = useState<ProjectRecommendation | null>(null)
  const workspace = useWorkspace()
  const history = useQuery({
    queryKey: ['project-history', job.id],
    queryFn: () => api.projectHistory(job.id),
  })
  const recommendations = useMutation({
    mutationFn: () => api.recommendProjects(job.id, maxProjects),
    onSuccess: (value) => {
      setCurrent(value)
      setSelected(value.bullets.map((bullet) => bullet.citation.evidence_id))
      history.refetch()
    },
  })
  const draft = useMutation({
    mutationFn: ({ input, evidenceIds }: { input: typeof workspace.data; evidenceIds: number[] }) =>
      api.tailor({
        resume_text: input.resume_text,
        jd_text: job.description,
        confirmed_facts: [],
        evidence_ids: evidenceIds,
      }),
    onSuccess: (value, { input, evidenceIds }) => {
      workspace.setTailored(value, workspaceInputKey(input))
      workspace.updateData({ evidence_ids: evidenceIds }, workspaceInputKey(input))
      if (window.location.hash === `#/jobs/${job.id}/projects`)
        window.location.hash = `#/jobs/${job.id}/prepare`
    },
  })
  const latest = history.data?.[0]?.result
  const result = current || (latest && !latest.invalidated ? latest : null)
  const contextMatches =
    workspace.data.selected_job_id === job.id && workspace.jdText === job.description
  return (
    <div className="space-y-5">
      <Panel
        title="Choose the projects this role needs"
        description="We look for complementary evidence across your reviewed projects. Missing evidence stays visible."
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">
            Resume project slots
            <select
              className="mt-2 block rounded-lg border border-ink-300 p-3"
              value={maxProjects}
              onChange={(event) => setMaxProjects(Number(event.target.value))}
            >
              {[1, 2, 3].map((count) => (
                <option key={count}>{count}</option>
              ))}
            </select>
          </label>
          <Button busy={recommendations.isPending} onClick={() => recommendations.mutate()}>
            Find supporting experience
          </Button>
          <a className="px-3 py-3 text-sm font-medium text-brand-800 underline" href="#/evidence">
            Import or review project evidence
          </a>
        </div>
        <StatusMessage
          message={
            recommendations.error?.message || history.error?.message || draft.error?.message || null
          }
          tone="error"
        />
        {latest?.invalidated && (
          <StatusMessage
            message={latest.reason || 'Source evidence changed. Run project selection again.'}
          />
        )}
        {!contextMatches && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-ink-600">
              Your current target differs from this saved snapshot. Save it as a new target in
              Prepare application, or use this saved context.
            </p>
            <Button variant="secondary" onClick={() => workspace.setSelectedJob(job)}>
              Use saved job context
            </Button>
          </div>
        )}
      </Panel>
      {result && (
        <>
          <Panel title="Recommended project set">
            {result.projects.length ? (
              result.projects.map((project) => (
                <article key={project.source_id} className="py-3">
                  <h3 className="font-medium text-ink-900">{project.repository}</h3>
                  <p className="mt-1 text-sm text-ink-600">{project.reason}</p>
                </article>
              ))
            ) : (
              <p className="text-ink-600">
                No reviewed contributions support this role yet. Import projects and confirm your
                contribution, or target a role closer to your evidence.
              </p>
            )}
          </Panel>
          <Panel title="Requirement by requirement">
            <div className="space-y-5">
              {result.requirements.map((requirement) => (
                <article key={requirement.id} className="border-l-2 border-ink-200 pl-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-800">
                    {requirement.status === 'supported'
                      ? 'Supported by your reviewed statement'
                      : requirement.status === 'partial'
                        ? 'Observation only; contribution needs review'
                        : 'Missing evidence'}{' '}
                    · {requirement.priority}
                  </p>
                  <h3 className="mt-2 font-medium text-ink-900">{requirement.text}</h3>
                  {requirement.citations.map((citation) => (
                    <div key={citation.evidence_id} className="mt-3 text-sm text-ink-600">
                      <p>{citation.statement || citation.excerpt}</p>
                      <a
                        className="mt-1 inline-block text-brand-800 underline"
                        target="_blank"
                        rel="noreferrer"
                        href={citation.url}
                      >
                        {citation.repository} · {citation.path}:{citation.start_line}
                      </a>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </Panel>
          <Panel
            title="Review the proposed resume bullets"
            description="These reproduce your confirmed statements. Select the ones to include; inspect every source before approving the final document."
          >
            <div className="space-y-4">
              {result.bullets.map((bullet) => (
                <label
                  key={bullet.citation.evidence_id}
                  className="flex items-start gap-3 rounded-lg bg-ink-50 p-4 text-sm text-ink-800"
                >
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={selected.includes(bullet.citation.evidence_id)}
                    onChange={() =>
                      setSelected((values) =>
                        values.includes(bullet.citation.evidence_id)
                          ? values.filter((id) => id !== bullet.citation.evidence_id)
                          : [...values, bullet.citation.evidence_id],
                      )
                    }
                  />
                  <span>
                    {bullet.text}
                    <a
                      className="mt-2 block text-brand-800 underline"
                      href={bullet.citation.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Inspect source
                    </a>
                  </span>
                </label>
              ))}
            </div>
            <Button
              className="mt-4"
              disabled={!selected.length || workspace.resumeText.length < 30 || !contextMatches}
              busy={draft.isPending}
              onClick={() => draft.mutate({ input: workspace.data, evidenceIds: selected })}
            >
              Add selected bullets to a reviewable draft
            </Button>
            {workspace.resumeText.length < 30 && (
              <p className="mt-2 text-sm text-ink-600">
                Add your resume in Prepare application first.
              </p>
            )}
          </Panel>
          <details className="rounded-lg bg-white p-5 text-ink-700">
            <summary className="cursor-pointer font-medium">Method and limitations</summary>
            <p className="mt-3 text-sm">
              {result.method} · {result.embedding_version} · {result.latency_ms} ms
            </p>
            {result.warnings.map((warning) => (
              <p key={warning} className="mt-2 text-sm">
                {warning}
              </p>
            ))}
            {result.excluded_projects.map((project) => (
              <p key={project.source_id} className="mt-2 text-sm">
                {project.repository}: {project.reason}
              </p>
            ))}
          </details>
        </>
      )}
    </div>
  )
}
