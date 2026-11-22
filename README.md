# Research Search Workspace

Build and refine a literature search over [Europe PMC](https://europepmc.org) without learning
search syntax: combine keywords with AND, OR and NOT, see the query as it is built, and page through
matching publications.

Built with Vue 3, Pinia, Vue Router, Tailwind CSS v4 and Vitest.

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- npm 10+

## Install and run

```sh
npm install
npm run dev          # http://localhost:5173
```

## Test

```sh
npm test             # run the test suite once
npm run test:unit    # watch mode
npm run test:coverage
```

## Other scripts

```sh
npm run build        # production build into dist/
npm run preview      # serve the production build
npm run lint         # oxlint, then ESLint (auto-fixes)
npm run format       # Prettier (also sorts Tailwind classes)
npm run format:check
```

## Project structure

```
src/
  assets/main.css     Tailwind entry and design tokens
  components/layout/  app frame: skip link, header, footer
  router/             routes
  views/              the search workspace page
```

## Build plan

The app is built one area per commit, each with its tests:

1. **Base setup and layout**: toolchain, design tokens, accessible app frame
2. Query building logic: pure functions that turn terms into a Europe PMC query
3. Query builder UI and store
4. HTTP layer and Europe PMC service: typed errors, cancellable requests, response mapping
5. Search store: status, cursor-based next/previous pagination, race handling
6. Results UI: list, loading, empty and error states, pagination controls
7. URL sync, accessibility pass, and final notes

## Engineering notes

_To be written as the build progresses: main decisions, trade-offs, known limitations._

## AI-assisted development reflection

_To be written at the end._
