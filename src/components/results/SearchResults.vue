<script setup>
import { computed, useId, useTemplateRef, watch } from 'vue';
import { PAGE_SIZE } from '@/services/europePmc';
import ResultCard from './ResultCard.vue';
import ResultsPagination from './ResultsPagination.vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
  articles: {
    type: Array,
    required: true,
  },
  hitCount: {
    type: Number,
    required: true,
  },
  page: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  hasPrevious: {
    type: Boolean,
    required: true,
  },
  hasNext: {
    type: Boolean,
    required: true,
  },
  error: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['previous', 'next', 'retry']);

const headingId = useId();
const heading = useTemplateRef('heading');
const body = useTemplateRef('body');

const format = (count) => count.toLocaleString('en-GB');
const firstShown = computed(() => (props.page - 1) * PAGE_SIZE + 1);
const lastShown = computed(() => firstShown.value + props.articles.length - 1);
const loading = computed(() => props.status === 'loading');
// While the next page loads, keep the summary and paging bar so the layout doesn't jump
const hasResults = computed(
  () => props.hitCount > 0 && (props.status === 'success' || loading.value),
);

// Only the results body scrolls, so new results must start at its top
watch(
  () => props.status,
  (status) => {
    if (status === 'loading' && body.value) body.value.scrollTop = 0;
  },
);

// Read out when a search finishes; loading isn't announced, as every query change searches
const announcement = computed(() => {
  if (props.status === 'success') {
    const noun = props.hitCount === 1 ? 'result' : 'results';
    return `${format(props.hitCount)} ${noun}. Page ${format(props.page)} of ${format(props.pageCount)}.`;
  }
  if (props.status === 'empty') return 'No results found.';
  if (props.status === 'error') return `Search failed. ${props.error?.message ?? ''}`.trim();
  return '';
});

// The paging buttons are disabled while loading, so focus moves to the top of the results
const changePage = (direction) => {
  emit(direction);
  heading.value.focus();
};
</script>

<template>
  <!-- Heading and paging bar stay put; on large screens only the results body scrolls -->
  <section :aria-labelledby="headingId" class="flex min-w-0 flex-col lg:min-h-0">
    <div class="px-4 pt-6 sm:px-8">
      <h2
        :id="headingId"
        ref="heading"
        tabindex="-1"
        class="text-lg font-semibold focus:outline-none"
      >
        Results
      </h2>
      <p aria-live="polite" class="sr-only">{{ announcement }}</p>
      <p v-if="hasResults" class="mt-1 text-sm text-muted">
        Showing {{ format(firstShown) }}–{{ format(lastShown) }} of {{ format(hitCount) }} results
      </p>
    </div>

    <!-- relative: keeps absolutely positioned sr-only text inside, or it stretches the page -->
    <div
      ref="body"
      data-results-body
      class="relative scrollbar-brand flex-1 px-4 pt-4 pb-6 sm:px-8 lg:min-h-0 lg:[scrollbar-gutter:stable] lg:overflow-y-auto"
    >
      <p v-if="status === 'idle'" class="text-muted">Add a term to see matching publications.</p>

      <div v-else-if="status === 'loading'" aria-busy="true">
        <p class="text-sm text-muted">Loading results…</p>
        <ul data-skeleton aria-hidden="true" class="mt-4 space-y-3">
          <li v-for="n in 5" :key="n" class="rounded-lg border border-line bg-surface p-4">
            <div class="h-4 w-3/4 rounded bg-line motion-safe:animate-pulse" />
            <div class="mt-3 h-3 w-1/4 rounded bg-line motion-safe:animate-pulse" />
            <div class="mt-2 h-3 w-1/2 rounded bg-line motion-safe:animate-pulse" />
          </li>
        </ul>
      </div>

      <div
        v-else-if="status === 'error'"
        class="rounded-lg border border-l-4 border-line border-l-danger bg-surface p-4"
      >
        <p class="font-semibold text-danger">Search failed</p>
        <p class="mt-1">{{ error?.message }}</p>
        <button
          type="button"
          class="mt-3 rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong"
          @click="emit('retry')"
        >
          Try again
        </button>
      </div>

      <div v-else-if="status === 'empty'" class="rounded-lg border border-line bg-surface p-4">
        <p class="font-semibold">
          No publications match <code class="font-mono text-sm">{{ query }}</code>
        </p>
        <p class="mt-1 text-muted">Try removing a term, or use OR to include alternative words.</p>
      </div>

      <ol v-else role="list" :start="firstShown" class="space-y-3">
        <li v-for="article in articles" :key="article.id">
          <ResultCard :article="article" />
        </li>
      </ol>
    </div>
    <ResultsPagination
      v-if="hasResults && pageCount > 1"
      class="sticky bottom-0 scrollbar-brand shrink-0 border-t border-line bg-surface px-4 py-3 sm:px-8 lg:[scrollbar-gutter:stable] lg:overflow-hidden"
      :page="page"
      :page-count="pageCount"
      :has-previous="hasPrevious && !loading"
      :has-next="hasNext && !loading"
      @previous="changePage('previous')"
      @next="changePage('next')"
    />
  </section>
</template>
