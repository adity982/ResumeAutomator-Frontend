import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function Panel({
  title,
  description,
  action,
  className = '',
  children,
}: PropsWithChildren<PanelProps>): React.JSX.Element {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm ${className}`}
    >
      {(title || description || action) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-black text-slate-950">{title}</h2>}
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
