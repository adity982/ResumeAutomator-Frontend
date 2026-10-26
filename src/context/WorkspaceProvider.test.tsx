import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspaceProvider } from './WorkspaceProvider'
import { useWorkspace } from '../hooks/useWorkspace'
import { workspaceInputKey } from '../utils/workspace'

const mocks = vi.hoisted(() => ({
  workspace: vi.fn().mockResolvedValue({ revision: 0, data: {} }),
  saveWorkspace: vi.fn(),
  getJob: vi.fn(),
  clearWorkspace: vi.fn(),
}))
vi.mock('../api/client', () => ({ api: mocks }))

function Harness(): React.JSX.Element {
  const w = useWorkspace()
  const [oldInput, setOldInput] = useState('')
  return (
    <>
      <label>
        Resume
        <textarea value={w.resumeText} onChange={(event) => w.setResumeText(event.target.value)} />
      </label>
      <button
        onClick={() => {
          setOldInput(workspaceInputKey(w.data))
          w.setTailored({
            original: '',
            tailored: 'Draft from original input',
            added_phrases: [],
            warnings: [],
          })
        }}
      >
        Make draft
      </button>
      <button
        onClick={() =>
          w.setTailored(
            { original: '', tailored: 'Late stale response', added_phrases: [], warnings: [] },
            oldInput,
          )
        }
      >
        Resolve old request
      </button>
      <button onClick={w.saveProgress}>Save</button>
      <button onClick={w.restoreProgress}>Restore</button>
      <output data-testid="draft">{w.tailored?.tailored || 'No draft'}</output>
      <output>{w.saveStatus}</output>
    </>
  )
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <WorkspaceProvider uid="test-user">
        <Harness />
      </WorkspaceProvider>
    </QueryClientProvider>,
  )
}

describe('workspace input and recovery lifecycle', () => {
  it('invalidates drafts and refuses late responses after the source input changes', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText('Resume'), 'Original resume')
    await user.click(screen.getByText('Make draft'))
    expect(screen.getByTestId('draft')).toHaveTextContent('Draft from original input')
    await user.type(screen.getByLabelText('Resume'), ' changed')
    expect(screen.getByTestId('draft')).toHaveTextContent('No draft')
    await user.click(screen.getByText('Resolve old request'))
    expect(screen.getByTestId('draft')).toHaveTextContent('No draft')
  })

  it('saves with a revision and restores a private draft from the account', async () => {
    const user = userEvent.setup()
    const storageWrite = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: storageWrite,
      removeItem: vi.fn(),
      clear: vi.fn(),
    })
    mocks.saveWorkspace.mockImplementation(async (revision, data) => ({
      revision: revision + 1,
      data,
    }))
    setup()
    await user.type(screen.getByLabelText('Resume'), 'My saved resume')
    await user.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(mocks.saveWorkspace).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ resume_text: 'My saved resume' }),
      ),
    )
    mocks.workspace.mockResolvedValueOnce({
      revision: 2,
      data: { resume_text: 'Recovered account resume', tailored_text: 'Recovered draft' },
    })
    await user.click(screen.getByText('Restore'))
    await waitFor(() =>
      expect(screen.getByLabelText('Resume')).toHaveValue('Recovered account resume'),
    )
    expect(screen.getByTestId('draft')).toHaveTextContent('Recovered draft')
    expect(storageWrite).not.toHaveBeenCalled()
  })
})
