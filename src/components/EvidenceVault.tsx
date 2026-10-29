import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import type { CareerEvidence } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

const categories: CareerEvidence['category'][] = [
  'achievement',
  'skill',
  'project',
  'education',
  'certification',
  'story',
]

export function EvidenceVault(): React.JSX.Element {
  const [category, setCategory] = useState<CareerEvidence['category']>('achievement')
  const [title, setTitle] = useState('')
  const [statement, setStatement] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')
  const [verified, setVerified] = useState(false)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const evidence = useQuery({ queryKey: ['evidence'], queryFn: api.listEvidence })
  const create = useMutation({
    mutationFn: () =>
      api.createEvidence({
        category,
        title,
        statement,
        source,
        verified,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setTitle('')
      setStatement('')
      setSource('')
      setTags('')
      setVerified(false)
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
    },
  })
  const toggle = useMutation({
    mutationFn: (item: CareerEvidence) => api.updateEvidence(item.id, { verified: !item.verified }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evidence'] }),
  })
  const remove = useMutation({
    mutationFn: api.deleteEvidence,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evidence'] }),
  })
  const filtered = useMemo(
    () =>
      (evidence.data || []).filter((item) =>
        `${item.title} ${item.statement} ${item.tags.join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [evidence.data, search],
  )

  return (
    <div className="space-y-5">
      <Panel
        title="Career evidence vault"
        description="Store reusable facts once, mark only substantiated evidence as verified, and reuse its tags during tailoring."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-ink-700">
            Category
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3 capitalize"
              value={category}
              onChange={(event) => setCategory(event.target.value as CareerEvidence['category'])}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700">
            Evidence title
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Reduced API latency"
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Source or proof
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Performance report, portfolio URL…"
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Search tags
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="python, sql, performance"
            />
          </label>
          <label className="text-sm font-medium text-ink-700 md:col-span-2 xl:col-span-4">
            Truthful evidence statement
            <textarea
              className="mt-1 h-28 w-full rounded-lg border border-ink-300 p-3 font-normal"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              placeholder="Describe what you did, the context, and only results you can substantiate."
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
          />{' '}
          I can substantiate this statement
        </label>
        <Button
          className="mt-3"
          disabled={!title.trim() || statement.trim().length < 10}
          busy={create.isPending}
          onClick={() => create.mutate()}
        >
          Save evidence
        </Button>
        <StatusMessage
          message={create.error?.message || toggle.error?.message || remove.error?.message || null}
          tone="error"
        />
      </Panel>

      <label className="block max-w-xl text-sm font-medium text-ink-700">
        Search evidence
        <input
          className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 bg-white px-3 text-ink-950"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => (
          <Panel
            key={item.id}
            title={item.title}
            description={`${item.category} · ${item.verified ? 'Self-attested' : 'Draft evidence'}`}
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink-700">{item.statement}</p>
            {item.source && (
              <p className="mt-2 text-xs text-ink-500">
                <strong>Source:</strong> {item.source}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => toggle.mutate(item)}>
                {item.verified ? 'Mark unverified' : 'Confirm my statement'}
              </Button>
              <Button variant="danger" onClick={() => remove.mutate(item.id)}>
                Delete
              </Button>
            </div>
          </Panel>
        ))}
      </div>
      {!evidence.isLoading && filtered.length === 0 && (
        <Panel title="No evidence yet">
          <p className="text-ink-600">
            Save achievements, projects, skills, and interview stories you can reuse across
            applications.
          </p>
        </Panel>
      )}
    </div>
  )
}
