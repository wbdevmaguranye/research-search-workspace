import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchResults from '../SearchResults.vue';

const article = (id) => ({ id, title: `Title ${id}`, authors: 'Doe J.', year: '2024', url: '#' });

let wrapper;

const mountResults = (props = {}) => {
  wrapper = mount(SearchResults, {
    props: {
      status: 'success',
      query: 'cancer',
      articles: [article('a'), article('b')],
      hitCount: 60,
      page: 2,
      pageCount: 3,
      hasPrevious: true,
      hasNext: true,
      error: null,
      ...props,
    },
    attachTo: document.body,
  });
  return wrapper;
};

const announcement = () => wrapper.get('[aria-live="polite"]').text();
const button = (name) => wrapper.findAll('button').find((b) => b.text().includes(name));

describe('SearchResults', () => {
  afterEach(() => wrapper.unmount());

  it('is a region labelled by its heading', () => {
    mountResults();
    const id = wrapper.get('section').attributes('aria-labelledby');
    expect(wrapper.get(`#${id}`).text()).toBe('Results');
  });

  it('prompts for a term before anything is searched', () => {
    mountResults({ status: 'idle', articles: [] });
    expect(wrapper.text()).toContain('Add a term to see matching publications.');
    expect(wrapper.find('ol').exists()).toBe(false);
    expect(announcement()).toBe('');
  });

  it('shows placeholder cards, hidden from screen readers, while loading', () => {
    mountResults({ status: 'loading' });
    expect(wrapper.get('[aria-busy="true"]').text()).toContain('Loading results');
    expect(wrapper.get('[data-skeleton]').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('ol').exists()).toBe(false);
  });

  it('lists the results, numbered from where this page starts', () => {
    mountResults();
    const list = wrapper.get('ol');
    expect(list.attributes('start')).toBe('26');
    expect(list.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('Showing 26–27 of 60 results');
  });

  it('announces the count and page when results arrive', () => {
    mountResults({ hitCount: 279912, page: 1, pageCount: 11197 });
    expect(announcement()).toBe('279,912 results. Page 1 of 11,197.');
  });

  it('uses the singular for one result', () => {
    mountResults({ hitCount: 1, page: 1, pageCount: 1, articles: [article('a')] });
    expect(announcement()).toBe('1 result. Page 1 of 1.');
  });

  it('explains an empty result and suggests what to try', () => {
    mountResults({ status: 'empty', query: 'zzqqxx', articles: [], hitCount: 0 });
    expect(wrapper.get('code').text()).toBe('zzqqxx');
    expect(wrapper.text()).toContain('Try removing a term');
    expect(announcement()).toBe('No results found.');
  });

  it('shows the error with a Try again button that emits retry', async () => {
    const error = { kind: 'network', status: null, message: 'Could not reach the server.' };
    mountResults({ status: 'error', error });

    expect(wrapper.text()).toContain('Could not reach the server.');
    expect(announcement()).toBe('Search failed. Could not reach the server.');
    await button('Try again').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('keeps the paging bar in place while the next page loads, with its buttons disabled', () => {
    mountResults({ status: 'loading' });
    const buttons = wrapper.get('nav').findAll('button');
    expect(buttons.map((b) => b.attributes('disabled'))).toEqual(['', '']);
  });

  it('scrolls the results back to the top when new results start loading', async () => {
    mountResults();
    let scrolledTo;
    Object.defineProperty(wrapper.get('[data-results-body]').element, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: (value) => (scrolledTo = value),
    });

    await wrapper.setProps({ status: 'loading' });
    expect(scrolledTo).toBe(0);
  });

  it('also scrolls to the top when another page appears straight from the cache', async () => {
    mountResults();
    let scrolledTo;
    Object.defineProperty(wrapper.get('[data-results-body]').element, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: (value) => (scrolledTo = value),
    });

    await wrapper.setProps({ page: 3, articles: [article('c')] });
    expect(scrolledTo).toBe(0);
  });

  it('hides paging when everything fits on one page', () => {
    mountResults({ page: 1, pageCount: 1, hasPrevious: false, hasNext: false });
    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('emits next and moves focus to the heading, so keyboard users start at the top', async () => {
    mountResults();
    await button('Next').trigger('click');

    expect(wrapper.emitted('next')).toHaveLength(1);
    expect(document.activeElement).toBe(wrapper.get('h2').element);
  });

  it('does the same for previous', async () => {
    mountResults();
    await button('Previous').trigger('click');

    expect(wrapper.emitted('previous')).toHaveLength(1);
    expect(document.activeElement).toBe(wrapper.get('h2').element);
  });
});
