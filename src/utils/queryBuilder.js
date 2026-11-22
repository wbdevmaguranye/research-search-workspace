// Turns user-entered terms ({ id, operator, value }) into a Europe PMC query string.

export const OPERATORS = Object.freeze(['AND', 'OR', 'NOT']);

const SYNTAX_CHARACTERS = /[+\-&|!(){}[\]^~*?:\\/]/; // characters the search engine treats as syntax
const OPERATOR_WORD = /^(AND|OR|NOT)$/i;
const WHITESPACE = /\s+/g;

// Cleans one value and quotes it so it is searched literally; returns '' for blank input.
export function formatTermValue(value) {
  const text = String(value ?? '')
    .replaceAll('"', '')
    .replace(WHITESPACE, ' ')
    .trim();

  if (!text) return '';

  const needsQuotes =
    text.includes(' ') || SYNTAX_CHARACTERS.test(text) || OPERATOR_WORD.test(text);
  return needsQuotes ? `"${text}"` : text;
}

// Joins terms left to right, adding brackets when switching between AND/NOT and OR.
export function buildQuery(terms) {
  let query = '';
  let previousGroup = null; // 'and' for AND/NOT, 'or' for OR

  for (const term of terms) {
    const value = formatTermValue(term.value);
    if (!value) continue;

    if (!query) {
      query = value; // first term: its operator is ignored
      continue;
    }

    if (!OPERATORS.includes(term.operator)) {
      throw new TypeError(`Unknown operator "${term.operator}"`);
    }

    const group = term.operator === 'OR' ? 'or' : 'and';
    if (previousGroup && group !== previousGroup) {
      query = `(${query})`;
    }

    query = `${query} ${term.operator} ${value}`;
    previousGroup = group;
  }

  return query;
}
