import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useQueryStore } from '../queryStore';

describe('queryStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useQueryStore();
  });

  it('starts with no terms and an empty query', () => {
    expect(store.terms).toEqual([]);
    expect(store.query).toBe('');
  });

  it('builds the query as terms are added', () => {
    store.addTerm('cancer');
    store.addTerm('immunotherapy', 'AND');
    store.addTerm('melanoma', 'NOT');
    expect(store.query).toBe('cancer AND immunotherapy NOT melanoma');
  });

  it('gives each term a unique id and trims its value', () => {
    store.addTerm('  cancer ');
    store.addTerm('cancer');
    const [first, second] = store.terms;
    expect(first.value).toBe('cancer');
    expect(first.id).not.toBe(second.id);
  });

  it('always stores the first term with AND, as it combines with nothing', () => {
    store.addTerm('melanoma', 'NOT');
    expect(store.terms[0].operator).toBe('AND');
  });

  it('returns null when a term is added, or the reason it was not', () => {
    expect(store.addTerm('cancer')).toBeNull();
    expect(store.addTerm('   ')).toBe('Enter a keyword or phrase.');
    expect(store.addTerm('OR')).toBe('OR is an operator: choose it from the list instead.');
    expect(store.terms).toHaveLength(1);
  });

  it('removes a term and rebuilds the query', () => {
    store.addTerm('cancer');
    store.addTerm('immunotherapy');
    store.addTerm('melanoma', 'NOT');
    store.removeTerm(store.terms[1].id);
    expect(store.query).toBe('cancer NOT melanoma');
  });

  it('resets the operator of a term that becomes first', () => {
    store.addTerm('cancer');
    store.addTerm('melanoma', 'NOT');
    store.removeTerm(store.terms[0].id);
    expect(store.terms[0]).toMatchObject({ value: 'melanoma', operator: 'AND' });
    expect(store.query).toBe('melanoma');
  });

  it('changes the operator of a term', () => {
    store.addTerm('tumour');
    store.addTerm('tumor');
    store.setOperator(store.terms[1].id, 'OR');
    expect(store.query).toBe('tumour OR tumor');
  });

  it('throws on an unknown operator, as that is a programming error', () => {
    store.addTerm('a');
    expect(() => store.addTerm('b', 'XOR')).toThrow(/Unknown operator "XOR"/);
    expect(() => store.setOperator(store.terms[0].id, 'XOR')).toThrow(/Unknown operator "XOR"/);
  });

  it('replaces every term at once, e.g. from an example search', () => {
    store.addTerm('old');
    store.loadTerms([
      { value: 'tumour' },
      { value: 'tumor', operator: 'OR' },
      { value: 'benign', operator: 'NOT' },
    ]);
    expect(store.terms.map((t) => t.value)).toEqual(['tumour', 'tumor', 'benign']);
    expect(store.query).toBe('(tumour OR tumor) NOT benign');
  });

  it('clears every term', () => {
    store.addTerm('cancer');
    store.addTerm('immunotherapy');
    store.clear();
    expect(store.terms).toEqual([]);
    expect(store.query).toBe('');
  });
});
