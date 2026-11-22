import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    name: 'app/vue-conventions',
    rules: {
      // <script setup> before <template>
      'vue/block-order': ['error', { order: ['script', 'template'] }],
      // No <style> blocks: Tailwind classes only
      'vue/no-restricted-block': [
        'error',
        {
          element: 'style',
          message: 'Use Tailwind classes. Shared CSS belongs in src/assets/main.css (@theme / @layer).',
        },
      ],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/**'],
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
])
