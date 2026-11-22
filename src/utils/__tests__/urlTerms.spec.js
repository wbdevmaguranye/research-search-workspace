import { describe, it, expect } from 'vitest';
import { paramToTerms, termsToParam } from '../urlTerms';

const terms = [
  { id: 1, operator: 'AND', value: 'cancer' },
  { id: 2, operator: 'AND', value: 'immunotherapy' },
  { id: 3, operator: 'NOT', value: 'melanoma' },
];

describe('termsToParam', () => {
  it('writes the first term as it is and prefixes the rest with their operator', () => {
    expect(termsToParam(terms)).toEqual(['cancer', 'AND:immunotherapy', 'NOT:melanoma']);
  });

  it('gives an empty list for no terms', () => {
    expect(termsToParam([])).toEqual([]);
  });
});

describe('paramToTerms', () => {
  it('reads repeated values back into terms', () => {
    expect(paramToTerms(['cancer', 'AND:immunotherapy', 'NOT:melanoma'])).toEqual([
      { operator: 'AND', value: 'cancer' },
      { operator: 'AND', value: 'immunotherapy' },
      { operator: 'NOT', value: 'melanoma' },
    ]);
  });

  it('accepts a single value, as the router gives a string for one term', () => {
    expect(paramToTerms('cancer')).toEqual([{ operator: 'AND', value: 'cancer' }]);
  });

  it('treats a value without an operator prefix as AND', () => {
    expect(paramToTerms(['cancer', 'tumour'])[1]).toEqual({ operator: 'AND', value: 'tumour' });
  });

  it('keeps colons that are part of the term', () => {
    expect(paramToTerms(['TITLE:cancer', 'OR:a:b'])).toEqual([
      { operator: 'AND', value: 'TITLE:cancer' },
      { operator: 'OR', value: 'a:b' },
    ]);
  });

  it('drops values that could not be added by hand, e.g. in an edited URL', () => {
    expect(paramToTerms(['cancer', 'AND:', '  ', 'OR', 'NOT:melanoma', null, 42])).toEqual([
      { operator: 'AND', value: 'cancer' },
      { operator: 'NOT', value: 'melanoma' },
    ]);
  });

  it('gives no terms when the parameter is missing', () => {
    expect(paramToTerms(undefined)).toEqual([]);
  });

  it('round-trips phrases and special characters', () => {
    const tricky = [
      { operator: 'AND', value: 'breast cancer' },
      { operator: 'OR', value: 'covid-19' },
    ];
    expect(paramToTerms(termsToParam(tricky))).toEqual(tricky);
  });
});
