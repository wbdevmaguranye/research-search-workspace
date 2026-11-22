<script setup>
import { useTemplateRef } from 'vue';
import QueryTermForm from '@/components/query/QueryTermForm.vue';
import QueryTermList from '@/components/query/QueryTermList.vue';
import QueryPreview from '@/components/query/QueryPreview.vue';
import { useQueryStore } from '@/stores/queryStore';

const queryStore = useQueryStore();
const termForm = useTemplateRef('termForm');

const addTerm = ({ value, operator }) => queryStore.addTerm(value, operator);

// The list disappears with its last term, so focus goes back to the input
const removeTerm = (id) => {
  queryStore.removeTerm(id);
  if (!queryStore.terms.length) termForm.value.focus();
};

const clearTerms = () => {
  queryStore.clear();
  termForm.value.focus();
};
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Search the literature</h1>
    <p class="mt-2 max-w-prose text-muted">
      Add keywords or phrases, choose how they combine, and explore matching publications from
      Europe PMC.
    </p>

    <div class="mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <section
        aria-labelledby="query-heading"
        class="rounded-lg border border-line bg-surface p-5 shadow-sm lg:sticky lg:top-6"
      >
        <h2 id="query-heading" class="text-lg font-semibold">Build your query</h2>
        <div class="mt-4 space-y-6">
          <QueryTermForm ref="termForm" :has-terms="queryStore.terms.length > 0" @add="addTerm" />
          <QueryTermList
            v-if="queryStore.terms.length"
            :terms="queryStore.terms"
            @remove="removeTerm"
            @update-operator="queryStore.setOperator"
            @clear="clearTerms"
          />
          <QueryPreview :query="queryStore.query" />
        </div>
      </section>

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" class="text-lg font-semibold">Results</h2>
        <!-- Results and pagination: step 6 -->
      </section>
    </div>
  </div>
</template>
