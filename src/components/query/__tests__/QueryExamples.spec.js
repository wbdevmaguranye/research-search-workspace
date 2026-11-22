import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryExamples from '../QueryExamples.vue';

describe('QueryExamples', () => {
  it('offers each example as a button showing the exact query it builds', () => {
    const wrapper = mount(QueryExamples);
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual([
      'cancer AND immunotherapy NOT melanoma',
      '(tumour OR tumor) NOT benign',
      '"breast cancer" AND screening',
      'tardigrade AND "radiation tolerance"',
    ]);
  });

  it('is a list labelled "Try an example"', () => {
    const wrapper = mount(QueryExamples);
    const labelId = wrapper.get('ul').attributes('aria-labelledby');
    expect(wrapper.get(`#${labelId}`).text()).toBe('Try an example:');
  });

  it('emits the example terms when one is chosen', async () => {
    const wrapper = mount(QueryExamples);
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('select')).toEqual([
      [
        [
          { value: 'tumour' },
          { value: 'tumor', operator: 'OR' },
          { value: 'benign', operator: 'NOT' },
        ],
      ],
    ]);
  });
});
