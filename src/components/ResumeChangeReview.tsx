import { reviewResumeChanges } from '../utils/resumeReview'

export function ResumeChangeReview({
  original,
  draft,
}: {
  original: string
  draft: string
}): React.JSX.Element {
  const review = reviewResumeChanges(original, draft)
  return (
    <details
      className="mb-5 rounded-lg border border-ink-300 bg-ink-50 p-4"
      open={review.newNumbers.length > 0 || review.placeholders.length > 0}
    >
      <summary className="cursor-pointer font-medium text-ink-900">
        Review changes · {review.added.length} added or changed lines · {review.removed.length}{' '}
        removed or replaced
      </summary>
      <p className="mt-3 text-sm text-ink-600">
        Compared with your starting resume. Moved or whitespace-only lines are treated as unchanged.
        This does not verify facts or predict hiring outcomes.
      </p>
      {review.newNumbers.length > 0 && (
        <p className="mt-3 text-sm font-medium text-amber-900">
          Confirm new dates and quantities against your sources: {review.newNumbers.join(', ')}.
          These may be correct; they need your review.
        </p>
      )}
      {review.placeholders.length > 0 && (
        <p className="mt-3 text-sm font-medium text-amber-900">
          Replace unfinished placeholders: {review.placeholders.join(', ')}.
        </p>
      )}
      {!review.added.length && !review.removed.length && (
        <p className="mt-3 text-sm text-ink-700">No text changes from this starting version.</p>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(
          [
            ['Added or changed', review.added],
            ['Removed or replaced', review.removed],
          ] as const
        ).map(([label, entries]) => (
          <section key={label} className="min-w-0">
            <h4 className="font-medium text-ink-900">{label}</h4>
            <ul className="mt-2 space-y-2 text-sm text-ink-700">
              {entries.slice(0, 30).map((line, index) => (
                <li
                  className="break-words whitespace-pre-wrap border-l-2 border-ink-300 pl-3"
                  key={`${index}-${line}`}
                >
                  {line}
                </li>
              ))}
            </ul>
            {entries.length > 30 && (
              <p className="mt-2 text-sm">
                Showing the first 30 of {entries.length} lines; review the full editor and PDF.
              </p>
            )}
          </section>
        ))}
      </div>
    </details>
  )
}
