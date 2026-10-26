import { lazy, Suspense, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { workspaceInputKey } from '../utils/workspace'
import { useWorkspace } from '../hooks/useWorkspace'
import { Button } from './Button'
import { Panel } from './Panel'
import { ResumeEditor } from './ResumeEditor'
import { StatusMessage } from './StatusMessage'

const AnalysisPanel = lazy(() =>
  import('./AnalysisPanel').then((module) => ({ default: module.AnalysisPanel })),
)
const ComparisonPanel = lazy(() =>
  import('./ComparisonPanel').then((module) => ({ default: module.ComparisonPanel })),
)
const DocumentPreview = lazy(() =>
  import('./DocumentPreview').then((module) => ({ default: module.DocumentPreview })),
)

export function Workbench(): React.JSX.Element {
  const {
    resumeText,
    setResumeText,
    jdText,
    setJdText,
    selectedJob,
    setSelectedJob,
    analysis,
    setAnalysis,
    tailored,
    setTailored,
    data,
    updateData,
  } = useWorkspace()
  const [sourceMode, setSourceMode] = useState<'url' | 'manual'>('manual')
  const url = data.target_url
  const jobTitle = data.target_title
  const company = data.target_company
  const setUrl = (value: string): void => updateData({ target_url: value })
  const setJobTitle = (value: string): void => updateData({ target_title: value })
  const setCompany = (value: string): void => updateData({ target_company: value })
  const [confirmedFacts, setConfirmedFacts] = useState<string[]>([])
  const coverLetter = data.cover_letter
  const setCoverLetter = (value: string): void => updateData({ cover_letter: value })
  const queryClient = useQueryClient()
  const evidence = useQuery({ queryKey: ['evidence'], queryFn: api.listEvidence })
  const verifiedTags = [
    ...new Set((evidence.data || []).filter((item) => item.verified).flatMap((item) => item.tags)),
  ]

  const upload = useMutation({
    mutationFn: api.parseResume,
    onSuccess: (result) => setResumeText(result.extracted_data.raw_content),
  })
  const scrape = useMutation({
    mutationFn: api.scrapeJob,
    onSuccess: (result) => {
      setJdText(result.description)
      setJobTitle(result.title)
      setUrl(result.source_url)
    },
  })
  const saveJob = useMutation({
    mutationFn: () =>
      api.createJob({
        title: jobTitle,
        company,
        source_url: url,
        description: jdText,
        extraction_method: sourceMode === 'url' ? 'scrape' : 'manual',
      }),
    onSuccess: (job) => {
      setSelectedJob(job)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      window.location.hash = `#/jobs/${job.id}/prepare`
    },
  })
  const analyze = useMutation({
    mutationFn: ({ input }: { input: typeof data }) =>
      api.analyze({
        resume_text: input.resume_text,
        jd_text: input.jd_text,
        job_id: input.selected_job_id || undefined,
      }),
    onSuccess: (result, { input }) => {
      setAnalysis(result, workspaceInputKey(input))
      setConfirmedFacts([])
      setTailored(null, workspaceInputKey(input))
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
  const tailor = useMutation({
    mutationFn: ({ input }: { input: typeof data }) =>
      api.tailor({
        resume_text: input.resume_text,
        jd_text: input.jd_text,
        confirmed_facts: [],
        evidence_ids: input.evidence_ids,
      }),
    onSuccess: (result, { input }) => setTailored(result, workspaceInputKey(input)),
  })
  const letter = useMutation({
    mutationFn: ({ input }: { input: typeof data }) =>
      api.coverLetter({
        resume_text: input.resume_text,
        jd_text: input.jd_text,
        company: input.target_company,
        role: input.target_title,
      }),
    onSuccess: (result, { input }) =>
      updateData({ cover_letter: result.text }, workspaceInputKey(input)),
  })

  const ready = resumeText.trim().length >= 30 && jdText.trim().length >= 30
  const errors =
    upload.error || scrape.error || saveJob.error || analyze.error || tailor.error || letter.error

  const rejectPhrase = (phrase: string): void => {
    if (!tailored) return
    setTailored({
      ...tailored,
      tailored: tailored.tailored.replace(phrase, ''),
      added_phrases: tailored.added_phrases.filter((item) => item !== phrase),
      citations: tailored.citations?.filter((item) => item.statement !== phrase),
    })
    updateData({
      evidence_ids: (tailored.citations || [])
        .filter((item) => item.statement !== phrase)
        .map((item) => item.evidence_id),
    })
    setConfirmedFacts((current) => current.filter((item) => item !== phrase))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="1. Resume evidence"
          description="PDF bytes are parsed in memory. Saved progress and document versions retain text in your account."
        >
          <label className="block text-sm font-bold text-slate-700">
            Upload a selectable-text PDF
            <input
              className="mt-2 block w-full rounded-xl border border-slate-300 p-3 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-bold file:text-white"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) upload.mutate(file)
              }}
            />
          </label>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Parsed resume — editable
            <textarea
              className="mt-2 h-72 w-full rounded-xl border border-slate-300 p-4 font-mono text-sm leading-6 focus:ring-2 focus:ring-cyan-500"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Upload a PDF or paste resume text here."
            />
          </label>
          <StatusMessage
            message={
              upload.isPending
                ? 'Parsing PDF…'
                : upload.isSuccess
                  ? 'Resume parsed without retaining the file.'
                  : upload.error?.message || null
            }
            tone={upload.error ? 'error' : upload.isSuccess ? 'success' : 'info'}
          />
        </Panel>

        <Panel
          title="2. Target job"
          description="Paste a job description or fetch a public posting. Save the target before choosing project evidence."
        >
          <div
            className="mb-4 flex rounded-xl bg-slate-100 p-1"
            role="group"
            aria-label="Job source"
          >
            {(['manual', 'url'] as const).map((mode) => (
              <button
                key={mode}
                className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-bold ${sourceMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
                aria-pressed={sourceMode === mode}
                onClick={() => setSourceMode(mode)}
              >
                {mode === 'manual' ? 'Paste text' : 'Fetch URL'}
              </button>
            ))}
          </div>
          {sourceMode === 'url' && (
            <div className="mb-4 flex gap-2">
              <label className="flex-1 text-sm font-bold text-slate-700">
                Public job URL
                <input
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </label>
              <Button
                className="self-end"
                busy={scrape.isPending}
                disabled={!url}
                onClick={() => scrape.mutate(url)}
              >
                Fetch
              </Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Role
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Company
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-700">
            Job description
            <textarea
              className="mt-2 h-56 w-full rounded-xl border border-slate-300 p-4 text-sm leading-6 focus:ring-2 focus:ring-cyan-500"
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder="Paste at least 30 characters."
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={jdText.length < 30 || !jobTitle}
              busy={saveJob.isPending}
              onClick={() => saveJob.mutate()}
            >
              {selectedJob ? 'Save new snapshot' : 'Save target'}
            </Button>
            <Button
              disabled={!ready}
              busy={analyze.isPending}
              onClick={() => analyze.mutate({ input: data })}
            >
              Analyze evidence
            </Button>
          </div>
          <StatusMessage
            message={
              selectedJob
                ? `Using saved job snapshot v${selectedJob.version}: ${selectedJob.title}`
                : null
            }
            tone="success"
          />
        </Panel>
      </div>

      <StatusMessage message={errors?.message || null} tone="error" />

      {verifiedTags.length > 0 && (
        <Panel
          title="Your self-attested evidence tags"
          description="Tags help you organize claims. They are not inserted into resumes as proof of experience."
        >
          <div className="flex flex-wrap gap-2">
            {verifiedTags.map((tag) => (
              <button
                key={tag}
                className={`rounded-full border px-3 py-2 text-sm font-bold ${confirmedFacts.includes(tag) ? 'border-cyan-700 bg-cyan-700 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
                aria-pressed={confirmedFacts.includes(tag)}
                onClick={() =>
                  setConfirmedFacts((current) =>
                    current.includes(tag)
                      ? current.filter((item) => item !== tag)
                      : [...current, tag],
                  )
                }
              >
                {tag}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {analysis && (
        <Suspense fallback={<Panel title="Loading analysis view…" />}>
          <AnalysisPanel
            analysis={analysis}
            confirmedFacts={confirmedFacts}
            onToggleFact={(keyword) =>
              setConfirmedFacts((current) =>
                current.includes(keyword)
                  ? current.filter((item) => item !== keyword)
                  : [...current, keyword],
              )
            }
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button busy={tailor.isPending} onClick={() => tailor.mutate({ input: data })}>
              Create reviewable draft
            </Button>
            {selectedJob && (
              <a
                className="rounded-xl border border-slate-500 px-4 py-3 text-sm font-bold text-white"
                href={`#/jobs/${selectedJob.id}/projects`}
              >
                Choose project evidence
              </a>
            )}
            <Button
              variant="secondary"
              busy={letter.isPending}
              onClick={() => letter.mutate({ input: data })}
            >
              Generate cover letter
            </Button>
          </div>
        </Suspense>
      )}

      {tailored && (
        <ResumeEditor
          key={`${tailored.added_phrases.join('-')}-${tailored.original.length}`}
          result={tailored}
          onChange={(value) => setTailored({ ...tailored, tailored: value })}
          onRejectPhrase={rejectPhrase}
        />
      )}

      {coverLetter && (
        <Panel
          title="Cover letter"
          description="Edit the generated draft before saving or exporting."
        >
          <textarea
            className="h-80 w-full rounded-xl border border-slate-300 p-4 text-sm leading-6"
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
          />
          <Suspense fallback={<p role="status">Loading preview…</p>}>
            <DocumentPreview kind="cover_letter" />
          </Suspense>
        </Panel>
      )}

      {tailored && (
        <Suspense fallback={<Panel title="Loading preview…" />}>
          <DocumentPreview />
        </Suspense>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-black text-slate-950">
          Compare multiple jobs
        </summary>
        <div className="mt-5">
          <Suspense fallback={<p role="status">Loading comparison tools…</p>}>
            <ComparisonPanel />
          </Suspense>
        </div>
      </details>
    </div>
  )
}
