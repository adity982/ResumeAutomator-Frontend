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
      className={`panel ${className}`}
    >
      {(title || description || action) && (
        <header className="panel-header">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {description && (
              <p className="panel-description">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
