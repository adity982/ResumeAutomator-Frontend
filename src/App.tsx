import { lazy, Suspense, useEffect, useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from './api/client'
import { Button } from './components/Button'
import { Panel } from './components/Panel'
import { StatusMessage } from './components/StatusMessage'
import { Workbench } from './components/Workbench'
import { JobWorkspace } from './components/JobWorkspace'
import { SampleWorkspace } from './components/SampleWorkspace'
import { SettingsPanel } from './components/SettingsPanel'
import { PilotFeedback } from './components/PilotFeedback'
import { NextActions } from './components/NextActions'
import { Brand } from './components/Brand'
import { PageIntro } from './components/PageIntro'
import { Welcome } from './components/Welcome'
import { WorkspaceProvider } from './context/WorkspaceProvider'
import { useWorkspace } from './hooks/useWorkspace'
import { useAuth } from './hooks/useAuth'
import { useRoute } from './hooks/useRoute'
import type { AuthSession } from './types'

const ApplicationBoard = lazy(() =>
  import('./components/ApplicationBoard').then((m) => ({ default: m.ApplicationBoard })),
)
const JobLibrary = lazy(() =>
  import('./components/JobLibrary').then((m) => ({ default: m.JobLibrary })),
)
const AnalyticsDashboard = lazy(() =>
  import('./components/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })),
)
const DiscoveryPanel = lazy(() =>
  import('./components/DiscoveryPanel').then((m) => ({ default: m.DiscoveryPanel })),
)
const EvidenceVault = lazy(() =>
  import('./components/EvidenceVault').then((m) => ({ default: m.EvidenceVault })),
)
const PortfolioPanel = lazy(() =>
  import('./components/PortfolioPanel').then((m) => ({ default: m.PortfolioPanel })),
)

function SignedInWorkspace({
  user,
  logout,
}: {
  user: AuthSession
  logout: () => Promise<void>
}): React.JSX.Element {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  )
  useEffect(() => () => client.clear(), [client])
  return (
    <QueryClientProvider client={client}>
      <WorkspaceProvider uid={user.uid}>
        <WorkspaceShell user={user} logout={logout} />
      </WorkspaceProvider>
    </QueryClientProvider>
  )
}

function WorkspaceShell({
  user,
  logout,
}: {
  user: AuthSession
  logout: () => Promise<void>
}): React.JSX.Element {
  const route = useRoute()
  const workspace = useWorkspace()
  const client = useQueryClient()
  const [sessionError, setSessionError] = useState<string | null>(null)
  const deletion = useMutation({ mutationFn: api.deleteAccount })
  useEffect(() => {
    try {
      window.localStorage?.removeItem('resume-automator-draft')
    } catch {
      /* Storage may be unavailable; drafts are never written locally. */
    }
  }, [])
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent): void => {
      if (workspace.dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [workspace.dirty])
  const signOut = async (): Promise<void> => {
    if (
      workspace.dirty &&
      !window.confirm('You have unsaved changes. Sign out and discard the work in this tab?')
    )
      return
    try {
      await logout()
      client.clear()
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Sign out failed.')
    }
  }
  const removeAccount = async (): Promise<void> => {
    if (
      !window.confirm(
        'Permanently delete all Resume Automator records? Your Google/Firebase sign-in identity remains. This cannot be undone.',
      )
    )
      return
    try {
      await deletion.mutateAsync()
      await logout()
      client.clear()
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Account deletion failed.')
    }
  }
  const match = /^\/jobs\/(\d+)(?:\/.*)?$/.exec(route)
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="primary-nav" aria-label="Primary">
            {[
              ['/jobs', 'Jobs'],
              ['/evidence', 'My evidence'],
              ['/activity', 'Activity'],
              ['/settings', 'Settings'],
            ].map(([path, label]) => (
              <a
                key={path}
                href={`#${path}`}
                aria-current={route.startsWith(path) ? 'page' : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="account-label" title={user.displayName}>
            {user.displayName}
          </span>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="workspace-main">
        <div className="save-bar">
          <div>
            <p className="save-state" role="status">
              <span className="save-dot" data-dirty={workspace.dirty} aria-hidden="true" />
              {workspace.saveStatus}
            </p>
            {workspace.hasRecovery && (
              <button
                className="mt-1 text-xs text-brand-800 underline"
                onClick={workspace.restoreProgress}
              >
                Restore saved workspace
              </button>
            )}
          </div>
          <Button variant="secondary" onClick={workspace.saveProgress}>
            Save progress
          </Button>
        </div>
        <StatusMessage
          message={workspace.saveError || sessionError || deletion.error?.message || null}
          tone="error"
        />
        <div className="workspace-content">
          <Suspense
            fallback={
              <Panel title="Opening workspace…">
                <p role="status">Loading tools…</p>
              </Panel>
            }
          >
            {route === '/jobs' && (
              <>
                <section className="home-intro">
                  <div>
                    <p className="eyebrow">Your workspace</p>
                    <h1 className="page-title">
                      Your applications,
                      <br />
                      <em>all together.</em>
                    </h1>
                  </div>
                  <div>
                    <p className="text-sm leading-7 text-ink-600">
                      Choose a saved job, review your evidence or start a new application.
                      Everything you need for your next opportunity, in one place.
                    </p>
                    <div className="home-actions">
                      <a href="#/jobs/new" className="ui-button button-primary">
                        Prepare a new application
                      </a>
                      <a href="#/sample" className="text-link">
                        Explore a sample first
                      </a>
                    </div>
                  </div>
                </section>
                <div className="home-grid">
                  <NextActions />
                  <JobLibrary />
                </div>
              </>
            )}
            {route === '/jobs/new' && (
              <>
                <PageIntro
                  eyebrow="A new opportunity"
                  title="Start with what matters."
                  description="Bring your resume and a role you’re interested in. We’ll keep everything together from here."
                />
                <Workbench />
              </>
            )}
            {match && <JobWorkspace key={match[1]} id={Number(match[1])} />}
            {route === '/evidence' && (
              <>
                <PageIntro
                  eyebrow="Your body of work"
                  title="Show what you’ve built."
                  description="Collect the projects and contributions that make your experience yours. Choose what you want to use."
                />
                <PortfolioPanel />
                <details className="disclosure">
                  <summary className="cursor-pointer font-medium text-ink-900">
                    Add other achievements and career stories
                  </summary>
                  <div className="mt-5">
                    <EvidenceVault />
                  </div>
                </details>
              </>
            )}
            {route === '/activity' && (
              <>
                <PageIntro
                  eyebrow="Keep things moving"
                  title="Every next step, in view."
                  description="Your applications, conversations and follow-ups. A place to pick up the thread."
                />
                <ApplicationBoard />
                <details className="disclosure">
                  <summary className="cursor-pointer font-medium text-ink-900">
                    Application analytics
                  </summary>
                  <div className="mt-4">
                    <AnalyticsDashboard />
                  </div>
                </details>
                <details className="disclosure">
                  <summary className="cursor-pointer font-medium text-ink-900">
                    Build search suggestions
                  </summary>
                  <div className="mt-4">
                    <DiscoveryPanel />
                  </div>
                </details>
                <PilotFeedback />
              </>
            )}
            {route === '/settings' && (
              <>
                <PageIntro
                  eyebrow="Make yourself at home"
                  title="Your space. Your say."
                  description="Manage your account, connections and the information you choose to keep."
                />
                <SettingsPanel
                  onSignOut={() => void signOut()}
                  onDelete={() => void removeAccount()}
                  busy={deletion.isPending}
                />
              </>
            )}
            {route === '/sample' && <SampleWorkspace />}
            {!match &&
              !['/jobs', '/jobs/new', '/evidence', '/activity', '/settings', '/sample'].includes(
                route,
              ) && (
                <Panel title="Page not found">
                  <a className="text-brand-800 underline" href="#/jobs">
                    Return to jobs
                  </a>
                </Panel>
              )}
          </Suspense>
        </div>
      </main>
    </>
  )
}

export function App(): React.JSX.Element {
  const { user, loading, login, logout, configurationError } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const signIn = async (): Promise<void> => {
    try {
      await login()
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign in failed. Please try again.')
    }
  }
  if (loading)
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-paper text-ink-950">
        <p role="status">Checking your session…</p>
      </main>
    )
  return (
    <div className="app-root">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3 focus:text-ink-950"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to main content
      </a>
      {user ? (
        <SignedInWorkspace key={user.uid} user={user} logout={logout} />
      ) : (
        <Welcome
          onSignIn={() => void signIn()}
          signInAvailable={!configurationError}
          error={
            configurationError
              ? 'Sign-in is temporarily unavailable. You can still explore the sample workspace.'
              : loginError
          }
        />
      )}
      <footer className="site-footer">
        <p>
          Source-backed suggestions remain drafts until you review them. Saved text stays in your
          account until you delete it.
        </p>
        <a
          className="underline"
          href={
            user
              ? '#/settings'
              : 'https://github.com/adity982/ResumeAutomator-Backend#privacy-and-retention'
          }
        >
          Privacy and data controls
        </a>
      </footer>
    </div>
  )
}
