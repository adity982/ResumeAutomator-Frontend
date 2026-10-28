import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function NextActions(): React.JSX.Element {
  const queue = useQuery({
    queryKey: ['work-queue'],
    queryFn: api.workQueue,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })
  return (
    <Panel
      title="Your next steps"
      description="Deadlines first, then due follow-ups, changed evidence and unfinished packages. Nothing is sent automatically."
    >
      {queue.isLoading && <p role="status">Checking your saved work…</p>}
      <StatusMessage message={queue.error?.message || null} tone="error" />
      {queue.data && !queue.data.items.length && (
        <p className="text-slate-600">
          No upcoming deadlines or due tasks in the checked work. Open a saved job to continue
          preparing it.
        </p>
      )}
      <ol className="divide-y divide-slate-200">
        {queue.data?.items.map((item) => (
          <li key={item.key} className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:justify-between">
            <div className="min-w-0 flex-1">
              <a href={item.href} className="break-words font-bold text-cyan-800 underline">
                {item.title}
              </a>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </div>
            {item.due_at && (
              <time
                dateTime={item.due_at}
                className={`text-sm ${item.overdue ? 'font-bold text-amber-900' : 'text-slate-600'}`}
              >
                {item.overdue ? 'Overdue · ' : ''}
                {new Date(item.due_at).toLocaleString()}
              </time>
            )}
          </li>
        ))}
      </ol>
      {queue.data?.has_more && (
        <p className="mt-3 text-sm text-slate-600">
          More actions remain. Open Activity for your applications and task list.
        </p>
      )}
      {queue.data && (
        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer">What this checks</summary>
          <p className="mt-2">{queue.data.scope}</p>
        </details>
      )}
    </Panel>
  )
}
