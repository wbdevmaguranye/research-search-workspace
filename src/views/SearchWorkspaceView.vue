<script setup>
import { useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryTermForm from '@/components/query/QueryTermForm.vue';
import QueryTermList from '@/components/query/QueryTermList.vue';
import QueryPreview from '@/components/query/QueryPreview.vue';
import QueryExamples from '@/components/query/QueryExamples.vue';
import SearchResults from '@/components/results/SearchResults.vue';
import { useQueryStore } from '@/stores/queryStore';
import { useSearchStore } from '@/stores/searchStore';
import { paramToTerms, termsToParam } from '@/utils/urlTerms';

const APP_NAME = 'Research Search Workspace';

const queryStore = useQueryStore();
const searchStore = useSearchStore();
const route = useRoute();
const router = useRouter();
const termForm = useTemplateRef('termForm');

const urlKey = (terms) => JSON.stringify(termsToParam(terms));

// URL to terms: on arrival, refresh, and the Back/Forward buttons
watch(
  () => route.query.t,
  (param) => {
    const terms = paramToTerms(param);
    if (urlKey(terms) !== urlKey(queryStore.terms)) queryStore.loadTerms(terms);
  },
  { immediate: true },
);

// Terms to URL: each change is a history entry, so Back undoes it
watch(
  () => urlKey(queryStore.terms),
  (key) => {
    if (key === urlKey(paramToTerms(route.query.t))) return;
    const t = termsToParam(queryStore.terms);
    router.push({ query: t.length ? { t } : {} });
  },
);

// Search, and name the page, whenever the query changes; the store cancels any request in flight
watch(
  () => queryStore.query,
  (query) => {
    searchStore.search(query);
    document.title = query ? `${query} – ${APP_NAME}` : APP_NAME;
  },
  { immediate: true },
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
  <div
    class="flex-1 lg:grid lg:min-h-0 lg:grid-cols-[24rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
  >
    <section
      aria-labelledby="query-heading"
      class="relative border-b border-line bg-surface lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <div class="px-4 pb-6 sm:px-6">
        <h1 class="pt-6 text-2xl font-semibold tracking-tight">Search the literature</h1>
        <p class="mt-1 text-sm text-muted">Combine keywords to search Europe PMC.</p>

        <h2 id="query-heading" class="mt-6 text-lg font-semibold">Build your query</h2>
        <div class="mt-3 space-y-5">
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
