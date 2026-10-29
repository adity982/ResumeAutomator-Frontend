import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function PilotFeedback(): React.JSX.Element {
  const { selectedJob } = useWorkspace()
  const [task, setTask] = useState('prepare_application')
  const [rating, setRating] = useState(3)
  const [comment, setComment] = useState('')
  const [completed, setCompleted] = useState(false)
  const submit = useMutation({
    mutationFn: () =>
      api.feedback({
        job_id: selectedJob?.id,
        task,
        rating,
        comment,
        completed_without_help: completed,
      }),
  })
  return (
    <Panel
      title="Help improve the pilot"
      description="Record how the workflow worked for you. Avoid personal contact details or confidential information in comments."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Task tried
          <select
            className="mt-2 block w-full rounded-lg border border-ink-300 p-3"
            value={task}
            onChange={(event) => setTask(event.target.value)}
          >
            <option value="prepare_application">Prepare application</option>
            <option value="import">Import projects</option>
            <option value="choose_projects">Choose projects</option>
            <option value="outreach">Prepare outreach</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Usefulness
          <select
            className="mt-2 block w-full rounded-lg border border-ink-300 p-3"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-2">
          What was confusing or missing?
          <textarea
            className="mt-2 h-24 w-full rounded-lg border border-ink-300 p-3 font-normal"
            maxLength={2000}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={completed}
          onChange={(event) => setCompleted(event.target.checked)}
        />
        I completed this task without help
      </label>
      <Button className="mt-4" busy={submit.isPending} onClick={() => submit.mutate()}>
        Save pilot feedback
      </Button>
      <StatusMessage
        message={
          submit.error?.message ||
          (submit.isSuccess
            ? 'Your feedback is saved with your account and included in your data export.'
            : null)
        }
        tone={submit.error ? 'error' : 'success'}
      />
    </Panel>
  )
}
