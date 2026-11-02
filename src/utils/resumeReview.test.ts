import { reviewResumeChanges } from './resumeReview'

describe('resume text review', () => {
  it('ignores whitespace and moved lines while preserving duplicate additions', () => {
    const result = reviewResumeChanges(
      'Built APIs\nTested orders\n2025',
      '  2025\nTested orders\nBuilt APIs\nBuilt APIs',
    )
    expect(result.added).toEqual(['Built APIs'])
    expect(result.removed).toEqual([])
    expect(result.newNumbers).toEqual([])
  })
  it('surfaces new numeric details and unfinished placeholders without treating them as false', () => {
    const result = reviewResumeChanges(
      'Built APIs in 2025',
      'Built APIs in 2026 and reduced latency 40%\n[insert metric]\nTBD',
    )
    expect(result.newNumbers).toEqual(['2026', '40%'])
    expect(result.placeholders).toEqual(['[insert metric]', 'TBD'])
    expect(result.removed).toEqual(['Built APIs in 2025'])
  })
})
