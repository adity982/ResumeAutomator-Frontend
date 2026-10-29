import { useMutation } from '@tanstack/react-query'
import { api, downloadBlob } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function SettingsPanel({
  onSignOut,
  onDelete,
  busy,
}: {
  onSignOut: () => void
  onDelete: () => void
  busy: boolean
}): React.JSX.Element {
  const workspace = useWorkspace()
  const exportData = useMutation({
    mutationFn: api.exportAccount,
    onSuccess: (data) =>
      downloadBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
        'resume-automator-data.json',
      ),
  })
  const forget = useMutation({ mutationFn: workspace.forgetProgress })
  return (
    <div className="space-y-5">
      <Panel
        title="Your data and account"
        description="Control what you keep. No LinkedIn messages or connection requests are sent by this application."
      >
        <div className="max-w-3xl space-y-4 text-sm leading-7 text-ink-600">
          <p>
            Uploaded PDF bytes are parsed in memory. Saved progress, document text, imported public
            source excerpts, approved statements, interview answers and outreach drafts are stored
            in your account until you delete them. Resume text is not stored in browser local
            storage.
          </p>
          <p>
            Repository imports use GitHub’s API. Optional GitHub App connections can read selected
            private repositories when enabled by the operator. Imported excerpts remain until you
            remove the source or account; disconnecting removes the credential. Local FastEmbed
            embeddings run on the server when configured. Optional cover-letter polishing sends its
            supplied draft to Groq when the operator enables that provider.
          </p>
          <p>
            Deleting Resume Automator data removes the application's records and derived evidence.
            It does not delete your Google account or Firebase sign-in identity. Download an export
            first if you need a copy. Backup retention depends on the deployment operator's
            documented policy.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            busy={exportData.isPending}
            onClick={() => exportData.mutate()}
          >
            Export my data
          </Button>
          <Button
            variant="secondary"
            busy={forget.isPending}
            onClick={() => {
              if (
                window.confirm(
                  'Delete saved workspace progress and clear the current draft? Saved document versions remain.',
                )
              )
                forget.mutate()
            }}
          >
            Forget workspace progress
          </Button>
          <Button variant="secondary" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
        <StatusMessage
          message={exportData.error?.message || forget.error?.message || null}
          tone="error"
        />
      </Panel>
      <Panel
        title="Delete application data"
        description="Permanently remove your Resume Automator records, including imported evidence, documents, contacts and feedback."
      >
        <Button variant="danger" busy={busy} onClick={onDelete}>
          Delete my Resume Automator data
        </Button>
      </Panel>
    </div>
  )
}
