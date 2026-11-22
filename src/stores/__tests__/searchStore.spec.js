import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { searchArticles } from '@/services/europePmc';
import { useSearchStore } from '../searchStore';

// Mock only the request; keep the real PAGE_SIZE
vi.mock('@/services/europePmc', async (importOriginal) => ({
  ...(await importOriginal()),
  searchArticles: vi.fn(),
}));

const article = (id) => ({ id, title: `Title ${id}`, authors: 'Doe J.', year: '2024', url: '#' });

const page = ({ hitCount = 60, next = 'cursor-next', ids = ['a', 'b'] } = {}) => ({
  ok: true,
  data: { hitCount, nextCursorMark: next, articles: ids.map(article) },
});

const failure = { ok: false, error: { kind: 'network', status: null, message: 'Offline' } };
const aborted = { ok: false, error: { kind: 'aborted', status: null, message: 'Cancelled' } };

// A promise the test resolves by hand, to control the order responses arrive in
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

const lastCall = () => searchArticles.mock.calls.at(-1)[0];

describe('searchStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSearchStore();
    searchArticles.mockReset();
  });

  it('starts idle with no results', () => {
    expect(store.status).toBe('idle');
    expect(store.articles).toEqual([]);
    expect(store.page).toBe(1);
  });

  describe('search', () => {
    it('is loading while the request is in flight', () => {
      searchArticles.mockReturnValue(new Promise(() => {}));
      store.search('cancer');
      expect(store.status).toBe('loading');
    });

    it('shows the first page of results', async () => {
      searchArticles.mockResolvedValue(page({ hitCount: 60 }));
      await store.search('cancer');

      expect(lastCall()).toMatchObject({ query: 'cancer', cursorMark: '*' });
      expect(store.status).toBe('success');
      expect(store.articles.map((a) => a.id)).toEqual(['a', 'b']);
      expect(store.hitCount).toBe(60);
      expect(store.page).toBe(1);
      expect(store.pageCount).toBe(3);
    });

    it('reports empty when nothing matches', async () => {
      searchArticles.mockResolvedValue(page({ hitCount: 0, next: null, ids: [] }));
      await store.search('zzqqxx');
      expect(store.status).toBe('empty');
    });

    it('reports the error when the request fails', async () => {
      searchArticles.mockResolvedValue(failure);
      await store.search('cancer');
      expect(store.status).toBe('error');
      expect(store.error).toEqual(failure.error);
    });

    it('goes back to idle for a blank query, without a request', async () => {
      await store.search('   ');
      expect(store.status).toBe('idle');
      expect(searchArticles).not.toHaveBeenCalled();
    });

    it('starts a new query on page 1', async () => {
      searchArticles.mockResolvedValue(page());
      await store.search('cancer');
      await store.nextPage();
      await store.search('melanoma');
      expect(lastCall().cursorMark).toBe('*');
      expect(store.page).toBe(1);
    });
  });

  describe('paging', () => {
    it('moves forward with the cursor from the current page', async () => {
      searchArticles.mockResolvedValue(page({ next: 'cursor-2' }));
      await store.search('cancer');
      searchArticles.mockResolvedValue(page({ next: 'cursor-3', ids: ['c'] }));
      await store.nextPage();

      expect(lastCall()).toMatchObject({ query: 'cancer', cursorMark: 'cursor-2' });
      expect(store.page).toBe(2);
      expect(store.articles.map((a) => a.id)).toEqual(['c']);
    });

    it('moves back by re-requesting the previous cursor', async () => {
      searchArticles.mockResolvedValue(page({ next: 'cursor-2' }));
      await store.search('cancer');
      await store.nextPage();
      await store.previousPage();

      expect(lastCall().cursorMark).toBe('*');
      expect(store.page).toBe(1);
    });

    it('has no previous page on page 1', async () => {
      searchArticles.mockResolvedValue(page());
      await store.search('cancer');
      expect(store.hasPrevious).toBe(false);

      await store.previousPage();
      expect(searchArticles).toHaveBeenCalledTimes(1);
    });

    it('uses hitCount, not the cursor, to decide there is no next page', async () => {
      // Real API behaviour: the last page still returns a nextCursorMark
      searchArticles.mockResolvedValue(page({ hitCount: 25, next: 'cursor-to-empty-page' }));
      await store.search('cancer');
      expect(store.hasNext).toBe(false);

      await store.nextPage();
      expect(searchArticles).toHaveBeenCalledTimes(1);
    });

    it('has a next page while more results remain', async () => {
      searchArticles.mockResolvedValue(page({ hitCount: 26 }));
      await store.search('cancer');
      expect(store.hasNext).toBe(true);
    });

    it('stays on the current page if the next one fails, and retry repeats that request', async () => {
      searchArticles.mockResolvedValue(page({ next: 'cursor-2' }));
      await store.search('cancer');
      searchArticles.mockResolvedValue(failure);
      await store.nextPage();

      expect(store.status).toBe('error');
      expect(store.page).toBe(1);

      searchArticles.mockResolvedValue(page({ ids: ['c'] }));
      await store.retry();
      expect(lastCall().cursorMark).toBe('cursor-2');
      expect(store.status).toBe('success');
      expect(store.page).toBe(2);
    });
  });

  describe('overlapping requests', () => {
    it('cancels the previous request when a new one starts', async () => {
      searchArticles.mockReturnValue(new Promise(() => {}));
      store.search('cancer');
      const firstSignal = lastCall().signal;

      store.search('melanoma');
      expect(firstSignal.aborted).toBe(true);
      expect(lastCall().signal.aborted).toBe(false);
    });

    it('ignores a slow response that arrives after a newer one', async () => {
      const slow = deferred();
      searchArticles
        .mockReturnValueOnce(slow.promise)
        .mockResolvedValueOnce(page({ ids: ['new'] }));

      const first = store.search('cancer');
      await store.search('melanoma');
      slow.resolve(page({ ids: ['old'] }));
      await first;

      expect(store.articles.map((a) => a.id)).toEqual(['new']);
      expect(store.status).toBe('success');
    });

    it('does not show an error for a request it cancelled itself', async () => {
      const slow = deferred();
      searchArticles.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(page());

      const first = store.search('cancer');
      await store.search('melanoma');
      slow.resolve(aborted);
      await first;

      expect(store.status).toBe('success');
      expect(store.error).toBeNull();
    });

    it('cancels an in-flight request when the query is cleared', () => {
      searchArticles.mockReturnValue(new Promise(() => {}));
      store.search('cancer');
      const signal = lastCall().signal;

      store.search('');
      expect(signal.aborted).toBe(true);
      expect(store.status).toBe('idle');
    });
  });
});
