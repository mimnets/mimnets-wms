// The brief check (m1-088, D-CONTENT-33 Q4, ADR-0005 Decision 4): a brief
// goes to an external AI service, so it must not carry personal contact
// details. Run before the record is stored, so a refused brief is never
// saved or sent. Pure: scripts/design-suggestion.test.mjs checks it.
//
// A safeguard, not a guarantee: the help text also asks for no names of
// people or customers, and the DPO decides on the provider (Decision 10).

export const BRIEF_MIN = 20;
export const BRIEF_MAX = 1000;

// name@domain.tld, also with spaces around "@" or "(at)".
const email = /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\])\s*[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i;
// A run of digits with spaces, dots, dashes or brackets between them, with
// seven or more digits, that starts with "+" or has a group of four or more
// digits: phone numbers in the common formats. Years ("since 1998"), short
// figures and colour triplets ("255 255 255") stay allowed.
const phoneCandidate = /\+?\(?\d[\d\s.\-()]*\d/g;
const isPhone = candidate => candidate.replace(/\D/g, '').length >= 7 &&
  (candidate.startsWith('+') || /\d{4,}/.test(candidate));

// Returns a list of problems; empty when the brief may be sent.
export function briefProblems(brief) {
  const text = typeof brief === 'string' ? brief.trim() : '';
  const problems = [];
  if (text.length < BRIEF_MIN) {
    problems.push(`Write at least ${BRIEF_MIN} characters: the mood, the audience and any colours you want.`);
  }
  if (text.length > BRIEF_MAX) {
    problems.push(`Keep the brief under ${BRIEF_MAX} characters.`);
  }
  if (email.test(text) || (text.match(phoneCandidate) || []).some(isPhone)) {
    problems.push('Remove personal contact details (e-mail addresses, phone numbers) from the brief. It is sent to an external AI service.');
  }
  return problems;
}
