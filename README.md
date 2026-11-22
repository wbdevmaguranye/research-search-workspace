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
  utils/              pure logic: query building
  views/              the search workspace page
```

## Build plan

Built layer by layer, bottom up (utils → services → stores → components), one area per commit,
each with its tests:

1. **Base setup and layout**: toolchain, design tokens, accessible app frame
2. **Query building logic**: pure functions that turn terms into a Europe PMC query
3. HTTP layer and Europe PMC service: typed errors, cancellable requests, response mapping
4. Stores: query terms, and search status with cursor-based next/previous pagination
5. Query builder UI
6. Results UI: list, loading, empty and error states, pagination controls
7. URL sync, accessibility pass, and final notes

## Engineering notes

### Query building

- **User input is searched literally.** Phrases, words containing search syntax (`covid-19`,
  `a:b`) and bare `AND`/`OR`/`NOT` are quoted. Researchers don't need to know the syntax, but
  field searches such as `TITLE:cancer` are not supported (see limitations).
- **Brackets make the order explicit.** When a query switches between AND/NOT and OR, everything
  so far is bracketed: `a OR b`, then `AND c`, becomes `(a OR b) AND c`. Tested against the live
  API, unbracketed `malaria AND vaccine OR dengue` returned 293k results, matching neither
  `(malaria AND vaccine) OR dengue` (149k) nor `malaria AND (vaccine OR dengue)` (70k).
- **The first term's operator is ignored**, since there is nothing before it to combine with.

### Styling

- Tailwind's default palette is switched off; only our design tokens exist, and every colour
  pairing used in the UI is tested against WCAG 2.2 AA contrast. Trade-off: a stray palette
  class (`text-gray-600`) produces no style rather than an error.

### Known limitations

- No field-specific search (title, author, abstract).

_More to be added as the build progresses._

## AI-assisted development reflection

_To be written at the end._
