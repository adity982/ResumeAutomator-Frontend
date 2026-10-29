import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResumeReuse } from './ResumeReuse'
import { workspaceInputKey } from '../utils/workspace'
import type { WorkspaceData } from '../types'

const mock = vi.hoisted(() => ({
  documents: vi.fn(),
  reuse: vi.fn(),
  update: vi.fn(),
  tailored: vi.fn(),
}))
const input: WorkspaceData = {
  resume_text: '',
  jd_text: 'Build APIs',
  selected_job_id: 8,
  tailored_text: '',
  cover_letter: '',
  evidence_ids: [],
  resume_logical_id: 'old-family',
  cover_logical_id: null,
  target_title: 'API developer',
  target_company: 'Target',
  target_url: '',
}
vi.mock('../api/client', () => ({
  api: { listDocuments: mock.documents, reuseResume: mock.reuse },
}))
vi.mock('../hooks/useWorkspace', () => ({
  useWorkspace: () => ({
    selectedJob: { id: 8 },
    resumeText: '',
    data: input,
    updateData: mock.update,
    setTailored: mock.tailored,
  }),
}))

it('copies the latest family version with fresh family identity and input guards', async () => {
  mock.documents.mockResolvedValue([
    { id: 1, logical_id: 'base', version: 1, kind: 'resume', title: 'Base', approved: true },
    { id: 2, logical_id: 'base', version: 2, kind: 'resume', title: 'Base', approved: true },
  ])
  mock.reuse.mockResolvedValue({
    content: 'Reviewed API resume',
    evidence_ids: [3],
    warnings: ['Review again'],
    job_id: 8,
    source_title: 'Base',
    source_version: 2,
  })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ResumeReuse />
    </QueryClientProvider>,
  )
  await waitFor(() => expect(mock.documents).toHaveBeenCalled())
  await screen.findByRole('option', { name: 'Base · v2 · reviewed' })
  expect(screen.queryByRole('option', { name: 'Base · v1 · reviewed' })).not.toBeInTheDocument()
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Saved resume to reuse' }),
    '2',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Use as starting draft' }))
  await waitFor(() => expect(mock.reuse).toHaveBeenCalledWith(8, 2))
  await waitFor(() => expect(mock.update).toHaveBeenCalledWith(
    { resume_text: 'Reviewed API resume', evidence_ids: [3], resume_logical_id: null },
    workspaceInputKey(input),
  ))
  expect(mock.tailored).toHaveBeenCalledWith(
    expect.objectContaining({ original: 'Reviewed API resume' }),
    workspaceInputKey({ ...input, resume_text: 'Reviewed API resume' }),
  )
})
