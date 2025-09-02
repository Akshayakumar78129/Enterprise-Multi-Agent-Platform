// Utility helpers for Engagement Assistant context handling
// NOTE: Pure helpers only — no UI changes.

// Detects if user asked to explain the currently attached context
// Examples matched (case-insensitive):
//  - "explain about the context"
//  - "explain context"
//  - "explain the contexts"
//  - "explain these contexts"
//  - "explain attached context"
export function isExplainContextCommand(message) {
  if (!message) return false;
  const m = String(message).trim().toLowerCase();
  // Strict enough to avoid false positives, but tolerant of small variations
  const patterns = [
    /\bexplain\b.*\b(the\s+)?context(s)?\b/,
    /\bexplain\b.*\b(attached|added)\s+context(s)?\b/,
    /\bexplain\s+about\s+the\s+context(s)?\b/,
  ];
  return patterns.some((re) => re.test(m));
}

// Turn the current context tags into a single user-prompt message
// - Keeps tags untouched in UI (caller decides when to clear)
// - Produces a concise, ordered block the backend can interpret clearly
export function formatContextsAsPrompt(contextTags) {
  const tags = Array.isArray(contextTags) ? contextTags.filter(Boolean) : [];
  if (tags.length === 0) return '';

  // Single, straightforward message. No special markup beyond clear bullets.
  // Do not alter UI or clear tags — strictly formatting output.
  const header = 'Please explain the following context items one by one:';
  const bulletList = tags.map((t, i) => `${i + 1}. ${String(t)}`).join('\n');
  return `${header}\n${bulletList}`;
}