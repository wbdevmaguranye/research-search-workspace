import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/router';
import { searchArticles } from '@/services/europePmc';
import SearchWorkspaceView from '../SearchWorkspaceView.vue';

// Mock only the request; keep the real PAGE_SIZE
vi.mock('@/services/europePmc', async (importOriginal) => ({
  ...(await importOriginal()),
  searchArticles: vi.fn(),
}));

const article = (id) => ({ id, title: `Title ${id}`, authors: 'Doe J.', year: '2024', url: '#' });

let wrapper;
let router;

const mountView = async (path = '/') => {
  router = createRouter({ history: createMemoryHistory(), routes });
  router.push(path);
  await router.isReady();
  wrapper = mount(SearchWorkspaceView, { attachTo: document.body, global: { plugins: [router] } });
};

// Adds a term through the UI, the way a user would
const addTerm = async (value, operator) => {
  if (operator) await wrapper.get(`input[type="radio"][value="${operator}"]`).setValue();
  await wrapper.get('input[type="text"]').setValue(value);
  await wrapper.get('form').trigger('submit');
};

const queryPanel = () => wrapper.get('section[aria-labelledby="query-heading"]');
const termItems = () => queryPanel().findAll('li');
const preview = () => wrapper.get('output').text();
const removeButton = (value) => wrapper.get(`button[aria-label="Remove ${value}"]`);
const searchedQueries = () => searchArticles.mock.calls.map(([args]) => args.query);

beforeEach(async () => {
  setActivePinia(createPinia());
  searchArticles.mockReset();
  searchArticles.mockResolvedValue({
    ok: true,
    data: { hitCount: 2, nextCursorMark: null, articles: [article('a'), article('b')] },
  });
  await mountView();
});

afterEach(() => wrapper.unmount());

describe('SearchWorkspaceView: building a query', () => {
  it('builds the example from the brief', async () => {
    await addTerm('cancer');
    await addTerm('immunotherapy', 'AND');
    await addTerm('melanoma', 'NOT');

    expect(termItems()).toHaveLength(3);
    expect(preview()).toBe('cancer AND immunotherapy NOT melanoma');
  });

  it('updates the query when an operator is changed in the list', async () => {
    await addTerm('tumour');
    await addTerm('tumor');
    await wrapper.get('select').setValue('OR');

    expect(preview()).toBe('tumour OR tumor');
  });

  it('moves focus to the next term after removing one', async () => {
    await addTerm('cancer');
    await addTerm('immunotherapy');
    await addTerm('melanoma', 'NOT');
    await removeButton('immunotherapy').trigger('click');

    expect(preview()).toBe('cancer NOT melanoma');
    expect(document.activeElement).toBe(removeButton('melanoma').element);
  });

  it('moves focus to the previous term after removing the last one in the list', async () => {
    await addTerm('cancer');
    await addTerm('melanoma', 'NOT');
    await removeButton('melanoma').trigger('click');

    expect(document.activeElement).toBe(removeButton('cancer').element);
  });

  it('returns focus to the input when the final term is removed', async () => {
    await addTerm('cancer');
    await removeButton('cancer').trigger('click');

    expect(queryPanel().find('ol').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('input[type="text"]').element);
  });

  it('clears every term and returns focus to the input', async () => {
    await addTerm('cancer');
    await addTerm('immunotherapy');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear all')
      .trigger('click');

    expect(queryPanel().find('ol').exists()).toBe(false);
    expect(preview()).toBe('Your query will appear here as you add terms.');
    expect(document.activeElement).toBe(wrapper.get('input[type="text"]').element);
  });
});

describe('SearchWorkspaceView: example searches', () => {
  const exampleButton = (query) => wrapper.findAll('button').find((b) => b.text() === query);

  it('loads an example in one click, searches it once, and returns focus to the input', async () => {
    await exampleButton('(tumour OR tumor) NOT benign').trigger('click');
    await flushPromises();

    expect(preview()).toBe('(tumour OR tumor) NOT benign');
    expect(termItems()).toHaveLength(3);
    expect(searchedQueries()).toEqual(['(tumour OR tumor) NOT benign']);
    expect(document.activeElement).toBe(wrapper.get('input[type="text"]').element);
  });

  it('shows the examples only while there are no terms', async () => {
    expect(exampleButton('(tumour OR tumor) NOT benign')).toBeDefined();

    await addTerm('cancer');
    expect(exampleButton('(tumour OR tumor) NOT benign')).toBeUndefined();

    await removeButton('cancer').trigger('click');
    expect(exampleButton('(tumour OR tumor) NOT benign')).toBeDefined();
  });
});

describe('SearchWorkspaceView: searching', () => {
  it('does not search before any term is added', () => {
    expect(searchArticles).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Add a term to see matching publications.');
  });

  it('searches with the built query as soon as a term is added, and shows the results', async () => {
    await addTerm('cancer');
    await flushPromises();

    expect(searchedQueries()).toEqual(['cancer']);
    expect(wrapper.text()).toContain('Title a');
    expect(wrapper.text()).toContain('Title b');
  });

  it('searches again each time the query changes', async () => {
    await addTerm('cancer');
    await addTerm('melanoma', 'NOT');
    await wrapper.get('select').setValue('OR');
    await flushPromises();

    expect(searchedQueries()).toEqual(['cancer', 'cancer NOT melanoma', 'cancer OR melanoma']);
  });

  it('goes back to the prompt, without searching, when every term is removed', async () => {
    await addTerm('cancer');
    await flushPromises();
    await removeButton('cancer').trigger('click');
    await flushPromises();

    expect(searchArticles).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Add a term to see matching publications.');
  });
});

describe('SearchWorkspaceView: the URL and page title', () => {
  it('loads the terms from the URL on arrival and searches them', async () => {
    wrapper.unmount();
    await mountView('/?t=cancer&t=NOT:melanoma');
    await flushPromises();

    expect(preview()).toBe('cancer NOT melanoma');
    expect(searchedQueries()).toEqual(['cancer NOT melanoma']);
  });

  it('writes the terms to the URL as the query is built', async () => {
    await addTerm('cancer');
    await addTerm('melanoma', 'NOT');
    await flushPromises();

    expect(router.currentRoute.value.query.t).toEqual(['cancer', 'NOT:melanoma']);
  });

  it('removes the terms from the URL when they are cleared', async () => {
    await addTerm('cancer');
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear all')
      .trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.query.t).toBeUndefined();
  });

  it('restores the previous query with the Back button', async () => {
    await addTerm('cancer');
    await flushPromises();
    await addTerm('melanoma', 'NOT');
    await flushPromises();

    router.back();
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve));
    await flushPromises();

    expect(preview()).toBe('cancer');
  });

  it('names the page after the query, for tabs, history and screen readers', async () => {
    await addTerm('cancer');
    await flushPromises();
    expect(document.title).toBe('cancer – Research Search Workspace');

    await removeButton('cancer').trigger('click');
    await flushPromises();
    expect(document.title).toBe('Research Search Workspace');
  });
});
