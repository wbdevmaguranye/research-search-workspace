import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SearchWorkspaceView from '../SearchWorkspaceView.vue';

let wrapper;

// Adds a term through the UI, the way a user would
const addTerm = async (value, operator) => {
  if (operator) await wrapper.get(`input[type="radio"][value="${operator}"]`).setValue();
  await wrapper.get('input[type="text"]').setValue(value);
  await wrapper.get('form').trigger('submit');
};

const preview = () => wrapper.get('output').text();
const removeButton = (value) => wrapper.get(`button[aria-label="Remove ${value}"]`);

describe('SearchWorkspaceView: building a query', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    wrapper = mount(SearchWorkspaceView, { attachTo: document.body });
  });

  afterEach(() => wrapper.unmount());

  it('builds the example from the brief', async () => {
    await addTerm('cancer');
    await addTerm('immunotherapy', 'AND');
    await addTerm('melanoma', 'NOT');

    expect(wrapper.findAll('li')).toHaveLength(3);
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

    expect(wrapper.find('ol').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('input[type="text"]').element);
  });

  it('clears every term and returns focus to the input', async () => {
    await addTerm('cancer');
    await addTerm('immunotherapy');
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear all')
      .trigger('click');

    expect(wrapper.find('ol').exists()).toBe(false);
    expect(preview()).toBe('Your query will appear here as you add terms.');
    expect(document.activeElement).toBe(wrapper.get('input[type="text"]').element);
  });
});
