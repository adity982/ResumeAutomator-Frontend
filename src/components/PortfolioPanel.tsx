import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { PortfolioSource, ProjectEvidence } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { GitHubConnection } from './GitHubConnection'

function EvidenceReview({
  evidence,
  onSaved,
}: {
  evidence: ProjectEvidence
  onSaved: () => void
}): React.JSX.Element {
  const [statement, setStatement] = useState(evidence.approved_statement)
  const review = useMutation({
    mutationFn: (status: string) => api.reviewEvidence(evidence.id, status, statement),
    onSuccess: onSaved,
  })
  return (
    <article className="rounded-lg border border-ink-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          className="font-medium text-brand-800 underline"
          href={evidence.source_url}
          target="_blank"
          rel="noreferrer"
        >
          {evidence.path}:{evidence.start_line}-{evidence.end_line}
        </a>
        <span className="text-sm text-ink-600">
          {evidence.review_status === 'approved'
            ? 'Contribution confirmed by you'
            : evidence.review_status}
        </span>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium">Read source excerpt</summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-ink-100 p-3 text-xs">
          {evidence.content}
        </pre>
      </details>
      <label className="mt-4 block text-sm font-medium text-ink-700">
        What did you personally do?
        <textarea
          className="mt-2 h-24 w-full rounded-lg border border-ink-300 p-3 font-normal"
          maxLength={1000}
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
          placeholder="Describe your contribution, using only claims supported by this excerpt."
        />
      </label>
      <p className="mt-2 text-xs text-ink-500">
        Confirmation is your attestation. Repository code alone does not establish authorship or
        measured results.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={statement.trim().length < 20}
          busy={review.isPending}
          onClick={() => review.mutate('approved')}
        >
          Confirm contribution
        </Button>
        <Button variant="secondary" onClick={() => review.mutate('observed')}>
          Keep as observation
        </Button>
        <Button variant="ghost" onClick={() => review.mutate('rejected')}>
          Exclude
        </Button>
      </div>
      <StatusMessage message={review.error?.message || null} tone="error" />
    </article>
  )
}

