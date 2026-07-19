import { lazy, Suspense, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from './api/client'
import { Button } from './components/Button'
import { Panel } from './components/Panel'
import { StatusMessage } from './components/StatusMessage'
import { Workbench } from './components/Workbench'
import { useWorkspace } from './hooks/useWorkspace'
import { useAuth } from './hooks/useAuth'

const ApplicationBoard = lazy(() => import('./components/ApplicationBoard').then((module) => ({ default: module.ApplicationBoard })))
const JobLibrary = lazy(() => import('./components/JobLibrary').then((module) => ({ default: module.JobLibrary })))
const InterviewCoach = lazy(() => import('./components/InterviewCoach').then((module) => ({ default: module.InterviewCoach })))
const OutreachStudio = lazy(() => import('./components/OutreachStudio').then((module) => ({ default: module.OutreachStudio })))
const DiscoveryPanel = lazy(() => import('./components/DiscoveryPanel').then((module) => ({ default: module.DiscoveryPanel })))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then((module) => ({ default: module.AnalyticsDashboard })))
const EvidenceVault = lazy(() => import('./components/EvidenceVault').then((module) => ({ default: module.EvidenceVault })))

const tabs = [
  ['workbench', 'Workbench'],
  ['evidence', 'Evidence vault'],
  ['jobs', 'Job library'],
  ['applications', 'Applications'],
  ['interview', 'Interview'],
  ['outreach', 'Outreach'],
  ['discovery', 'Discovery'],
  ['analytics', 'Analytics'],
] as const

type Tab = (typeof tabs)[number][0]

export function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('workbench')
  const { user, loading, login, logout, configurationError } = useAuth()
  const queryClient = useQueryClient()
  const workspace = useWorkspace()
  const deleteAccount = useMutation({ mutationFn: api.deleteAccount })

  const clearSession = async (): Promise<void> => {
    workspace.setResumeText('')
    workspace.setJdText('')
    workspace.setSelectedJob(null)
    workspace.setAnalysis(null)
    workspace.setTailored(null)
    queryClient.clear()
    await logout()
  }

  const removeAccount = async (): Promise<void> => {
    if (!window.confirm('Delete your account and all associated Resume Automator data? This cannot be undone.')) return
    await deleteAccount.mutateAsync()
    await clearSession()
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><p role="status">Checking your session…</p></main>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a className="sr-only z-50 rounded bg-white p-3 text-slate-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3" href="#main-content">Skip to main content</a>
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Evidence first</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Resume Automator</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {user ? (
              <>
                <div className="text-right text-sm"><p className="font-bold text-white">{user.displayName}</p><p className="text-xs text-slate-400">{user.email}{user.isDevelopment ? ' · local development' : ''}</p></div>
                <Button variant="ghost" onClick={() => void clearSession()}>Sign out</Button>
                <Button variant="danger" busy={deleteAccount.isPending} onClick={() => void removeAccount()}>Delete account</Button>
              </>
            ) : <Button onClick={() => void login()}>Sign in with Google</Button>}
          </div>
        </div>
        {user && (
          <nav className="mx-auto flex max-w-[96rem] gap-1 overflow-x-auto px-4 pb-3 sm:px-6" aria-label="Primary">
            {tabs.map(([value, label]) => <button key={value} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition ${tab === value ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{label}</button>)}
          </nav>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 sm:py-8">
        <StatusMessage message={configurationError} tone="error" />
        <StatusMessage message={deleteAccount.error?.message || null} tone="error" />
        {!user ? (
          <Panel className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Private career workspace</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Tailor evidence, not facts.</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">Compare roles, review every AI-assisted change, manage applications, practice interviews, and export documents without surrendering ownership of your data.</p>
            <Button className="mt-6" onClick={() => void login()}>Continue with Google</Button>
          </Panel>
        ) : (
          <Suspense fallback={<Panel title="Loading workspace…"><p role="status">Preparing this workspace…</p></Panel>}>
            {tab === 'workbench' && <Workbench />}
            {tab === 'evidence' && <EvidenceVault />}
            {tab === 'jobs' && <JobLibrary />}
            {tab === 'applications' && <ApplicationBoard />}
            {tab === 'interview' && <InterviewCoach />}
            {tab === 'outreach' && <OutreachStudio />}
            {tab === 'discovery' && <DiscoveryPanel />}
            {tab === 'analytics' && <AnalyticsDashboard />}
          </Suspense>
        )}
      </main>
      <footer className="border-t border-slate-800 px-4 py-6 text-center text-xs leading-5 text-slate-500">AI-assisted suggestions remain drafts until you approve them. Never add a claim you cannot substantiate.</footer>
    </div>
  )
}
