/** Text differences are review aids, never a truth or ATS assessment. */
export function reviewResumeChanges(
  original: string,
  draft: string,
): { added: string[]; removed: string[]; newNumbers: string[]; placeholders: string[] } {
  const lines = (text: string): string[] =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  const difference = (left: string[], right: string[]): string[] => {
    const counts = new Map<string, number>()
    right.forEach((line) => counts.set(line, (counts.get(line) || 0) + 1))
    return left.filter((line) => {
      const remaining = counts.get(line) || 0
      if (!remaining) return true
      counts.set(line, remaining - 1)
      return false
    })
  }
  const added = difference(lines(draft), lines(original))
  const removed = difference(lines(original), lines(draft))
  const numbers = (text: string): string[] => text.match(/\b\d+(?:[.,]\d+)*(?:\s?%|\+)?/g) || []
  const baseline = new Set(numbers(original))
  return {
    added,
    removed,
    newNumbers: [...new Set(numbers(added.join('\n')).filter((number) => !baseline.has(number)))],
    placeholders: [
      ...new Set(
        draft.match(
          /\[(?:your|company|insert|name|metric|date)[^\]\n]*\]|\b(?:TODO|TBD|lorem ipsum)\b/gi,
        ) || [],
      ),
    ],
  }
}
