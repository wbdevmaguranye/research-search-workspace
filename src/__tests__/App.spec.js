import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

import App from '@/App.vue';
import { routes } from '@/router';

const mountApp = async (path = '/') => {
  const router = createRouter({ history: createMemoryHistory(), routes });
  const pinia = createPinia();
  setActivePinia(pinia);

  router.push(path);
  await router.isReady();

  const wrapper = mount(App, { global: { plugins: [router, pinia] } });
  return { wrapper, router };
};

describe('App layout', () => {
  let wrapper;

  beforeEach(async () => {
    ({ wrapper } = await mountApp());
  });

  it('renders one of each page landmark', () => {
    expect(wrapper.findAll('header')).toHaveLength(1);
    expect(wrapper.findAll('main')).toHaveLength(1);
    expect(wrapper.findAll('footer')).toHaveLength(1);
  });

  it('starts with a skip link that targets a focusable main element', () => {
    const skipLink = wrapper.find('a');
    const main = wrapper.find('main');

    expect(skipLink.text()).toBe('Skip to main content');
    expect(skipLink.attributes('href')).toBe(`#${main.attributes('id')}`);
    expect(main.attributes('tabindex')).toBe('-1');
  });

  it('has a single h1, and each h2 labels its own region', () => {
    expect(wrapper.findAll('h1')).toHaveLength(1);

    const headings = wrapper.findAll('h2');
    expect(headings.map((h) => h.text())).toEqual(['Build your query', 'Results']);
    for (const heading of headings) {
      const section = heading.element.closest('section');
      expect(section.getAttribute('aria-labelledby')).toBe(heading.attributes('id'));
    }
  });
});

describe('Routing', () => {
  it('sends unknown paths back to the search workspace', async () => {
    const { router } = await mountApp('/does-not-exist');
    expect(router.currentRoute.value.name).toBe('search');
  });
});
