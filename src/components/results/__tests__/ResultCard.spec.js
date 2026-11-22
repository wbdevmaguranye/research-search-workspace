import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultCard from '../ResultCard.vue';

const article = {
  id: 'MED-43020206',
  title: 'Microneedle-based delivery strategies for cancer immunotherapy.',
  authors: 'van Hulst IA, Ossendorp F, van der Maaden K.',
  year: '2026',
  url: 'https://europepmc.org/article/MED/43020206',
};

describe('ResultCard', () => {
  it('links the title to the article on Europe PMC, in a new tab', () => {
    const link = mount(ResultCard, { props: { article } }).get('h3 a');
    expect(link.attributes('href')).toBe(article.url);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener');
  });

  it('tells screen reader users the link opens a new tab', () => {
    const link = mount(ResultCard, { props: { article } }).get('h3 a');
    expect(link.get('.sr-only').text()).toBe('(opens in a new tab)');
  });

  it('shows the title, authors and year', () => {
    const text = mount(ResultCard, { props: { article } }).text();
    expect(text).toContain(article.title);
    expect(text).toContain(article.authors);
    expect(text).toContain('2026');
  });

  it('says when details are missing rather than leaving gaps', () => {
    const bare = { ...article, title: '', authors: '', year: '' };
    const text = mount(ResultCard, { props: { article: bare } }).text();
    expect(text).toContain('Untitled');
    expect(text).toContain('Authors not listed');
    expect(text).toContain('Year not listed');
  });
});
