import { Welcome } from './Welcome'

export function DemoApp(): React.JSX.Element {
  return (
    <div className="app-root">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to main content
      </a>
      <Welcome demoMode error={null} onSignIn={() => undefined} />
      <footer className="site-footer">
        <p>Demo only. Fictional examples run in this tab. No uploads, account storage or live retrieval.</p>
        <a className="underline" href="https://github.com/adity982/ResumeAutomator-Frontend/tree/feat/evidence-career-workspace">
          View the project on GitHub
        </a>
      </footer>
    </div>
  )
}
