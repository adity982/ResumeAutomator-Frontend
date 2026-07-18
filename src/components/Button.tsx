import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  busy?: boolean
}

const variants = {
  primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 focus-visible:outline-cyan-300',
  secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus-visible:outline-slate-400',
  danger: 'bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-300',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/10 focus-visible:outline-slate-400',
} as const

export function Button({ children, variant = 'primary', busy = false, className = '', disabled, ...props }: PropsWithChildren<ButtonProps>): React.JSX.Element {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy}
      {...props}
    >
      {busy ? 'Working…' : children}
    </button>
  )
}
