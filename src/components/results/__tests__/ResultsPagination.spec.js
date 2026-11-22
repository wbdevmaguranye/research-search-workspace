import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultsPagination from '../ResultsPagination.vue';

const mountPagination = (props) =>
  mount(ResultsPagination, {
    props: { page: 2, pageCount: 11197, hasPrevious: true, hasNext: true, ...props },
  });

const button = (wrapper, name) => wrapper.findAll('button').find((b) => b.text().includes(name));

describe('ResultsPagination', () => {
  it('is a labelled navigation region', () => {
    expect(mountPagination().get('nav').attributes('aria-label')).toBe('Results pages');
  });

  it('shows the current page and page count, formatted', () => {
    expect(mountPagination().text()).toContain('Page 2 of 11,197');
  });

  it('emits previous and next', async () => {
    const wrapper = mountPagination();
    await button(wrapper, 'Previous').trigger('click');
    await button(wrapper, 'Next').trigger('click');
    expect(wrapper.emitted('previous')).toHaveLength(1);
    expect(wrapper.emitted('next')).toHaveLength(1);
  });

  it('disables Previous on the first page and Next on the last', () => {
    const first = mountPagination({ page: 1, hasPrevious: false });
    expect(button(first, 'Previous').attributes('disabled')).toBeDefined();
    expect(button(first, 'Next').attributes('disabled')).toBeUndefined();

    const last = mountPagination({ page: 11197, hasNext: false });
    expect(button(last, 'Next').attributes('disabled')).toBeDefined();
  });
});
