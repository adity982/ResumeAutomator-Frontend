import { render, screen } from '@testing-library/react'

import type { Analysis } from '../types'
import { AnalysisPanel } from './AnalysisPanel'

const analysis: Analysis = {
  score: 62.5,
  verdict: 'Moderate match.',
  methodology_version: 'heuristic-v1',
  input_fingerprint: 'a'.repeat(64),
  methodology: { label: 'Evidence-weighted deterministic match', weights: { skills: 1 }, repeatable: true, limitations: ['Not a guarantee.'] },
  dimensions: [
    { key: 'skills', label: 'Skills alignment', score: 60, definition: 'Measured skill overlap.', evidence: ['python'], confidence: 0.8 },
    { key: 'keywords', label: 'Keyword coverage', score: 65, definition: 'Measured keyword overlap.', evidence: ['api'], confidence: 0.7 },
  ],
  gap_plan: [{ keyword: 'cloud', importance: 'high', action: 'learn', jd_evidence: 'Cloud is required.', resume_evidence: null, suggestion: 'Do not claim without evidence.', confidence: 0.8 }],
}

describe('AnalysisPanel', () => {
  it('renders only backend-provided metrics and evidence', () => {
    render(<AnalysisPanel analysis={analysis} confirmedFacts={[]} onToggleFact={() => undefined} />)
    expect(screen.getByText('62.5')).toBeInTheDocument()
    expect(screen.getByText('Measured skill overlap.')).toBeInTheDocument()
    expect(screen.getByText('Job evidence: Cloud is required.')).toBeInTheDocument()
    expect(screen.queryByText('85')).not.toBeInTheDocument()
  })
})
