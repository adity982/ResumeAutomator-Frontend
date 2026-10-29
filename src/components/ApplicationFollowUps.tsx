import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Button } from './Button'
import { StatusMessage } from './StatusMessage'

export function ApplicationFollowUps({
  applicationId,
  role,
}: {
  applicationId: number
  role: string
}): React.JSX.Element {
  const [due, setDue] = useState('')
  const [title, setTitle] = useState(`Review follow-up for ${role}`.slice(0, 240))
  const client = useQueryClient()
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: api.listTasks })
  const refresh = (): void => {
    client.invalidateQueries({ queryKey: ['tasks'] })
    client.invalidateQueries({ queryKey: ['work-queue'] })
  }
  const create = useMutation({
    mutationFn: () =>
      api.createTask({
        application_id: applicationId,
        task_type: 'follow_up',
        title,
        due_at: new Date(due).toISOString(),
      }),
    onSuccess: () => {
      setDue('')
      refresh()
    },
  })
  const complete = useMutation({
    mutationFn: (id: number) => api.updateTask(id, { completed: true }),
    onSuccess: refresh,
  })
  return (
    <section className="mt-6 border-t border-ink-200 pt-5">
      <h3 className="font-medium text-ink-900">Plan your next follow-up</h3>
      <p className="mt-1 text-sm text-ink-600">
        Set your own reminder. Review any reply and the contact’s preferences before reaching out;
        the app sends nothing.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Reminder title
          <input
            className="mt-1 block min-h-11 w-full rounded-lg border border-ink-300 p-2"
            maxLength={240}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Reminder time (your local time)
          <input
            type="datetime-local"
            className="mt-1 block min-h-11 max-w-full rounded-lg border border-ink-300 p-2"
            value={due}
            onChange={(event) => setDue(event.target.value)}
          />
        </label>
        <Button
          disabled={!title.trim() || !due || Number.isNaN(new Date(due).getTime())}
          busy={create.isPending}
          onClick={() => create.mutate()}
        >
          Save reminder
        </Button>
      </div>
      <StatusMessage
        message={tasks.error?.message || create.error?.message || complete.error?.message || null}
        tone="error"
      />
      {create.isSuccess && (
        <p role="status" className="mt-2 text-sm text-ink-600">
          Reminder saved. It will appear in Your next steps when due within seven days.
        </p>
      )}
      <ul className="mt-3 divide-y divide-ink-200">
        {(tasks.data || [])
          .filter((task) => task.application_id === applicationId && !task.completed_at)
          .map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <span className="min-w-0 break-words">
                {task.title} · {new Date(task.due_at).toLocaleString()}
              </span>
              <Button
                variant="secondary"
                busy={complete.isPending}
                onClick={() => complete.mutate(task.id)}
              >
                Mark reminder done
              </Button>
            </li>
          ))}
      </ul>
    </section>
  )
}
