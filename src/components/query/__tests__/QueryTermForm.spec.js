import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import QueryTermForm from '../QueryTermForm.vue';

let wrapper;

const mountForm = (props = {}) => {
  wrapper = mount(QueryTermForm, { props, attachTo: document.body });
  return wrapper;
};

const input = () => wrapper.get('input[type="text"]');
const submit = () => wrapper.get('form').trigger('submit');

describe('QueryTermForm', () => {
  afterEach(() => wrapper.unmount());

  it('has a labelled text input and an Add button', () => {
    mountForm();
    const id = input().attributes('id');
    expect(wrapper.get(`label[for="${id}"]`).text()).toBe('Keyword or phrase');
    expect(wrapper.get('button[type="submit"]').text()).toBe('Add');
  });

  it('offers no operator choice for the first term', () => {
    mountForm({ hasTerms: false });
    expect(wrapper.find('fieldset').exists()).toBe(false);
  });

  it('offers AND, OR and NOT as a labelled radio group once terms exist, AND by default', () => {
    mountForm({ hasTerms: true });
    expect(wrapper.get('legend').text()).toBe('Combine with');

    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.map((r) => r.attributes('value'))).toEqual(['AND', 'OR', 'NOT']);
    expect(radios[0].element.checked).toBe(true);
  });

  it('explains the chosen operator in one line, linked to the group', async () => {
    mountForm({ hasTerms: true });
    const hintId = wrapper.get('fieldset').attributes('aria-describedby');
    expect(wrapper.get(`#${hintId}`).text()).toBe('Results must also include this term.');

    await wrapper.get('input[value="NOT"]').setValue();
    expect(wrapper.get(`#${hintId}`).text()).toBe('Results must not include this term.');
  });

  it('emits the term and operator, then clears the input and keeps focus there', async () => {
    mountForm({ hasTerms: true });
    await wrapper.get('input[value="NOT"]').setValue();
    await input().setValue('melanoma');
    await submit();

    expect(wrapper.emitted('add')).toEqual([[{ value: 'melanoma', operator: 'NOT' }]]);
    expect(input().element.value).toBe('');
    expect(document.activeElement).toBe(input().element);
  });

  it('goes back to AND after adding a term', async () => {
    mountForm({ hasTerms: true });
    await wrapper.get('input[value="OR"]').setValue();
    await input().setValue('tumor');
    await submit();

    expect(wrapper.get('input[value="AND"]').element.checked).toBe(true);
  });

  it.each([
    ['', 'Enter a keyword or phrase.'],
    ['or', 'OR is an operator: choose it from the list instead.'],
  ])('refuses %j with an announced, linked error message', async (value, message) => {
    mountForm();
    await input().setValue(value);
    await submit();

    const alert = wrapper.get('[role="alert"]');
    expect(alert.text()).toBe(message);
    expect(input().attributes('aria-invalid')).toBe('true');
    expect(input().attributes('aria-describedby')).toBe(alert.attributes('id'));
    expect(wrapper.emitted('add')).toBeUndefined();
    expect(document.activeElement).toBe(input().element);
  });

  it('clears the error as soon as the user types', async () => {
    mountForm();
    await submit();
    await input().setValue('c');

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(input().attributes('aria-invalid')).toBeUndefined();
  });

  it('lets the page move focus to the input', () => {
    mountForm();
    wrapper.vm.focus();
    expect(document.activeElement).toBe(input().element);
  });
});
