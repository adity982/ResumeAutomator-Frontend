import { setTokenProvider } from './client'

describe('API client', () => {
  it('attaches identity and exposes structured failures', async () => {
    setTokenProvider(async () => 'test-token')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'No access', request_id: 'req-1' } }), { status: 403, headers: { 'Content-Type': 'application/json' } }))
    const { api } = await import('./client')
    await expect(api.listJobs()).rejects.toEqual(expect.objectContaining({ message: 'No access', status: 403, requestId: 'req-1' }))
    expect(fetchMock.mock.calls[0][1]?.headers).toBeInstanceOf(Headers)
    expect((fetchMock.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBe('Bearer test-token')
    fetchMock.mockRestore()
  })
})


it('refreshes a rejected identity once and retries with the fresh token', async () => {
  const tokens = vi.fn(async (force?: boolean) => force ? 'fresh-token' : 'expired-token')
  setTokenProvider(tokens)
  const fetchMock = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }))
    .mockResolvedValueOnce(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }))
  try {
    const { api } = await import('./client')
    expect(await api.listJobs()).toEqual([])
    expect(tokens).toHaveBeenLastCalledWith(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((fetchMock.mock.calls[1][1]?.headers as Headers).get('Authorization')).toBe('Bearer fresh-token')
  } finally { fetchMock.mockRestore() }
})
