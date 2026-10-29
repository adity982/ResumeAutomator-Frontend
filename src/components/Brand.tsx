export function Brand({ href = '#/jobs' }: { href?: string }): React.JSX.Element {
  return (
    <a href={href} className="brand" aria-label="Resume Automator home">
      <span className="brand-mark" aria-hidden="true">
        r.
      </span>
      <span>Resume Automator</span>
    </a>
  )
}
