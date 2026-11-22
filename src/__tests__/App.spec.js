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

  it('has a single h1 and labelled query and results regions', () => {
    expect(wrapper.findAll('h1')).toHaveLength(1);

    for (const headingId of ['query-heading', 'results-heading']) {
      const section = wrapper.find(`section[aria-labelledby="${headingId}"]`);
      expect(section.exists()).toBe(true);
      expect(section.find(`#${headingId}`).element.tagName).toBe('H2');
    }
  });
});

describe('Routing', () => {
  it('sends unknown paths back to the search workspace', async () => {
    const { router } = await mountApp('/does-not-exist');
    expect(router.currentRoute.value.name).toBe('search');
  });
});
