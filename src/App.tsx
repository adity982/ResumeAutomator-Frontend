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
      <header className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4">
          <a href="#/jobs" className="text-xl font-bold tracking-tight text-white">
            Resume Automator
          </a>
          <nav className="flex flex-wrap gap-1" aria-label="Primary">
            {[
              ['/jobs', 'Jobs'],
              ['/evidence', 'My evidence'],
              ['/activity', 'Activity'],
              ['/settings', 'Settings'],
            ].map(([path, label]) => (
              <a
                key={path}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${route.startsWith(path) ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
                href={`#${path}`}
                aria-current={route.startsWith(path) ? 'page' : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="text-sm text-slate-400">{user.displayName}</span>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-[90rem] space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div>
            <p className="text-sm text-slate-300" role="status">
              {workspace.saveStatus}
            </p>
            {workspace.hasRecovery && (
              <button
                className="mt-1 text-sm font-bold text-cyan-300 underline"
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
        <Suspense
          fallback={
            <Panel title="Opening workspace…">
              <p role="status">Loading tools…</p>
            </Panel>
          }
        >
          {route === '/jobs' && (
            <>
              <Panel
                title="Build a stronger application from your actual work"
                description="Add a job, find supporting project evidence, review your documents, then track the next step."
              >
                <a
                  href="#/jobs/new"
                  className="inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                >
                  Prepare a new application
                </a>
                <a href="#/sample" className="ml-4 text-sm font-bold text-cyan-800 underline">
                  Explore a sample first
                </a>
              </Panel>
              <JobLibrary />
            </>
          )}
          {route === '/jobs/new' && <Workbench />}
          {match && <JobWorkspace key={match[1]} id={Number(match[1])} />}
          {route === '/evidence' && (
            <>
              <PortfolioPanel />
              <details className="rounded-xl bg-white p-5">
                <summary className="cursor-pointer font-bold text-slate-900">
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
              <ApplicationBoard />
              <details className="rounded-xl bg-white p-5">
                <summary className="cursor-pointer font-bold text-slate-900">
                  Application analytics
                </summary>
                <div className="mt-4">
                  <AnalyticsDashboard />
                </div>
              </details>
              <details className="rounded-xl bg-white p-5">
                <summary className="cursor-pointer font-bold text-slate-900">
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
            <SettingsPanel
              onSignOut={() => void signOut()}
              onDelete={() => void removeAccount()}
              busy={deletion.isPending}
            />
          )}
          {route === '/sample' && <SampleWorkspace />}
          {!match &&
            !['/jobs', '/jobs/new', '/evidence', '/activity', '/settings', '/sample'].includes(
              route,
            ) && (
              <Panel title="Page not found">
                <a className="text-cyan-800 underline" href="#/jobs">
                  Return to jobs
                </a>
              </Panel>
            )}
        </Suspense>
      </main>
    </>
  )
}

export function App(): React.JSX.Element {
  const { user, loading, login, logout, configurationError } = useAuth()
  const [sample, setSample] = useState(false)
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
      <main className="grid min-h-[100dvh] place-items-center bg-slate-950 text-white">
        <p role="status">Checking your session…</p>
      </main>
    )
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3 focus:text-slate-950"
        href="#main-content"
      >
        Skip to main content
      </a>
      {user ? (
        <SignedInWorkspace key={user.uid} user={user} logout={logout} />
      ) : (
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
          <p className="text-lg font-bold text-cyan-300">Resume Automator</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your strongest work.
            <br />
            The right application.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Choose relevant projects, support your claims with sources, and prepare an application
            you can stand behind.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => void signIn()}>Continue with Google</Button>
            <Button variant="secondary" onClick={() => setSample(!sample)}>
              {sample ? 'Close sample' : 'Explore sample workspace'}
            </Button>
          </div>
          <StatusMessage message={configurationError || loginError} tone="error" />
          {sample && (
            <div className="mt-10">
              <SampleWorkspace />
            </div>
          )}
        </main>
      )}
      <footer className="mx-auto max-w-[90rem] px-6 py-8 text-sm leading-6 text-slate-400">
        Source-backed suggestions remain drafts until you review them. Saved text stays in your
        account until you delete it.{' '}
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
