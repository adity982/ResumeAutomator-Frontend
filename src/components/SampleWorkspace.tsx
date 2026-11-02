import { useState } from 'react'
import { Button } from './Button'
import { Panel } from './Panel'

const examples = {
  backend: {
    title: 'Backend developer',
    requirement: 'Build tested APIs with relational databases.',
    project: 'Sample API service',
    source: 'api/routes.py, tests/test_orders.py',
    excerpt: 'The sample service validates order requests and tests PostgreSQL persistence.',
    bullet: 'Implemented order validation and persistence tests in a Python API service.',
  },
  retrieval: {
    title: 'Retrieval engineer',
    requirement: 'Build and evaluate source-grounded search.',
    project: 'Sample retrieval lab',
    source: 'retrieval/search.py, evaluations/relevance.json',
    excerpt:
      'The sample search pipeline combines lexical and vector results and evaluates labeled queries.',
    bullet:
      'Built hybrid retrieval and compared ranked results against labeled relevance examples.',
  },
}

export function SampleWorkspace(): React.JSX.Element {
  const [role, setRole] = useState<'backend' | 'retrieval'>('backend')
  const [reviewed, setReviewed] = useState(false)
  const example = examples[role]
  return (
    <Panel
      title="Explore a sample application"
      description="Illustrative data only. These projects, contributions and job requirements are fictional; nothing here is added to your account."
    >
      <label className="block max-w-md text-sm font-medium text-ink-700">
        Sample target role
        <select
          className="mt-2 w-full rounded-lg border border-ink-300 p-3"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as typeof role)
            setReviewed(false)
          }}
        >
          <option value="backend">Backend developer</option>
          <option value="retrieval">Retrieval engineer</option>
        </select>
      </label>
      <div className="sample-grid">
        <section className="sample-context">
          <p className="sample-step">01 / The role & the evidence</p>
          <h3 className="sample-heading">What the role needs</h3>
          <p className="mt-3 text-ink-600">{example.requirement}</p>
          <h3 className="sample-heading mt-7">Why this project fits</h3>
          <p className="mt-3 font-medium text-brand-800">{example.project}</p>
          <p className="mt-2 text-sm leading-6 text-ink-600">{example.excerpt}</p>
          <details className="mt-4 rounded-lg bg-ink-100 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Inspect illustrative source
            </summary>
            <p className="mt-3 font-mono text-xs">{example.source}</p>
            <p className="mt-2 text-sm">{example.excerpt}</p>
          </details>
        </section>
        <section className="sample-draft">
          <p className="sample-step">02 / The words you review</p>
          <h3 className="sample-heading">Proposed resume bullet</h3>
          <p className="mt-4 leading-7 text-ink-700">{example.bullet}</p>
          <label className="mt-5 flex items-start gap-3 text-sm text-ink-700">
            <input
              className="mt-1"
              type="checkbox"
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            I reviewed the sample evidence and understand this would require my own contribution.
          </label>
          <Button
            className="mt-5"
            disabled={!reviewed}
            onClick={() => {
              const blob = new Blob(
                [
                  `SAMPLE ONLY\n${example.title}\n\n${example.bullet}\n\nIllustrative source: ${example.source}`,
                ],
                { type: 'text/plain' },
              )
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'sample-application.txt'
              link.click()
              window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Download illustrative bullet
          </Button>
        </section>
      </div>
      <p className="mt-6 text-sm text-ink-500">
        Missing evidence is a valid result. This example makes no claim about your skills or
        interview chances.
      </p>
    </Panel>
  )
}
