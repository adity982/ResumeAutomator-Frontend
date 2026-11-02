import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentPreview } from './DocumentPreview'

const mock = vi.hoisted(() => ({
  content: 'Original reviewed resume',
  exportDocument: vi.fn(),
  createDocument: vi.fn(),
  updateData: vi.fn(),
}))
vi.mock('../api/client', () => ({
  api: { exportDocument: mock.exportDocument, createDocument: mock.createDocument },
  downloadBlob: vi.fn(),
}))
vi.mock('../hooks/useWorkspace', () => ({
  useWorkspace: () => ({
    tailored: { original: 'Original', tailored: mock.content },
    selectedJob: null,
    data: { evidence_ids: [], resume_logical_id: 'resume-family', cover_logical_id: null },
    updateData: mock.updateData,
  }),
}))

describe('document approval', () => {
  it('requires an actual PDF preview and invalidates approval when content changes', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:test-pdf'),
        revokeObjectURL: vi.fn(),
      }),
    )
    mock.exportDocument.mockResolvedValue(new Blob(['PDF']))
    mock.createDocument.mockResolvedValue({
      logical_id: 'resume-family',
      version: 2,
      approved: true,
    })
    const client = new QueryClient()
    const view = () => (
      <QueryClientProvider client={client}>
        <DocumentPreview />
      </QueryClientProvider>
    )
    const { rerender } = render(view())
    const approval = screen.getByLabelText('I reviewed this exact version')
    expect(approval).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Preview PDF' }))
    await waitFor(() => expect(approval).toBeEnabled())
    await user.click(approval)
    await user.click(screen.getByRole('button', { name: 'Save version' }))
    await waitFor(() =>
      expect(mock.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ logical_id: 'resume-family', approved: true }),
      ),
    )
    mock.content = 'Edited after approval'
    rerender(view())
    expect(approval).not.toBeChecked()
    expect(approval).toBeDisabled()
    expect(screen.queryByTitle('Exported PDF preview')).not.toBeInTheDocument()
  })
})
