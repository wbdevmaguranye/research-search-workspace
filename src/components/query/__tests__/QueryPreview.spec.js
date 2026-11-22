import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryPreview from '../QueryPreview.vue';

describe('QueryPreview', () => {
  it('shows the query exactly as it will be searched', () => {
    const wrapper = mount(QueryPreview, { props: { query: '(tumour OR tumor) NOT benign' } });
    expect(wrapper.get('output code').text()).toBe('(tumour OR tumor) NOT benign');
  });

  it('explains what will appear while there is no query', () => {
    const wrapper = mount(QueryPreview, { props: { query: '' } });
    expect(wrapper.find('code').exists()).toBe(false);
    expect(wrapper.get('output').text()).toBe('Your query will appear here as you add terms.');
  });

  it('announces changes to screen readers', () => {
    const wrapper = mount(QueryPreview, { props: { query: 'cancer' } });
    expect(wrapper.get('output').attributes('aria-live')).toBe('polite');
  });
});
