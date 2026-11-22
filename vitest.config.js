import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults, coverageConfigDefaults } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,vue}'],
        exclude: [...coverageConfigDefaults.exclude, 'src/main.js'],
      },
    },
  }),
);
