import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const apiMock = vi.hoisted(() => ({
  listApplications: vi.fn().mockResolvedValue([]),
  listDocuments: vi.fn().mockResolvedValue([]),
  listJobs: vi.fn().mockResolvedValue([]),
  listTasks: vi.fn().mockResolvedValue([]),
  applicationPackage: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  createApplication: vi.fn().mockResolvedValue({ id: 1, company: 'Example', role: 'Engineer', stage: 'saved' }),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
}))

vi.mock('../api/client', () => ({ api: apiMock }))

import { ApplicationBoard } from './ApplicationBoard'

describe('ApplicationBoard', () => {
  it('creates a pipeline card with user-entered evidence', async () => {
    const user = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(<QueryClientProvider client={client}><ApplicationBoard /></QueryClientProvider>)
    await user.type(screen.getByLabelText('Company'), 'Example')
    await user.type(screen.getByLabelText('Role'), 'Engineer')
    await user.type(screen.getByLabelText('Notes'), 'Referral from campus event')
    await user.click(screen.getByRole('button', { name: 'Add to pipeline' }))
    await waitFor(() => expect(apiMock.createApplication).toHaveBeenCalledWith(expect.objectContaining({ company: 'Example', role: 'Engineer', notes: 'Referral from campus event' })))
  })
})
