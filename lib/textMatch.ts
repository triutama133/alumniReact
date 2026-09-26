// Lightweight keyword-overlap scoring, mirroring the same tokenize/weight approach the
// external AI engine uses for its candidate scoring (Alumni AI/alumni_ai/main.py:
// tokenize_text / compute_weighted_match_score / extract_matched_terms). Kept here as a
// pure-TS port for features that don't need an LLM call at all — the Smart Job
// Aggregator's job-fit ranking is a deterministic sort, not something worth an extra
// Gemini round-trip for.

const STOPWORDS = new Set([
  'untuk', 'dengan', 'yang', 'dari', 'pada', 'adalah', 'akan', 'atau', 'juga',
  'dapat', 'serta', 'dalam', 'oleh', 'para', 'tersebut', 'secara', 'sudah',
  'harus', 'bisa', 'saja', 'seperti', 'maka', 'lain', 'lainnya', 'antara',
  'about', 'with', 'from', 'that', 'this', 'have', 'will', 'your', 'their',
]);

export function tokenizeText(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  const matches = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  return new Set(matches.filter((t) => t.length > 2));
}

export function computeMatchScore(sourceTokens: Set<string>, targetText: string | null | undefined): number {
  if (sourceTokens.size === 0 || !targetText) return 0;
  const targetTokens = tokenizeText(targetText);
  if (targetTokens.size === 0) return 0;

  let score = 0;
  for (const token of sourceTokens) {
    if (!targetTokens.has(token)) continue;
    if (token.length >= 8) score += 1.6;
    else if (token.length >= 5) score += 1.3;
    else score += 1.0;
  }
  return score;
}

export function extractMatchedTerms(sourceTokens: Set<string>, targetText: string | null | undefined, limit = 8): string[] {
  if (sourceTokens.size === 0 || !targetText) return [];
  const targetTokens = tokenizeText(targetText);
  const matched = [...sourceTokens].filter((t) => targetTokens.has(t) && t.length >= 4 && !STOPWORDS.has(t));
  matched.sort((a, b) => b.length - a.length);
  return [...new Set(matched)].slice(0, limit);
}
