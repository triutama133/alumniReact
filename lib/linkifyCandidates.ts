import type { RecommendedCandidate } from './api';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces exact occurrences of each candidate's full name in AI-generated markdown
 * text with a link to a virtual "#candidate-<id>" anchor, so a markdown renderer with a
 * custom link handler can intercept clicks and open a talent preview instead of
 * navigating — this is what makes candidate names inside the AI's narrative clickable.
 */
export function linkifyCandidateNames(text: string, candidates: RecommendedCandidate[]): string {
  let result = text;
  // Longest names first so a shorter name that's a substring of a longer one isn't
  // matched and linked first, leaving the longer name's remainder dangling.
  const sorted = [...candidates].sort((a, b) => b.nama_lengkap.length - a.nama_lengkap.length);
  for (const candidate of sorted) {
    if (!candidate.nama_lengkap) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(candidate.nama_lengkap)}\\b`, 'g');
    result = result.replace(pattern, `[${candidate.nama_lengkap}](#candidate-${candidate.id})`);
  }
  return result;
}
