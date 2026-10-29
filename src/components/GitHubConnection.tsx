import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function GitHubConnection(): React.JSX.Element {
  const client = useQueryClient()
  const [callback] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return { code: params.get('code'), state: params.get('state'), error: params.get('error') }
  })
  const status = useQuery({ queryKey: ['github-connection'], queryFn: api.githubConnection })
  const refresh = (): void => {
    client.invalidateQueries({ queryKey: ['github-connection'] })
  }
  const connect = useMutation({
    mutationFn: api.startGitHubConnection,
    onSuccess: ({ authorization_url }) => {
      window.location.assign(authorization_url)
    },
  })
  const complete = useMutation({
    mutationFn: () => api.completeGitHubConnection(callback.code!, callback.state!),
    onSuccess: refresh,
  })
  const disconnect = useMutation({ mutationFn: api.disconnectGitHub, onSuccess: refresh })
  useEffect(() => {
    if (callback.code || callback.error) {
      window.history.replaceState(null, '', `${window.location.pathname}#/evidence`)
    }
  }, [callback])
  return (
    <Panel
      title="Connect selected GitHub repositories"
      description="Optional. Public imports work without connecting an account."
    >
      <p className="text-sm text-ink-700">
        Install the operator’s GitHub App on only the repositories you want to share, with Contents
        read access. Private excerpts are saved in your account and may appear in documents you
        export. Connections expire within eight hours. Review files before importing.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {status.data?.installation_url && (
          <a
            className="font-medium text-brand-800 underline"
            href={status.data.installation_url}
            target="_blank"
            rel="noreferrer"
          >
            Choose repositories in GitHub
          </a>
        )}
        {status.data?.connected ? (
          <>
            <p>Connected as {status.data.login}</p>
            <Button
              variant="secondary"
              busy={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              Disconnect GitHub
            </Button>
          </>
        ) : (
          <Button
            disabled={!status.data?.configured}
            busy={connect.isPending}
            onClick={() => connect.mutate()}
          >
            Connect GitHub
          </Button>
        )}
        {callback.code && callback.state && !complete.isSuccess && (
          <Button busy={complete.isPending} onClick={() => complete.mutate()}>
            Finish GitHub connection
          </Button>
        )}
      </div>
      {status.data && !status.data.configured && (
        <p className="mt-3 text-sm text-ink-600">
          The operator has not enabled private repository access yet.
        </p>
      )}
      <p className="mt-3 text-sm text-ink-600">
        Disconnect removes the saved credential. Remove imported sources separately to delete
        excerpts. You can also revoke the app in GitHub Settings → Applications.
      </p>
      <StatusMessage
        tone="error"
        message={
          connect.error?.message ||
          complete.error?.message ||
          disconnect.error?.message ||
          status.error?.message ||
          (callback.error ? 'GitHub authorization was cancelled. You can connect again.' : null)
        }
      />
      {complete.isSuccess && (
        <StatusMessage message="GitHub connected. You can now choose account access when previewing a repository." />
      )}
    </Panel>
  )
}
