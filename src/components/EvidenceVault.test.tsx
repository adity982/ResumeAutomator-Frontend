import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const apiMock = vi.hoisted(() => ({
  listEvidence: vi.fn().mockResolvedValue([]),
  createEvidence: vi.fn().mockResolvedValue({ id: 1 }),
  updateEvidence: vi.fn(),
  deleteEvidence: vi.fn(),
}))

vi.mock('../api/client', () => ({ api: apiMock }))

import { EvidenceVault } from './EvidenceVault'

describe('EvidenceVault', () => {
  it('stores a verified evidence statement with normalized tag input', async () => {
    const user = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(<QueryClientProvider client={client}><EvidenceVault /></QueryClientProvider>)
    await user.type(screen.getByLabelText('Evidence title'), 'Latency improvement')
    await user.type(screen.getByLabelText('Truthful evidence statement'), 'Reduced API latency by 25% after profiling SQL queries.')
    await user.type(screen.getByLabelText('Search tags'), 'python, sql')
    await user.click(screen.getByLabelText('I can substantiate this statement'))
    await user.click(screen.getByRole('button', { name: 'Save evidence' }))
    await waitFor(() => expect(apiMock.createEvidence).toHaveBeenCalledWith(expect.objectContaining({ verified: true, tags: ['python', 'sql'] })))
  })
})