function SourceDetail({ source }: { source: PortfolioSource }): React.JSX.Element {
  const client = useQueryClient()
  const [paths, setPaths] = useState(source.files.map((file) => file.path))
  const [relationship, setRelationship] = useState(
    source.relationship === 'unconfirmed'
      ? source.is_fork
        ? 'fork'
        : 'personal'
      : source.relationship,
  )
  const [contribution, setContribution] = useState(source.contribution)
  const [page, setPage] = useState(0)
  const evidence = useQuery({
    queryKey: ['project-evidence', source.id],
    queryFn: () => api.projectEvidence(source.id),
    enabled: source.status === 'ready',
  })
  const ingest = useMutation({
    mutationFn: () => api.importSource(source.id, paths, relationship, contribution),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sources'] })
      client.invalidateQueries({ queryKey: ['imports'] })
    },
  })
  return (
    <Panel
      title={source.repository}
      description={`Snapshot ${source.commit_sha.slice(0, 10)} · ${source.is_private ? 'Private repository' : source.is_fork ? 'Fork' : 'Public repository'} · ${source.status}`}
    >
      {source.status !== 'ready' ? (
        <>
          <p className="text-sm text-ink-600">
            Select files to import. Secrets, generated files and oversized files are excluded.
            Review the excerpts before proceeding.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {source.files.map((file) => (
              <details key={file.path} className="rounded-lg border border-ink-200 p-3">
                <summary>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paths.includes(file.path)}
                      onChange={() =>
                        setPaths((current) =>
                          current.includes(file.path)
                            ? current.filter((path) => path !== file.path)
                            : [...current, file.path],
                        )
                      }
                    />
                    {file.path}
                  </label>
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-ink-600">
                  {file.excerpt}
                </pre>
              </details>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[14rem_1fr]">
            <label className="text-sm font-medium">
              Project relationship
              <select
                className="mt-2 w-full rounded-lg border border-ink-300 p-3"
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
              >
                <option value="personal">Personal project</option>
                <option value="team">Team project</option>
                <option value="fork">Fork</option>
                <option value="contribution">Upstream contribution</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Your role and contribution
              <textarea
                className="mt-2 h-24 w-full rounded-lg border border-ink-300 p-3 font-normal"
                value={contribution}
                onChange={(event) => setContribution(event.target.value)}
                maxLength={2000}
                placeholder="Explain what you built or contributed, and which parts belong to others."
              />
            </label>
          </div>
          <Button
            className="mt-4"
            disabled={
              !paths.length ||
              contribution.trim().length < 20 ||
              ['queued', 'processing'].includes(source.status)
            }
            busy={ingest.isPending}
            onClick={() => ingest.mutate()}
          >
            {source.status === 'failed' ? 'Retry import' : 'Import selected files'}
          </Button>
          <StatusMessage
            message={
              ingest.error?.message ||
              (['queued', 'processing'].includes(source.status)
                ? 'Import queued. You can leave this page; progress is saved.'
                : null)
            }
            tone={ingest.error ? 'error' : 'info'}
          />
        </>
      ) : (
        <>
          <p className="text-sm text-ink-600">{source.contribution}</p>
          <p className="mt-2 text-sm text-ink-600">
            Review excerpts and write the contribution statements you want to reuse. Observations
            remain separate from personal claims.
          </p>
          <StatusMessage message={evidence.error?.message || null} tone="error" />
          {evidence.isLoading && <p role="status">Loading source evidence…</p>}
          <div className="mt-4 space-y-4">
            {(evidence.data || []).slice(page * 8, page * 8 + 8).map((item) => (
              <EvidenceReview
                key={`${item.id}-${item.review_status}`}
                evidence={item}
                onSaved={() => {
                  client.invalidateQueries({ queryKey: ['project-evidence', source.id] })
                  client.invalidateQueries({ queryKey: ['project-history'] })
                }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous excerpts
            </Button>
            <span className="text-sm">Page {page + 1}</span>
            <Button
              variant="secondary"
              disabled={(page + 1) * 8 >= (evidence.data?.length || 0)}
              onClick={() => setPage(page + 1)}
            >
              Next excerpts
            </Button>
          </div>
        </>
      )}
    </Panel>
  )
}

export function PortfolioPanel(): React.JSX.Element {
  const [url, setUrl] = useState('')
  const [useConnection, setUseConnection] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const client = useQueryClient()
  const sources = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources,
    refetchInterval: (query) =>
      query.state.data?.some((source) => ['queued', 'processing'].includes(source.status))
        ? 3000
        : false,
  })
  const imports = useQuery({
    queryKey: ['imports'],
    queryFn: api.imports,
    refetchInterval: (query) =>
      query.state.data?.some((item) => ['queued', 'running'].includes(item.status)) ? 3000 : false,
  })
  const preview = useMutation({
    mutationFn: () => api.previewSource(url, useConnection),
    onSuccess: (source) => {
      setSelected(source.id)
      client.invalidateQueries({ queryKey: ['sources'] })
    },
  })
  const remove = useMutation({
    mutationFn: api.deleteSource,
    onSuccess: () => {
      setSelected(null)
      client.invalidateQueries({ queryKey: ['sources'] })
      client.invalidateQueries({ queryKey: ['project-history'] })
    },
  })
  const cancel = useMutation({
    mutationFn: api.cancelImport,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['imports'] })
      client.invalidateQueries({ queryKey: ['sources'] })
    },
  })
  const active = sources.data?.find((source) => source.id === selected)
  return (
    <div className="space-y-5">
      <GitHubConnection />
      <Panel
        title="Bring your work into the conversation"
        description="Import selected GitHub projects, inspect the evidence, and confirm your contribution before using it in a resume."
      >
        <label className="block text-sm font-medium text-ink-700">
          GitHub repository URL
          <input
            className="mt-2 w-full rounded-lg border border-ink-300 p-3"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/your-name/your-project"
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={useConnection}
            onChange={(event) => setUseConnection(event.target.checked)}
          />
          Use my connected GitHub account, including selected private repositories
        </label>
        <Button
          className="mt-3"
          disabled={!url}
          busy={preview.isPending}
          onClick={() => preview.mutate()}
        >
          Preview files
        </Button>
        <StatusMessage
          message={
            preview.error?.message ||
            remove.error?.message ||
            sources.error?.message ||
            imports.error?.message ||
            cancel.error?.message ||
            null
          }
          tone="error"
        />
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        {(sources.data || []).map((source) => (
          <article
            key={source.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white p-5 text-ink-950"
          >
            <button className="text-left" onClick={() => setSelected(source.id)}>
              <strong className="block">{source.repository}</strong>
              <span className="text-sm text-ink-500">
                {source.status} · {source.commit_sha.slice(0, 8)}
              </span>
            </button>
            <Button
              variant="secondary"
              onClick={() => {
                if (
                  window.confirm(
                    'Remove this source and its imported evidence? Saved recommendations using it will be invalidated.',
                  )
                )
                  remove.mutate(source.id)
              }}
            >
              Remove source
            </Button>
          </article>
        ))}
      </div>
      {(imports.data || [])
        .filter((item) => ['queued', 'running', 'failed'].includes(item.status))
        .map((item) => (
          <Panel key={item.id} title={`Import ${item.id}: ${item.status}`}>
            <p className="text-sm text-ink-600">
              {item.error || 'Processing selected files in the background.'}
            </p>
            {item.status !== 'failed' && (
              <Button variant="secondary" className="mt-2" onClick={() => cancel.mutate(item.id)}>
                Cancel import
              </Button>
            )}
          </Panel>
        ))}
      {active && <SourceDetail key={`${active.id}-${active.status}`} source={active} />}
    </div>
  )
}
