# Research Search Workspace: working rules

A Vue 3 prototype for building Europe PMC literature searches (EMBL-EBI front-end exercise).
These rules apply to every change, whoever or whatever writes it.

## Stack

- Vue 3 `<script setup>` single-file components, **JavaScript** (no TypeScript), Composition API only.
- Pinia **setup stores** (`defineStore('name', () => { ... })`), Vue Router, Tailwind CSS v4.
- Vitest + @vue/test-utils + jsdom. Tests live in `__tests__/` next to the code they test.
- No HTTP library: `fetch` + `AbortController`.

## Architecture

```
utils/      pure functions, no Vue, no I/O (e.g. query building). Easiest to test; test them hardest.
services/   all network I/O. Never throws: returns { ok: true, data } or { ok: false, error }.
stores/     app state and async orchestration. Exposes an explicit status, never just a boolean.
components/ presentational; props in, events out. layout/, query/, results/, ui/.
views/      composes components with stores. Thin.
```

- **Errors are values.** The service layer turns every failure into `{ kind, status, message }`
  (`kind`: `network` | `http` | `timeout` | `parse` | `aborted`). Stores map that to UI state. No
  `console.log` as error handling.
- **Never render API HTML.** Text from the API is converted to plain text in the service; no `v-html`.
- **Async requests cancel their predecessor.** A newer search or page change aborts the in-flight
  request, so a stale response can never overwrite a newer one.
- **Search status is one value:** `idle | loading | success | empty | error`.

## UI and accessibility (WCAG 2.2 AA)

- Single-file components are ordered `<script setup>` then `<template>`. **No `<style>` blocks**:
  style with Tailwind classes. Custom CSS lives only in `src/assets/main.css` (`@theme` tokens,
  `@layer base` defaults, or a named `@utility` when classes genuinely can't express it). Both
  rules are enforced by ESLint (`vue/block-order`, `vue/no-restricted-block`).
- No magic-number positioning (`left: 57px`): lay things out with flex/grid.
- Use the design tokens in `src/assets/main.css` (`bg-surface`, `text-muted`, `text-accent`...).
  Tailwind's default palette is switched off (`--color-*: initial`), so classes like `text-gray-600`
  produce no style at all. Never use hex values in components. A new colour is a new token, plus a
  pairing in `designTokens.spec.js`.
- Native elements first: `<button>` for actions, `<a>` for navigation, `<label>` for every input.
- One `h1` per page, then headings in order. Regions use `aria-labelledby`.
- Status changes (results loaded, errors) are announced through an `aria-live` region.
- Every interactive element is keyboard reachable with a visible focus ring. Respect reduced motion.

## Comments

- One line, short, plain English. Say why, not what the code already says.
- No multi-line comment blocks or JSDoc paragraphs. Longer reasoning goes in the README's
  Engineering notes.

## Before every commit

```sh
npm run lint && npm run format:check && npm test && npm run build
```

Commit messages: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), one area per commit.
