import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useWorkspace } from '../hooks/useWorkspace'
import type { Contact } from '../types'
import { Button } from './Button'
import { Panel } from './Panel'
import { StatusMessage } from './StatusMessage'

export function ContactsPanel({
  onSelect,
}: {
  onSelect: (contact: Contact) => void
}): React.JSX.Element {
  const { selectedJob } = useWorkspace()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [relationship, setRelationship] = useState('')
  const [signal, setSignal] = useState('')
  const [signalUrl, setSignalUrl] = useState('')
  const [observed, setObserved] = useState('')
  const [followUp, setFollowUp] = useState('')
  const client = useQueryClient()
  const contacts = useQuery({
    queryKey: ['contacts', selectedJob?.id],
    queryFn: () => api.contacts(selectedJob?.id),
  })
  const create = useMutation({
    mutationFn: () =>
      api.createContact({
        job_id: selectedJob?.id || null,
        name,
        role,
        company: selectedJob?.company || '',
        linkedin_url: url,
        relationship,
        hiring_signal: signal,
        signal_url: signalUrl,
        signal_observed_at: observed ? new Date(observed).toISOString() : null,
        status: 'saved',
        follow_up_at: followUp ? new Date(followUp).toISOString() : null,
        stop_follow_up: false,
      }),
    onSuccess: () => {
      setName('')
      setRole('')
      setUrl('')
      setSignal('')
      setSignalUrl('')
      setRelationship('')
      setObserved('')
      setFollowUp('')
      client.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
  const update = useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: number
      status?: Contact['status']
      stop_follow_up?: boolean
    }) => api.updateContact(id, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: ['contacts'] }),
  })
  const remove = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: () => client.invalidateQueries({ queryKey: ['contacts'] }),
  })
  return (
    <Panel
      title="People and hiring context"
      description="Save contacts you find yourself. A company affiliation is not proof that someone is hiring; attach a dated hiring signal when you have one."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Contact name', name, setName],
          ['Contact role', role, setRole],
          ['LinkedIn profile URL', url, setUrl],
          ['How you know them', relationship, setRelationship],
          ['Hiring signal source URL', signalUrl, setSignalUrl],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="text-sm font-medium">
            {label as string}
            <input
              className="mt-2 w-full rounded-lg border border-ink-300 p-3 font-normal"
              value={value as string}
              onChange={(event) => (setter as (v: string) => void)(event.target.value)}
            />
          </label>
        ))}
        <label className="text-sm font-medium">
          Hiring signal observed on
          <input
            className="mt-2 w-full rounded-lg border border-ink-300 p-3"
            type="date"
            value={observed}
            onChange={(event) => setObserved(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          What explicitly indicates hiring?
          <textarea
            className="mt-2 h-24 w-full rounded-lg border border-ink-300 p-3 font-normal"
            value={signal}
            onChange={(event) => setSignal(event.target.value)}
            placeholder="For example, a post inviting applications. Leave blank if unknown."
          />
        </label>
        <label className="text-sm font-medium">
          Follow-up date
          <input
            className="mt-2 w-full rounded-lg border border-ink-300 p-3"
            type="datetime-local"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
          />
        </label>
      </div>
      <Button
        className="mt-4"
        disabled={!name.trim()}
        busy={create.isPending}
        onClick={() => create.mutate()}
      >
        Save contact
      </Button>
      <StatusMessage
        message={
          create.error?.message ||
          update.error?.message ||
          contacts.error?.message ||
          remove.error?.message ||
          null
        }
        tone="error"
      />
      <div className="mt-5 space-y-4">
        {(contacts.data || []).map((contact) => (
          <article key={contact.id} className="rounded-lg border border-ink-200 p-4">
            <h3 className="font-medium">
              {contact.name} · {contact.role || 'Role unknown'}
            </h3>
            <p className="mt-2 text-sm text-ink-600">
              {contact.hiring_signal
                ? `User-recorded signal: ${contact.hiring_signal}`
                : 'Hiring status unknown'}
            </p>
            {contact.signal_url && (
              <a
                className="mt-2 block text-sm text-brand-800 underline"
                href={contact.signal_url}
                target="_blank"
                rel="noreferrer"
              >
                Hiring signal source
                {contact.signal_observed_at
                  ? ` · ${new Date(contact.signal_observed_at).toLocaleDateString()}`
                  : ''}
              </a>
            )}
            {contact.follow_up_at && !contact.stop_follow_up && (
              <p className="mt-2 text-sm">
                Follow up: {new Date(contact.follow_up_at).toLocaleString()}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => onSelect(contact)}>
                Use in outreach draft
              </Button>
              {contact.linkedin_url && (
                <a
                  className="text-sm font-medium text-brand-800 underline"
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open LinkedIn manually
                </a>
              )}
              <label className="text-sm">
                Contact status
                <select
                  className="ml-2 rounded-lg border border-ink-300 p-2"
                  value={contact.status}
                  onChange={(event) =>
                    update.mutate({
                      id: contact.id,
                      status: event.target.value as Contact['status'],
                    })
                  }
                >
                  {['saved', 'contacted', 'replied', 'closed'].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <Button
                variant="ghost"
                onClick={() =>
                  update.mutate({ id: contact.id, stop_follow_up: !contact.stop_follow_up })
                }
              >
                {contact.stop_follow_up ? 'Resume follow-up' : 'Stop follow-up'}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm('Delete this contact?')) remove.mutate(contact.id)
                }}
              >
                Delete contact
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
