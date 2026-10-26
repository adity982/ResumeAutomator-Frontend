import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { InterviewSession } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function InterviewCoach(): React.JSX.Element {
  const { resumeText, jdText, selectedJob } = useWorkspace()
  const [type, setType] = useState<'behavioral' | 'technical' | 'mixed'>('mixed')
  const [active, setActive] = useState<InterviewSession | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const queryClient = useQueryClient()
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: api.listJobs })
  const history = useQuery({ queryKey: ['interviews'], queryFn: api.listInterviews })
  const selectedJobExists =
    !selectedJob || jobs.isLoading || (jobs.data || []).some((job) => job.id === selectedJob.id)
  const create = useMutation({
    mutationFn: () =>
      api.createInterview({
        resume_text: resumeText,
        jd_text: jdText,
        interview_type: type,
        job_id: selectedJobExists ? selectedJob?.id : undefined,
      }),
    onSuccess: (session) => {
      setActive(session)
      setAnswers({})
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
  })
  const submit = useMutation({
    mutationFn: ({
      sessionId,
      index,
      answer,
    }: {
      sessionId: number
      index: number
      answer: string
    }) => api.answerInterview(sessionId, index, answer),
    onSuccess: (session) => {
      setActive(session)
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
  })

  const ready = resumeText.length >= 30 && jdText.length >= 30
  const talkingPoints = active ? [...new Set(active.prep_brief.talking_points)] : []
  const riskAreas = active ? [...new Set(active.prep_brief.risk_areas)] : []
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <Panel
        title="Interview practice"
        description="Practice with role context and a transparent checklist. Feedback is not a calibrated assessment or verification of your claims."
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-bold text-slate-700">
            Interview type
            <select
              className="mt-1 block min-h-11 rounded-xl border border-slate-300 px-3"
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
            >
              <option value="mixed">Mixed</option>
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical</option>
            </select>
          </label>
          <Button disabled={!ready} busy={create.isPending} onClick={() => create.mutate()}>
            Start session
          </Button>
        </div>
        {!ready && (
          <StatusMessage message="Add resume and job-description evidence in the Workbench first." />
        )}
        {!selectedJobExists && (
          <StatusMessage message="The previously selected saved job was removed. This session will use the resume and job-description text still in your Workbench instead." />
        )}
        <StatusMessage
          message={create.error?.message || submit.error?.message || null}
          tone="error"
        />
        {active && (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <section className="rounded-xl bg-cyan-50 p-4 text-sm text-cyan-950">
                <h3 className="font-black">
                  Preparation brief · {active.prep_brief.estimated_minutes} minutes
                </h3>
                <p className="mt-2 font-bold">Talking points</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {talkingPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs">{active.prep_brief.evidence_reminder}</p>
              </section>
              <section className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                <h3 className="font-black">Prepare for evidence gaps</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {riskAreas.map((item) => (
                    <span key={item} className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-3 font-bold">Questions to ask</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {active.prep_brief.questions_to_ask.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
            <ol className="mt-5 space-y-5">
              {active.questions.map((question, index) => {
                const saved = active.answers.find((item) => item.question_index === index)
                return (
                  <li key={question.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-700">
                      {question.type}
                    </p>
                    <h3 className="mt-1 font-black text-slate-950">{question.question}</h3>
                    <label className="mt-3 block text-sm font-bold text-slate-700">
                      Your answer
                      <textarea
                        className="mt-1 h-36 w-full rounded-xl border border-slate-300 p-3 font-normal leading-6"
                        value={answers[index] ?? saved?.answer ?? ''}
                        onChange={(event) =>
                          setAnswers((current) => ({ ...current, [index]: event.target.value }))
                        }
                      />
                    </label>
                    <Button
                      className="mt-2"
                      disabled={(answers[index] ?? saved?.answer ?? '').trim().length < 10}
                      busy={submit.isPending}
                      onClick={() =>
                        submit.mutate({
                          sessionId: active.id,
                          index,
                          answer: answers[index] ?? saved?.answer ?? '',
                        })
                      }
                    >
                      Score answer
                    </Button>
                    {saved && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
                        <p className="font-bold">
                          Practice checklist {saved.feedback.score.toFixed(0)} / 100
                        </p>
                        <p className="mt-1">{saved.feedback.feedback}</p>
                        <p className="mt-2">{saved.feedback.follow_up}</p>
                        <p className="mt-2 text-xs">{saved.feedback.limitations}</p>
                        <p className="mt-2 text-xs">
                          <strong>Stronger outline:</strong>{' '}
                          {saved.feedback.stronger_answer_outline}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </Panel>
      <Panel title="Session history">
        <ul className="space-y-2">
          {(history.data || []).map((session) => (
            <li key={session.id}>
              <button
                className="w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                onClick={() => {
                  setActive(session)
                  setAnswers({})
                }}
              >
                <span className="block font-bold capitalize">{session.interview_type}</span>
                <span className="text-xs text-slate-500">
                  {session.status} · {session.answers.length}/{session.questions.length} answered
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
