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
