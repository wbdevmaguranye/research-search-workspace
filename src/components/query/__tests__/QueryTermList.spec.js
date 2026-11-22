import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryTermList from '../QueryTermList.vue';

const terms = [
  { id: 1, operator: 'AND', value: 'cancer' },
  { id: 2, operator: 'AND', value: 'immunotherapy' },
  { id: 3, operator: 'NOT', value: 'melanoma' },
];

describe('QueryTermList', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(QueryTermList, { props: { terms } });
  });

  it('lists the terms in order under a heading', () => {
    expect(wrapper.get('h3').text()).toBe('Your terms');
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual([
      expect.stringContaining('cancer'),
      expect.stringContaining('immunotherapy'),
      expect.stringContaining('melanoma'),
    ]);
  });

  it('keeps list semantics, which Safari drops when list styling is removed', () => {
    expect(wrapper.get('ol').attributes('role')).toBe('list');
  });

  it('shows a labelled operator select for every term except the first', () => {
    const [first, second, third] = wrapper.findAll('li');
    expect(first.find('select').exists()).toBe(false);

    const select = third.get('select');
    expect(select.element.value).toBe('NOT');
    expect(third.get(`label[for="${select.attributes('id')}"]`).text()).toBe(
      'How to combine melanoma',
    );
    expect(second.get('select').element.value).toBe('AND');
  });

  it('emits the new operator when a select changes', async () => {
    await wrapper.findAll('select')[0].setValue('OR');
    expect(wrapper.emitted('update-operator')).toEqual([[2, 'OR']]);
  });

  it('names each remove button after its term and emits its id', async () => {
    const buttons = wrapper.findAll('button[data-remove]');
    expect(buttons.map((b) => b.attributes('aria-label'))).toEqual([
      'Remove cancer',
      'Remove immunotherapy',
      'Remove melanoma',
    ]);

    await buttons[1].trigger('click');
    expect(wrapper.emitted('remove')).toEqual([[2]]);
  });

  it('emits clear from the Clear all button', async () => {
    const clearAll = wrapper.findAll('button').find((b) => b.text() === 'Clear all');
    await clearAll.trigger('click');
    expect(wrapper.emitted('clear')).toHaveLength(1);
  });
});
