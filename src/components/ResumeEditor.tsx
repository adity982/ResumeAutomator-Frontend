import { useMemo, useState } from 'react'

import type { TailorResult } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

interface ResumeEditorProps {
  result: TailorResult
  onChange: (value: string) => void
  onRejectPhrase: (phrase: string) => void
}

function extractSections(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line === line.toUpperCase() && line.length < 80)
}

export function ResumeEditor({
  result,
  onChange,
  onRejectPhrase,
}: ResumeEditorProps): React.JSX.Element {
  const [history, setHistory] = useState([result.tailored])
  const [historyIndex, setHistoryIndex] = useState(0)
  const value = history[historyIndex]
  const sections = useMemo(() => extractSections(value), [value])

  const update = (next: string): void => {
    const nextHistory = [...history.slice(0, historyIndex + 1), next].slice(-50)
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
    onChange(next)
  }

  const moveHistory = (nextIndex: number): void => {
    setHistoryIndex(nextIndex)
    onChange(history[nextIndex])
  }

  return (
    <Panel
      title="Evidence-preserving editor"
      description="Review the original and tailored versions, reject individual additions, edit manually, and save only an approved version."
    >
      {result.warnings.map((warning) => (
        <StatusMessage key={warning} message={warning} />
      ))}
      {(result.citations || []).map((citation) => (
        <a
          key={citation.evidence_id}
          className="mr-4 text-sm font-medium text-brand-800 underline"
          href={citation.url}
          target="_blank"
          rel="noreferrer"
        >
          Source for: {citation.statement.slice(0, 65)}
        </a>
      ))}
      <div className="my-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={historyIndex === 0}
          onClick={() => moveHistory(historyIndex - 1)}
        >
          Undo
        </Button>
        <Button
          variant="secondary"
          disabled={historyIndex === history.length - 1}
          onClick={() => moveHistory(historyIndex + 1)}
        >
          Redo
        </Button>
        <span className="text-xs text-ink-500" role="status">
          Use Save progress to resume later. {sections.length} sections detected.
        </span>
      </div>
      {result.added_phrases.length > 0 && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <h3 className="text-sm font-semibold text-brand-950">Approved additions</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.added_phrases.map((phrase) => (
              <span
                key={phrase}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-brand-900 "
              >
                <mark className="bg-brand-100">{phrase}</mark>
                <button
                  className="font-medium text-rose-700 underline"
                  onClick={() => onRejectPhrase(phrase)}
                  aria-label={`Reject ${phrase}`}
                >
                  Reject
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">Original — read only</span>
          <textarea
            className="h-[34rem] w-full resize-y rounded-lg border border-ink-200 bg-ink-50 p-4 font-mono text-sm leading-6 text-ink-600"
            value={result.original}
            readOnly
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">Tailored — editable</span>
          <textarea
            className="h-[34rem] w-full resize-y rounded-lg border border-ink-300 bg-white p-4 font-mono text-sm leading-6 text-ink-900 outline-none focus:ring-2 focus:ring-brand-500"
            value={value}
            onChange={(event) => update(event.target.value)}
          />
        </label>
      </div>
    </Panel>
  )
}
