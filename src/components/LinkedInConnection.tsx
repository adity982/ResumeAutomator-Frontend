import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function LinkedInConnection(): React.JSX.Element {
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    return { code: params.get('linkedin_code'), state: params.get('linkedin_state'), error: params.get('linkedin_error') }
  })
  const client = useQueryClient()
  const status = useQuery({ queryKey: ['linkedin-connection'], queryFn: api.linkedinConnection })
  const refresh = (): void => { client.invalidateQueries({ queryKey: ['linkedin-connection'] }) }
  const connect = useMutation({ mutationFn: api.startLinkedIn, onSuccess: result => {
    sessionStorage.setItem('linkedin-oauth-state', result.state)
    window.location.assign(result.authorization_url)
  } })
  const complete = useMutation({ mutationFn: async () => {
    if (!callback.state || !callback.code || sessionStorage.getItem('linkedin-oauth-state') !== callback.state) throw new Error('This authorization did not start in this tab. Connect again.')
    sessionStorage.removeItem('linkedin-oauth-state')
    return api.completeLinkedIn(callback.code, callback.state)
  }, onSuccess: refresh })
  const disconnect = useMutation({ mutationFn: api.disconnectLinkedIn, onSuccess: refresh })
  useEffect(() => {
    if (callback.code || callback.error) window.history.replaceState(null, '', window.location.pathname + '#/evidence')
  }, [callback])
  return <Panel title="Connect LinkedIn basic profile" description="Authorize LinkedIn directly. This connects your name; it does not import work history or certifications.">
    <p className="mb-4 text-sm text-ink-600">Your Google workspace stays signed in. LinkedIn tokens are used once on the server and are not saved. This connection is not identity or employment verification. Import your PDF or CSV below for career history.</p>
    {status.data?.connected ? <><p className="mb-3">Connected profile: {status.data.name}</p><Button variant="secondary" busy={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect LinkedIn</Button></> : <Button disabled={!status.data?.configured} busy={connect.isPending} onClick={() => connect.mutate()}>Connect LinkedIn</Button>}
    {!status.data?.configured && status.isSuccess && <p className="mt-3 text-sm text-ink-600">LinkedIn developer-app setup is pending. PDF and CSV imports are available now.</p>}
    {callback.code && callback.state && !complete.isSuccess && <Button busy={complete.isPending} onClick={() => complete.mutate()}>Finish LinkedIn connection</Button>}
    <StatusMessage tone="error" message={connect.error?.message || complete.error?.message || disconnect.error?.message || status.error?.message || (callback.error ? 'LinkedIn authorization was cancelled. Connect again.' : null)} />
  </Panel>
}
