// Turns user-entered terms ({ id, operator, value }) into a Europe PMC query string.

export const OPERATORS = Object.freeze(['AND', 'OR', 'NOT']);

const SYNTAX_CHARACTERS = /[+\-&|!(){}[\]^~*?:\\/]/; // characters the search engine treats as syntax
const OPERATOR_WORD = /^(AND|OR|NOT)$/i;
const WHITESPACE = /\s+/g;

// Cleans one value and quotes it so it is searched literally; returns '' for blank input.
export const formatTermValue = (value) => {
  const text = String(value ?? '')
    .replaceAll('"', '')
    .replace(WHITESPACE, ' ')
    .trim();

  if (!text) return '';

  const needsQuotes =
    text.includes(' ') || SYNTAX_CHARACTERS.test(text) || OPERATOR_WORD.test(text);
  return needsQuotes ? `"${text}"` : text;
};

// Returns why a value can't be added as a term, or null if it can.
export const validateTerm = (value) => {
  const text = String(value ?? '').trim();
  if (!formatTermValue(text)) return 'Enter a keyword or phrase.';
  if (OPERATOR_WORD.test(text)) {
    return `${text.toUpperCase()} is an operator: choose it from the list instead.`;
  }
  return null;
};

// Joins terms left to right, adding brackets when switching between AND/NOT and OR.
export const buildQuery = (terms) => {
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
};
