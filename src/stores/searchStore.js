// Search results, status and cursor-based paging for the current query.
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { PAGE_SIZE, searchArticles } from '@/services/europePmc';

const FIRST_PAGE = '*';
const MAX_CACHED_PAGES = 50;

export const useSearchStore = defineStore('search', () => {
  // State
  const status = ref('idle'); // idle | loading | success | empty | error
  const query = ref('');
  const articles = ref([]);
  const hitCount = ref(0);
  const error = ref(null);
  const cursors = ref([FIRST_PAGE]); // cursor of each page visited; the last is the current page
  const nextCursorMark = ref(null);

  // Getters
  const page = computed(() => cursors.value.length);
  const pageCount = computed(() => Math.ceil(hitCount.value / PAGE_SIZE));
  const hasPrevious = computed(() => page.value > 1);
  // The API returns a cursor even on the last page, so hitCount decides
  const hasNext = computed(
    () => page.value * PAGE_SIZE < hitCount.value && Boolean(nextCursorMark.value),
  );

  // Internal
  let controller = null;
  let lastRequest = [FIRST_PAGE];
  // Pages already fetched, keyed by query and cursor; oldest-used dropped first
  const pageCache = new Map();

  const cacheKey = (cursor) => `${query.value}\n${cursor}`;

  const readCache = (key) => {
    const cached = pageCache.get(key);
    if (cached) {
      pageCache.delete(key); // re-insert, so Map order tracks recent use
      pageCache.set(key, cached);
    }
    return cached;
  };

  const writeCache = (key, data) => {
    pageCache.set(key, data);
    if (pageCache.size > MAX_CACHED_PAGES) pageCache.delete(pageCache.keys().next().value);
  };

  const show = (cursorStack, data) => {
    cursors.value = cursorStack;
    articles.value = data.articles;
    hitCount.value = data.hitCount;
    nextCursorMark.value = data.nextCursorMark;
    status.value = data.hitCount ? 'success' : 'empty';
  };

  const reset = () => {
    controller?.abort();
    controller = null;
    status.value = 'idle';
    articles.value = [];
    hitCount.value = 0;
    error.value = null;
    cursors.value = [FIRST_PAGE];
    nextCursorMark.value = null;
  };

  const load = async (cursorStack) => {
    controller?.abort();
    controller = null;
    lastRequest = cursorStack;
    error.value = null;

    const key = cacheKey(cursorStack.at(-1));
    const cached = readCache(key);
    if (cached) return show(cursorStack, cached);

    controller = new AbortController();
    const { signal } = controller;
    status.value = 'loading';

    const result = await searchArticles({
      query: query.value,
      cursorMark: cursorStack.at(-1),
      signal,
    });
    if (signal.aborted) return; // a newer request replaced this one

    controller = null;
    if (!result.ok) {
      status.value = 'error';
      error.value = result.error;
      return;
    }

    writeCache(key, result.data);
    show(cursorStack, result.data);
  };

  // Actions
  const search = (newQuery) => {
    reset();
    query.value = newQuery.trim();
    if (!query.value) return Promise.resolve();
    return load([FIRST_PAGE]);
  };

  const nextPage = () => {
    if (!hasNext.value) return Promise.resolve();
    return load([...cursors.value, nextCursorMark.value]);
  };

  const previousPage = () => {
    if (!hasPrevious.value) return Promise.resolve();
    return load(cursors.value.slice(0, -1));
  };

  const retry = () => load(lastRequest);

  return {
    // State
    status,
    query,
    articles,
    hitCount,
    error,
    // Getters
    page,
    pageCount,
    hasPrevious,
    hasNext,
    // Actions
    search,
    nextPage,
    previousPage,
    retry,
  };
});
