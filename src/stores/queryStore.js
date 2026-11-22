// The terms the user has entered, and the query string they build.
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { OPERATORS, buildQuery, validateTerm } from '@/utils/queryBuilder';

const assertOperator = (operator) => {
  if (!OPERATORS.includes(operator)) throw new TypeError(`Unknown operator "${operator}"`);
};

export const useQueryStore = defineStore('query', () => {
  // State
  const terms = ref([]);

  // Getters
  const query = computed(() => buildQuery(terms.value));

  // Internal
  let nextId = 1;

  // Actions
  // Returns null once added, or the message explaining why not
  const addTerm = (value, operator = 'AND') => {
    assertOperator(operator);
    const problem = validateTerm(value);
    if (problem) return problem;

    terms.value.push({
      id: nextId++,
      operator: terms.value.length ? operator : 'AND',
      value: value.trim(),
    });
    return null;
  };

  const removeTerm = (id) => {
    terms.value = terms.value.filter((term) => term.id !== id);
    if (terms.value.length) terms.value[0].operator = 'AND'; // first term combines with nothing
  };

  const setOperator = (id, operator) => {
    assertOperator(operator);
    const term = terms.value.find((t) => t.id === id);
    if (term) term.operator = operator;
  };

  const clear = () => {
    terms.value = [];
  };

  // Replaces all terms in one go, so watchers see a single change
  const loadTerms = (list) => {
    clear();
    for (const { value, operator = 'AND' } of list) addTerm(value, operator);
  };

  return {
    // State
    terms,
    // Getters
    query,
    // Actions
    addTerm,
    removeTerm,
    setOperator,
    clear,
    loadTerms,
  };
});
