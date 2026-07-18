import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ResumeEditor } from './ResumeEditor'

describe('ResumeEditor', () => {
  it('exposes evidence additions for individual rejection', async () => {
    const user = userEvent.setup()
    const reject = vi.fn()
    render(
      <ResumeEditor
        result={{ original: 'SUMMARY\nOriginal evidence', tailored: 'SUMMARY\nOriginal evidence\nVerified cloud', added_phrases: ['cloud'], warnings: [] }}
        onChange={() => undefined}
        onRejectPhrase={reject}
      />,
    )
    expect(screen.getByText('1 sections detected.', { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reject cloud' }))
    expect(reject).toHaveBeenCalledWith('cloud')
  })
})
