// Converts terms to and from the URL: ?t=cancer&t=AND:immunotherapy&t=NOT:melanoma
import { validateTerm } from './queryBuilder';

const OPERATOR_PREFIX = /^(AND|OR|NOT):/;

export const termsToParam = (terms) =>
  terms.map((term, index) => (index === 0 ? term.value : `${term.operator}:${term.value}`));

const toTerm = (raw) => {
  const match = raw.match(OPERATOR_PREFIX);
  return match
    ? { operator: match[1], value: raw.slice(match[0].length) }
    : { operator: 'AND', value: raw };
};

// The router gives a string for one value and an array for several; anything invalid is dropped
export const paramToTerms = (param) =>
  [param ?? []]
    .flat()
    .filter((raw) => typeof raw === 'string')
    .map(toTerm)
    .filter((term) => validateTerm(term.value) === null);
