import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GitHubConnection } from './GitHubConnection'

const mock = vi.hoisted(() => ({
  status: vi.fn(),
  complete: vi.fn(),
  start: vi.fn(),
  disconnect: vi.fn(),
}))
vi.mock('../api/client', () => ({
  api: {
    githubConnection: mock.status,
    completeGitHubConnection: mock.complete,
    startGitHubConnection: mock.start,
    disconnectGitHub: mock.disconnect,
  },
}))

function view(): React.JSX.Element {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <GitHubConnection />
    </QueryClientProvider>
  )
}

describe('GitHub connection consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/')
  })
  it('removes callback parameters and requires an explicit completion action', async () => {
    window.history.replaceState(null, '', '/?code=test-code&state=test-state')
    mock.status.mockResolvedValue({
      configured: true,
      connected: false,
      installation_url: 'https://github.com/apps/test/installations/new',
    })
    mock.complete.mockResolvedValue({ connected: true })
    render(view())
    await waitFor(() => expect(window.location.search).toBe(''))
    expect(mock.complete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Finish GitHub connection' }))
    await waitFor(() => expect(mock.complete).toHaveBeenCalledWith('test-code', 'test-state'))
    expect(await screen.findByText(/GitHub connected\. You can now/)).toBeInTheDocument()
  })
  it('keeps an unavailable connection disabled and explains retained excerpts', async () => {
    mock.status.mockResolvedValue({ configured: false, connected: false })
    render(view())
    expect(await screen.findByRole('button', { name: 'Connect GitHub' })).toBeDisabled()
    expect(screen.getByText(/Remove imported sources separately/)).toBeInTheDocument()
  })
})
