import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
const mock = vi.hoisted(() => ({ previewProfile: vi.fn(), listEvidence: vi.fn().mockResolvedValue([]), createEvidence: vi.fn().mockResolvedValue({ id: 1 }) }))
vi.mock('../api/client', () => ({ api: mock }))
import { ProfileEvidence } from './ProfileEvidence'
it('previews CSV, saves an unreviewed fact and prevents repeated saves', async () => {
  const item = { category: 'certification', title: 'Cloud credential', statement: 'Cloud credential | Example issuer', source: 'User-provided LinkedIn data export', tags: ['linkedin'], verified: false }
  mock.previewProfile.mockResolvedValue({ items: [item], notice: 'Review before saving.' })
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient()}><ProfileEvidence /></QueryClientProvider>)
  await user.type(screen.getByLabelText('LinkedIn CSV contents'), 'Name,Authority\nCloud credential,Example issuer')
  await user.click(screen.getByRole('button', { name: 'Preview profile evidence' }))
  await user.click(await screen.findByRole('button', { name: 'Save to evidence for review' }))
  await waitFor(() => expect(mock.createEvidence).toHaveBeenCalledWith(expect.objectContaining({ verified: false })))
  expect(await screen.findByRole('button', { name: 'Saved as draft' })).toBeDisabled()
})
