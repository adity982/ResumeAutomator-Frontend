interface StatusMessageProps {
  message: string | null
  tone?: 'info' | 'success' | 'error'
}

const tones = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
} as const

export function StatusMessage({ message, tone = 'info' }: StatusMessageProps): React.JSX.Element | null {
  if (!message) return null
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message}
    </p>
  )
}
