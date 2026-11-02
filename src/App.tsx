import { lazy, Suspense } from 'react'
import { DemoApp } from './components/DemoApp'

const CareerApp = lazy(() => import('./CareerApp').then((module) => ({ default: module.CareerApp })))

export function App(): React.JSX.Element {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return <DemoApp />
  return (
    <Suspense fallback={<main><p role="status">Opening your workspace…</p></main>}>
      <CareerApp />
    </Suspense>
  )
}
