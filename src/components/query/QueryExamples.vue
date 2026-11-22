<script setup>
import { useId } from 'vue';
import { buildQuery } from '@/utils/queryBuilder';

const emit = defineEmits(['select']);

// Checked against the live API; each shows a different part of the builder
const EXAMPLES = [
  [
    { value: 'cancer' },
    { value: 'immunotherapy', operator: 'AND' },
    { value: 'melanoma', operator: 'NOT' },
  ],
  [{ value: 'tumour' }, { value: 'tumor', operator: 'OR' }, { value: 'benign', operator: 'NOT' }],
  [{ value: 'breast cancer' }, { value: 'screening', operator: 'AND' }],
  [{ value: 'tardigrade' }, { value: 'radiation tolerance', operator: 'AND' }],
].map((terms) => ({ terms, query: buildQuery(terms) }));

const labelId = useId();
</script>

<template>
  <div class="@container text-sm">
    <div class="flex flex-col gap-2 @lg:flex-row @lg:items-baseline @lg:gap-3">
      <p :id="labelId" class="shrink-0 text-muted">Try an example:</p>
      <!-- The list shrinks and wraps its own items, so the label keeps its line -->
      <ul
        role="list"
        :aria-labelledby="labelId"
        class="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-2"
      >
        <li v-for="example in EXAMPLES" :key="example.query">
          <button
            type="button"
            class="text-left font-mono text-accent underline underline-offset-2 hover:text-accent-strong"
            @click="emit('select', example.terms)"
          >
            {{ example.query }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
