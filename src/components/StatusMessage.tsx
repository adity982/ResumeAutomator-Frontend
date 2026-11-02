interface StatusMessageProps {
  message: string | null
  tone?: 'info' | 'success' | 'error'
}

const tones = {
  info: 'status-info',
  success: 'status-success',
  error: 'status-error',
} as const

export function StatusMessage({ message, tone = 'info' }: StatusMessageProps): React.JSX.Element | null {
  if (!message) return null
  return (
    <p className={`status-message ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message}
    </p>
  )
}
