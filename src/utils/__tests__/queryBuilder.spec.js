import { describe, it, expect } from 'vitest';
import { OPERATORS, buildQuery, formatTermValue } from '../queryBuilder';

// Test helper: term('melanoma', 'NOT')
let nextId = 0;
const term = (value, operator = 'AND') => ({ id: `t${nextId++}`, operator, value });

describe('OPERATORS', () => {
  it('offers exactly AND, OR and NOT', () => {
    expect(OPERATORS).toEqual(['AND', 'OR', 'NOT']);
  });

  it('cannot be modified at runtime', () => {
    expect(Object.isFrozen(OPERATORS)).toBe(true);
  });
});

describe('formatTermValue', () => {
  it('leaves a plain keyword as it is', () => {
    expect(formatTermValue('cancer')).toBe('cancer');
  });

  it('trims and collapses whitespace', () => {
    expect(formatTermValue('  cancer  ')).toBe('cancer');
    expect(formatTermValue('breast \t  cancer')).toBe('"breast cancer"');
  });

  it('returns an empty string for blank input', () => {
    expect(formatTermValue('')).toBe('');
    expect(formatTermValue('   ')).toBe('');
    expect(formatTermValue(undefined)).toBe('');
    expect(formatTermValue(null)).toBe('');
  });

  it('quotes a multi-word phrase', () => {
    expect(formatTermValue('breast cancer')).toBe('"breast cancer"');
  });

  it('does not double-quote a phrase the user already quoted', () => {
    expect(formatTermValue('"breast cancer"')).toBe('"breast cancer"');
  });

  it('removes stray quotes that would break the query', () => {
    expect(formatTermValue('cancer"')).toBe('cancer');
    expect(formatTermValue('say "hello" world')).toBe('"say hello world"');
  });

  it('quotes words containing search-syntax characters so they are searched literally', () => {
    expect(formatTermValue('covid-19')).toBe('"covid-19"');
    expect(formatTermValue('TITLE:cancer')).toBe('"TITLE:cancer"');
    expect(formatTermValue('(tumour)')).toBe('"(tumour)"');
    expect(formatTermValue('immun*')).toBe('"immun*"');
  });

  it('quotes a bare operator word so it is searched, not applied', () => {
    expect(formatTermValue('AND')).toBe('"AND"');
    expect(formatTermValue('not')).toBe('"not"');
  });
});

describe('buildQuery', () => {
  it('returns an empty string when there are no terms', () => {
    expect(buildQuery([])).toBe('');
  });

  it('returns a single term on its own', () => {
    expect(buildQuery([term('cancer')])).toBe('cancer');
  });

  it('builds the example from the brief', () => {
    const terms = [term('cancer'), term('immunotherapy', 'AND'), term('melanoma', 'NOT')];
    expect(buildQuery(terms)).toBe('cancer AND immunotherapy NOT melanoma');
  });

  it('joins terms with OR', () => {
    expect(buildQuery([term('tumour'), term('tumor', 'OR')])).toBe('tumour OR tumor');
  });

  it('ignores the operator on the first term', () => {
    expect(buildQuery([term('melanoma', 'NOT'), term('skin', 'AND')])).toBe('melanoma AND skin');
  });

  it('skips blank terms, and the next term then becomes the first', () => {
    const terms = [term('   '), term('cancer', 'NOT'), term(''), term('therapy', 'OR')];
    expect(buildQuery(terms)).toBe('cancer OR therapy');
  });

  it('quotes phrases inside a larger query', () => {
    const terms = [term('breast cancer'), term('covid-19', 'NOT')];
    expect(buildQuery(terms)).toBe('"breast cancer" NOT "covid-19"');
  });

  describe('grouping, so terms combine in the order shown', () => {
    it('needs no brackets when AND and NOT are mixed', () => {
      const terms = [term('a'), term('b', 'NOT'), term('c', 'AND'), term('d', 'NOT')];
      expect(buildQuery(terms)).toBe('a NOT b AND c NOT d');
    });

    it('brackets the OR group before an AND', () => {
      const terms = [term('a'), term('b', 'OR'), term('c', 'AND')];
      expect(buildQuery(terms)).toBe('(a OR b) AND c');
    });

    it('brackets the AND group before an OR', () => {
      const terms = [term('a'), term('b', 'AND'), term('c', 'OR')];
      expect(buildQuery(terms)).toBe('(a AND b) OR c');
    });

    it('brackets the OR group before a NOT', () => {
      const terms = [term('tumour'), term('tumor', 'OR'), term('benign', 'NOT')];
      expect(buildQuery(terms)).toBe('(tumour OR tumor) NOT benign');
    });

    it('nests for every change, left to right', () => {
      const terms = [
        term('a'),
        term('b', 'OR'),
        term('c', 'OR'),
        term('d', 'AND'),
        term('e', 'NOT'),
        term('f', 'OR'),
      ];
      expect(buildQuery(terms)).toBe('((a OR b OR c) AND d NOT e) OR f');
    });

    it('does not bracket a single term when the operator changes', () => {
      // The first operator is ignored, so "a" alone is never wrapped.
      expect(buildQuery([term('a', 'OR'), term('b', 'AND')])).toBe('a AND b');
    });
  });

  it('throws on an unknown operator, as that is a programming error', () => {
    expect(() => buildQuery([term('a'), term('b', 'XOR')])).toThrow(/Unknown operator "XOR"/);
  });

  it('does not modify the terms it is given', () => {
    const terms = [term('breast cancer'), term('  melanoma ', 'NOT')];
    const copy = structuredClone(terms);
    buildQuery(terms);
    expect(terms).toEqual(copy);
  });
});
