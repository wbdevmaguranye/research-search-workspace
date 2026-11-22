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
  components/query/   query builder: term form, term list, query preview
  router/             routes
  services/           network: fetch wrapper and the Europe PMC search service
  stores/             app state: query terms, search results and paging
  utils/              pure logic: query building
  views/              the search workspace page
```

## Build plan

Built layer by layer, bottom up (utils → services → stores → components), one area per commit,
each with its tests:

1. **Base setup and layout**: toolchain, design tokens, accessible app frame
2. **Query building logic**: pure functions that turn terms into a Europe PMC query
3. **HTTP layer and Europe PMC service**: typed errors, cancellable requests, response mapping
4. **Stores**: query terms, and search status with cursor-based next/previous pagination
5. **Query builder UI**: term form, editable term list, live query preview
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

### API connection

- **Requests never throw.** `services/http.js` resolves every call to `{ ok: true, data }` or
  `{ ok: false, error: { kind, status, message } }`, where `kind` is `network`, `http`, `timeout`,
  `parse` or `aborted`. This follows the data-layer pattern of a previous project, adding typed
  errors, cancellation and a 15-second timeout. It is a plain module, not a Pinia store, as it
  holds no state.
- **Requests can be cancelled** with an `AbortSignal`, so a newer search can cancel an older one.
- **Plain `fetch`, no HTTP library.** Europe PMC allows cross-origin requests
  (`Access-Control-Allow-Origin: *`), so no backend or proxy is needed.
- Findings from testing the live API, each covered by a test:
  - Some errors arrive as **HTTP 200** with `errCode`/`errMsg` in the body (e.g. an empty query),
    so the service checks the body as well as the status.
  - **The last page still returns a `nextCursorMark`**, which leads to an empty page. Whether a
    next page exists is therefore worked out from `hitCount`, not from the cursor.
  - About half of titles contain markup, either as tags (`<i>E. coli</i>`) or entity-encoded
    (`&lt;i&gt;`). Titles are converted to plain text and never rendered as HTML.

### State

- **Two Pinia setup stores that don't depend on each other.** `queryStore` holds the terms and
  builds the query; `searchStore` takes a query string and handles results and paging. The page
  connects them, so each store is tested on its own.
- **One status value**: `idle | loading | success | empty | error`, so the UI can't show two
  states at once (e.g. loading and error).
- **Previous on a forward-only API.** Europe PMC pages with `cursorMark`, which only moves forward.
  The store keeps a stack of the cursors it has visited: Next pushes, Previous pops and re-requests.
- **No stale results.** Each new request cancels the one before it, and a cancelled response is
  ignored even if it arrives late.
- **Errors keep your place.** If a page fails to load, the page number doesn't change, and Retry
  repeats exactly the request that failed.

### Query builder UI

- **Presentational components, one connecting view.** The form, term list and preview take props
  and emit events; `SearchWorkspaceView` connects them to the store.
- **Operators are explained, not just named.** AND / OR / NOT is a radio group showing "must
  include", "either one" and "must not include", for researchers new to search syntax.
- **Accessibility built in:** every control is labelled; errors set `aria-invalid` and are
  announced; the query preview is a polite live region; remove buttons are named after their term
  ("Remove melanoma"); and focus moves to the next term after a removal (or back to the input once
  the list is empty) instead of being lost.
- **Checked in a real browser**, not only in jsdom: keyboard-only use, phone width, and an axe-core
  audit of the production build (0 violations).

### Styling

- Tailwind's default palette is switched off; only our design tokens exist, and every colour
  pairing used in the UI is tested against WCAG 2.2 AA contrast. Trade-off: a stray palette
  class (`text-gray-600`) produces no style rather than an error.

### Known limitations

- No field-specific search (title, author, abstract).
- Titles lose their italics (e.g. species names), as markup is stripped rather than rendered.
- Previous re-requests the page rather than caching it: simpler and always fresh, at the cost of a
  request.
- Removing the first term promotes the next one, dropping its operator (`cancer NOT melanoma`
  becomes `melanoma`). The query preview shows the change.
- Needs a browser from 2024 or later (`AbortSignal.any`: Chrome 116, Firefox 124, Safari 17.4).

_More to be added as the build progresses._

## AI-assisted development reflection

_To be written at the end._
