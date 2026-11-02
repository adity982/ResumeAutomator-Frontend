import { useEffect, useState } from 'react'
import { Brand } from './Brand'
import { Button } from './Button'
import { SampleWorkspace } from './SampleWorkspace'
import { StatusMessage } from './StatusMessage'

export function Welcome({
  onSignIn,
  error,
  signInAvailable = true,
  demoMode = false,
}: {
  onSignIn: () => void
  error: string | null
  signInAvailable?: boolean
  demoMode?: boolean
}): React.JSX.Element {
  const [sample, setSample] = useState(demoMode && window.location.hash === '#/sample')
  useEffect(() => {
    if (sample) {
      const sampleSection = document.getElementById('welcome-sample')
      sampleSection?.scrollIntoView({ block: 'start' })
      sampleSection?.focus({ preventScroll: true })
    }
  }, [sample])
  return (
    <>
      <header className="site-header">
        <div className="header-inner landing-nav">
          <Brand href="/" />
          <a
            className="text-link"
            href="#how-it-works"
            onClick={(event) => {
              event.preventDefault()
              document.getElementById('how-it-works')?.scrollIntoView()
            }}
          >
            How it works
          </a>
          {demoMode ? (
            <a className="text-link" href="https://github.com/adity982/ResumeAutomator-Frontend/tree/feat/evidence-career-workspace">
              View source ↗
            </a>
          ) : (
            <Button variant="secondary" onClick={onSignIn} disabled={!signInAvailable}>
              Sign in
            </Button>
          )}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="landing-main">
        <section className="landing-hero">
          <p className="eyebrow">{demoMode ? 'Interactive demo · no account needed' : 'Your experience. In your own words.'}</p>
          <h1>
            <span>Your work,</span>
            <br />
            <em>well represented.</em>
          </h1>
          <p className="hero-copy">
            Turn the projects you’ve built into applications you can stand behind.
          </p>
          {demoMode && (
            <p className="mt-5 text-sm leading-7 text-ink-600">
              Try a fictional role, inspect its evidence and review a sample bullet.
              Saved accounts, GitHub imports and live AI retrieval are not enabled in this demo.
            </p>
          )}
          <div className="home-actions">
            {!demoMode && (
              <Button onClick={onSignIn} disabled={!signInAvailable}>
                Continue with Google <span aria-hidden="true">↗</span>
              </Button>
            )}
            <button
              className={demoMode ? 'ui-button button-primary' : 'text-link'}
              onClick={() => setSample((open) => !open)}
              aria-expanded={sample}
              aria-controls="welcome-sample"
            >
              {sample ? 'Close sample' : demoMode ? 'Explore the demo' : 'Explore sample workspace'}
            </button>
          </div>
          <p className="mt-5 text-xs text-ink-500">Your experience. Your words. Your final say.</p>
          <StatusMessage message={error} tone="error" />
        </section>
        <div className="journey-rail" aria-label="Application workflow">
          <span>
            <b>01</b> Save a target
          </span>
          <span>
            <b>02</b> Find the evidence
          </span>
          <span>
            <b>03</b> Make it yours
          </span>
          <span>
            <b>04</b> Follow through
          </span>
        </div>
        <section id="how-it-works" className="welcome-note">
          <h2>
            Less starting over.
            <br />
            More moving forward.
          </h2>
          <p>
            {demoMode ? 'The full workspace is designed to keep a job, its supporting work and reviewed resume together. This demo shows the evidence-review step with fictional examples; it does not save an application.' : 'Keep the job, the work that supports it and the resume you actually sent in one place. Reuse what fits. Review what changed. Pick up where you left off.'}
          </p>
        </section>
        {sample && (
          <div id="welcome-sample" tabIndex={-1}>
            <SampleWorkspace />
          </div>
        )}
      </main>
    </>
  )
}
