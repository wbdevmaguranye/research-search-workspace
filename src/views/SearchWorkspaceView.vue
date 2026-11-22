<script setup>
import { useTemplateRef, watch } from 'vue';
import QueryTermForm from '@/components/query/QueryTermForm.vue';
import QueryTermList from '@/components/query/QueryTermList.vue';
import QueryPreview from '@/components/query/QueryPreview.vue';
import QueryExamples from '@/components/query/QueryExamples.vue';
import SearchResults from '@/components/results/SearchResults.vue';
import { useQueryStore } from '@/stores/queryStore';
import { useSearchStore } from '@/stores/searchStore';

const queryStore = useQueryStore();
const searchStore = useSearchStore();
const termForm = useTemplateRef('termForm');

// Search whenever the query changes; the store cancels any request still in flight
watch(
  () => queryStore.query,
  (query) => searchStore.search(query),
);

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

// The examples disappear once terms exist, so focus goes to the input
const loadExample = (terms) => {
  queryStore.loadTerms(terms);
  termForm.value.focus();
};
</script>

<template>
  <!-- Workspace: query panel left, results right; each scrolls on its own (stacked on small screens) -->
  <div
    class="flex-1 lg:grid lg:min-h-0 lg:grid-cols-[24rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
  >
    <section
      aria-labelledby="query-heading"
      class="relative border-b border-line bg-surface lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <!-- Padding lives here: on the scroll container it would leave a gap above the pinned query -->
      <div class="px-4 pb-6 sm:px-6">
        <h1 class="pt-6 text-2xl font-semibold tracking-tight">Search the literature</h1>
        <p class="mt-1 text-sm text-muted">Combine keywords to search Europe PMC.</p>

        <h2 id="query-heading" class="mt-6 text-lg font-semibold">Build your query</h2>
        <div class="mt-3 space-y-5">
          <!-- Query pinned at the top of the panel, so it stays visible however many terms -->
          <div class="bg-surface py-1 lg:sticky lg:top-0 lg:z-10">
            <QueryPreview :query="queryStore.query" />
          </div>
          <QueryTermForm ref="termForm" :has-terms="queryStore.terms.length > 0" @add="addTerm" />
          <QueryTermList
            v-if="queryStore.terms.length"
            :terms="queryStore.terms"
            @remove="removeTerm"
            @update-operator="queryStore.setOperator"
            @clear="clearTerms"
          />
          <QueryExamples v-else @select="loadExample" />
        </div>
      </div>
    </section>

    <SearchResults
      :status="searchStore.status"
      :query="searchStore.query"
      :articles="searchStore.articles"
      :hit-count="searchStore.hitCount"
      :page="searchStore.page"
      :page-count="searchStore.pageCount"
      :has-previous="searchStore.hasPrevious"
      :has-next="searchStore.hasNext"
      :error="searchStore.error"
      @previous="searchStore.previousPage"
      @next="searchStore.nextPage"
      @retry="searchStore.retry"
    />
  </div>
</template>
