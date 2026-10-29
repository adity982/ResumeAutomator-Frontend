import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { OutreachKit } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'
import { ContactsPanel } from './ContactsPanel'

export function OutreachStudio(): React.JSX.Element {
  const { resumeText, jdText, selectedJob } = useWorkspace()
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState('Recruiter')
  const [company, setCompany] = useState(selectedJob?.company || '')
  const [tone, setTone] = useState('professional')
  const [callToAction, setCallToAction] = useState('a brief 10-minute conversation')
  const [active, setActive] = useState<OutreachKit | null>(null)
  const [copied, setCopied] = useState('')
  const [contactId, setContactId] = useState<number | undefined>(undefined)
  const queryClient = useQueryClient()
  const history = useQuery({ queryKey: ['outreach'], queryFn: api.listOutreach })
  const create = useMutation({
    mutationFn: () =>
      api.createOutreach({
        resume_text: resumeText,
        jd_text: jdText,
        recipient_name: recipientName,
        recipient_role: recipientRole,
        company,
        tone,
        call_to_action: callToAction,
        job_id: selectedJob?.id,
        contact_id: contactId,
      }),
    onSuccess: (kit) => {
      setActive(kit)
      queryClient.invalidateQueries({ queryKey: ['outreach'] })
    },
  })
  const save = useMutation({
    mutationFn: () =>
      api.updateOutreach(active!.id, active!.revision, {
        variants: active!.variants,
        status: active!.status,
      }),
    onSuccess: (kit) => {
      setActive(kit)
      queryClient.invalidateQueries({ queryKey: ['outreach'] })
    },
  })
  const copy = async (label: string, value: string): Promise<void> => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
  }
  const ready = resumeText.length >= 30 && jdText.length >= 30

  return (
    <div className="space-y-5">
      <ContactsPanel
        onSelect={(contact) => {
          setContactId(contact.id)
          setRecipientName(contact.name)
          setRecipientRole(contact.role)
          setCompany(contact.company)
        }}
      />
      <Panel
        title="Networking outreach kit"
        description="Generate editable variants for each channel. Nothing is sent automatically."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium text-ink-700">
            Recipient name
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Recipient role
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={recipientRole}
              onChange={(event) => setRecipientRole(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Company
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Tone
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="warm">Warm</option>
              <option value="concise">Concise</option>
            </select>
          </label>
          <label className="text-sm font-medium text-ink-700 md:col-span-2">
            Call to action
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-ink-300 px-3"
              value={callToAction}
              onChange={(event) => setCallToAction(event.target.value)}
            />
          </label>
        </div>
        <Button
          className="mt-3"
          disabled={!ready}
          busy={create.isPending}
          onClick={() => create.mutate()}
        >
          Create kit
        </Button>
        {!ready && (
          <StatusMessage message="Add resume and job-description evidence in the Workbench first." />
        )}
        <StatusMessage
          message={
            create.error?.message ||
            save.error?.message ||
            history.error?.message ||
            (copied ? `${copied} copied to clipboard.` : null)
          }
          tone={create.error || save.error || history.error ? 'error' : 'success'}
        />
      </Panel>
      {active && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={`Saved outreach draft · revision ${active.revision}`}
            className="lg:col-span-2"
          >
            <label className="text-sm font-medium">
              Manual delivery status
              <select
                className="ml-3 rounded-lg border border-ink-300 p-2"
                value={active.status}
                onChange={(event) =>
                  setActive({ ...active, status: event.target.value as OutreachKit['status'] })
                }
              >
                {['draft', 'sent', 'replied', 'closed'].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <Button className="ml-3" busy={save.isPending} onClick={() => save.mutate()}>
              Save edits and status
            </Button>
            <p className="mt-3 text-sm text-ink-500">
              Status is recorded by you. The app does not send messages or read LinkedIn replies.
            </p>
          </Panel>
          {(
            [
              'recruiter_email',
              'hiring_manager_note',
              'referral_request',
              'linkedin_message',
            ] as const
          ).map((field) => (
            <Panel
              key={field}
              title={field.replaceAll('_', ' ')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => void copy(field, active.variants[field])}
                >
                  Copy
                </Button>
              }
            >
              <label className="text-sm font-medium">
                Edit {field.replaceAll('_', ' ')}
                <textarea
                  className="mt-2 h-48 w-full rounded-lg border border-ink-300 p-3 font-normal leading-6"
                  value={active.variants[field]}
                  onChange={(event) =>
                    setActive({
                      ...active,
                      variants: { ...active.variants, [field]: event.target.value },
                    })
                  }
                />
              </label>
            </Panel>
          ))}
          <Panel title="Follow-up sequence" className="lg:col-span-2">
            <ol className="space-y-3">
              {active.variants.follow_ups.map((value, index) => (
                <li key={value} className="rounded-lg bg-ink-50 p-3 text-sm">
                  <strong>Follow-up {index + 1}:</strong> {value}{' '}
                  <button
                    className="ml-2 font-medium text-brand-700 underline"
                    onClick={() => void copy(`Follow-up ${index + 1}`, value)}
                  >
                    Copy
                  </button>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
      <Panel title="Saved kits">
        <div className="flex flex-wrap gap-2">
          {(history.data || []).map((kit) => (
            <button
              key={kit.id}
              className="rounded-full border border-ink-300 px-3 py-2 text-sm font-medium hover:bg-ink-50"
              onClick={() => setActive(kit)}
            >
              {kit.company || 'Untitled'} · {kit.recipient_role}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}
