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

## Try it

Click one of the **example searches** under the search box, or type a term and press **Add**;
choose AND, OR or NOT before each later term. Results update as the query changes. Counts were
checked against the live API in November 2026 and will grow.

| Terms to add                                       | Query built                                         | Shows                            |
| -------------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| `cancer`, AND `immunotherapy`, NOT `melanoma`      | `cancer AND immunotherapy NOT melanoma`             | The brief's example (~280k)      |
| `tumour`, OR `tumor`, NOT `benign`                 | `(tumour OR tumor) NOT benign`                      | Brackets added automatically     |
| `breast cancer`, AND `screening`                   | `"breast cancer" AND screening`                     | Phrases are quoted               |
| `covid-19`, AND `vaccine`                          | `"covid-19" AND vaccine`                            | Hyphens searched literally       |
| `Escherichia coli`, AND `antimicrobial resistance` | `"Escherichia coli" AND "antimicrobial resistance"` | Titles with markup, cleaned      |
| `tardigrade`, AND `radiation tolerance`            | `tardigrade AND "radiation tolerance"`              | Two pages: page to the end (~43) |
| `zzqqxxnotaword`                                   | `zzqqxxnotaword`                                    | The empty state                  |
| _(Add with an empty box)_, or `OR`                 | _(nothing searched)_                                | Validation messages              |

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
  components/query/   query builder: term form, term list, query preview, examples
  components/results/ results: states, result cards, pagination
  router/             routes
  services/           network: fetch wrapper and the Europe PMC search service
  stores/             app state: query terms, search results and paging
  utils/              pure logic: query building, terms to and from the URL
  views/              the search workspace page
CLAUDE.md             working rules for the AI assistant (and for people)
```

## Build plan

Built layer by layer, bottom up (utils → services → stores → components), one area per commit,
each with its tests:

1. **Base setup and layout**: toolchain, design tokens, accessible app frame
2. **Query building logic**: pure functions that turn terms into a Europe PMC query
3. **HTTP layer and Europe PMC service**: typed errors, cancellable requests, response mapping
4. **Stores**: query terms, and search status with cursor-based next/previous pagination
5. **Query builder UI**: term form, editable term list, live query preview
6. **Results UI**: automatic search, list, loading, empty and error states, pagination
7. **URL sync, accessibility pass, and final notes**: shareable searches, Back/Forward, page title

## Engineering notes

### Query building

- **User input is searched literally.** Phrases, words containing search syntax (`covid-19`,
  `a:b`) and bare `AND`/`OR`/`NOT` are quoted. Researchers don't need to know the syntax, but
  field searches such as `TITLE:cancer` are not supported (see limitations).
- **Brackets make the order explicit.** When a query switches between AND/NOT and OR, everything
  so far is bracketed: `a OR b`, then `AND c`, becomes `(a OR b) AND c`. Tested against the live
  API, unbracketed `a AND b OR c` returns exactly the same results as `a` alone: the engine
  silently drops the other terms (`malaria AND vaccine OR dengue` and `malaria` both return
  293,407). Bracketed, `(malaria AND vaccine) OR dengue` returns 149,341.
- **The first term's operator is ignored**, since there is nothing before it to combine with.

### API connection

- **Requests never throw.** `services/http.js` resolves every call to `{ ok: true, data }` or
  `{ ok: false, error: { kind, status, message } }`, where `kind` is `network`, `http`, `timeout`,
  `parse` or `aborted`. This follows the data-layer pattern of a previous project, adding typed
  errors, cancellation and a 30-second timeout. It is a plain module, not a Pinia store, as it
  holds no state.
- **Why 30 seconds:** queries Europe PMC hasn't cached took 11-13s in testing, and a first
  15-second limit failed a real search ("sepsis biomarker"). Cached queries return in under a
  second.
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

- **A workspace layout, like GitHub's: query panel on the left, results filling the rest.** The
  panel runs full height, stays put while results scroll, scrolls on its own if the terms outgrow
  the screen, and pins the query preview at its top. Below 1024px it stacks above the results.
- **How the layout was reached** (each step measured in a real browser):
  1. A sidebar _card_: with 12 terms it grew to 1,086px and pushed the query preview off screen.
  2. A search bar above the results: compact (12 terms in 426px), but left about 380px empty on
     each side of a 1920px screen.
  3. The workspace layout: uses the full width (result cards 1,104px → 1,472px at 1920px) and
     keeps the query visible with 20 terms, at any scroll position.
- **Patterns borrowed from established tools.** PubMed's Advanced Search Builder puts operator,
  term and Add in one row with a query box; EMBL-EBI's Visual Framework search pattern shows
  example searches under the box; design-system "combo search" patterns show terms as chips.
- **Components adapt to their space, not the screen.** Tailwind v4 container queries (`@container`,
  `@lg:`) put the form on one row when it has room (full width on a tablet) and stack it in the
  narrow panel, with no special cases.
- **Operators are explained, not just named.** AND / OR / NOT is a compact segmented control (a
  real radio group) with one line describing the current choice, e.g. "Results must not include
  this term."
- **Example searches** load a ready-made query in one click and search it once; they show only
  until the first term is added.
- **Presentational components, one connecting view.** The form, term list, examples and preview
  take props and emit events; `SearchWorkspaceView` connects them to the store.
- **Accessibility built in:** every control is labelled; errors set `aria-invalid` and are
  announced; the query preview is a polite live region; remove buttons are named after their term
  ("Remove melanoma"); and focus moves to the next term after a removal (or back to the input once
  the list is empty) instead of being lost.
- **Checked in a real browser**, not only in jsdom: keyboard-only use, phone width, and an axe-core
  audit of the production build (0 violations).

### Results UI

- **Search runs as the query changes**, with no Search button, so refining is immediate. Safe
  because each new request cancels the previous one.
- **An app shell on large screens: only the results scroll.** Header, footer, query panel, the
  Results heading and the paging bar stay fixed; the results list scrolls on its own with a thin
  brand-orange scrollbar (`scrollbar-brand` in `main.css`). New results reset it to the top. On
  phones the page scrolls normally and the paging bar sticks to the bottom of the screen.
- **25 results per page**, as the brief asks. While the next page loads, the paging bar stays in
  place with its buttons disabled, so the layout doesn't jump and double clicks can't skip pages.
- **A gotcha found in the browser:** screen-reader-only text (`sr-only`, absolutely positioned)
  inside a scroll area with no positioned ancestor stretched the page to 3,000px, bringing back
  a page scrollbar. Making each scroll area `relative` keeps that text inside it.
- **Every state has its own view**: a prompt before searching, placeholder cards while loading
  (animated only if the user allows motion), results, an empty state with suggestions, and an
  error with **Try again**.
- **Screen readers hear outcomes, not every step**: "279,912 results. Page 1 of 11,197.", "No
  results found." or the error. "Loading" isn't announced, as every query change searches.
- **Paging moves focus to the Results heading**, so keyboard and screen reader users start at the
  top of the new page. The list is an `<ol>` numbered from where the page starts (26, 27…).
- **Article links open in a new tab**, announced as "(opens in a new tab)", so researchers can
  open several articles and keep their place in the results.
- **Checked against the live API in a real browser**: paging to the last page, the empty state,
  a simulated network failure with Try again, and axe-core on the production build (0 violations).

### Pagination: why Next / Previous, not numbered pages

Numbered pages (`1 2 3 … 34`) were considered and investigated against the live API:

- **The API can't jump to a page.** Its `page` parameter is ignored: page 3, 400 and 11,197 all
  returned page 1. Only `cursorMark` paging works, and each cursor comes from the page before it.
- **Jumping is possible, but its cost grows with distance.** A cursor can skip results with one
  ID-only request (`resultType=idlist`); skipping 50 results landed on exactly the same page 3 as
  walking the cursors. But each request covers at most 1,000 results, so reaching page 400 took
  10 requests and 75 seconds, and the last page of the brief's example would need about 280.
- **Decision: keep Next / Previous**, which is what the brief asks for. Deep page-jumping would add
  the most complex code in the app for little value: page 34 of 279,912 results is no more
  relevant than page 1. Researchers narrow a large result set instead, which here means adding a
  term (adding `AND` a term _is_ searching within the results).
- **If numbered pages were needed**, the practical version would cap at the first 1,000 results
  (40 pages), as Google Scholar does, so any jump costs at most one extra request.

### URL and history

- **The search lives in the URL**: `?t=cancer&t=AND:immunotherapy&t=NOT:melanoma`, one `t` per
  term with its operator as a prefix. A search can be bookmarked, shared and refreshed.
- **Each change is a history entry**, so the browser's Back button undoes the last change and
  Forward redoes it.
- **Terms rather than the query string**, so loading a URL needs no query parser. Values from an
  edited URL go through the same validation as typed terms; anything invalid is dropped.
- **The page title follows the query** ("cancer NOT melanoma – Research Search Workspace"), so
  tabs, history entries and screen readers name each search.

### Accessibility

Aimed at WCAG 2.2 AA:

- Landmarks, one `h1`, ordered headings and a skip link; every control has a label.
- Fully keyboard operable, with one visible focus style. Focus is managed when content changes:
  after removing a term, loading an example and changing page.
- Status changes are announced through live regions: the query preview, results counts and errors.
- Colour contrast is tested automatically (`designTokens.spec.js`); motion respects
  `prefers-reduced-motion`; targets are at least 32px; reflows to 320px wide without sideways
  scrolling.
- Checked with axe-core on the production build at 1920, 900 and 390px, in the empty, results and
  error states: 0 violations.

### Testing and verification

- **Unit tests** for the pure logic (query building, URL conversion) and the services (every error
  kind, cancellation, timeout, response mapping), using a fixture trimmed from a real API response.
- **Store tests** for paging, retry and overlapping requests (a slow response arriving late).
- **Component and page tests** for behaviour users rely on: building the brief's example,
  validation, focus after removals, automatic search, and URL loading and Back.
- **Tests that guard the tests:** key logic was broken on purpose (ignoring cancelled responses,
  trusting the last-page cursor, focus handling) to confirm the right tests fail.
- **Live checks in a real browser** (Chromium via Playwright, kept out of the repo): real API
  results, the last page, a simulated network failure, keyboard use, layouts and axe audits.
  These caught bugs the unit tests could not: double-encoded titles, an emoji icon on Windows,
  a too-short timeout and a page-height bug.

### Styling

- Tailwind's default palette is switched off; only our design tokens exist, and every colour
  pairing used in the UI is tested against WCAG 2.2 AA contrast. Trade-off: a stray palette
  class (`text-gray-600`) produces no style rather than an error.
- The brand orange `#fcaf17` is 1.7:1 against the page, too faint for a scrollbar, so the
  `brand` token is the closest darker shade that passes 3:1 (`#c77d00`).

### Known limitations

- No field-specific search (title, author, abstract).
- Titles lose their italics (e.g. species names), as markup is stripped rather than rendered.
- Previous re-requests the page rather than caching it: simpler and always fresh, at the cost of a
  request.
- No jumping to a page number; see "Pagination" above for why.
- Removing the first term promotes the next one, dropping its operator (`cancer NOT melanoma`
  becomes `melanoma`). The query preview shows the change.
- Needs a browser from 2024 or later (`AbortSignal.any`: Chrome 116, Firefox 124, Safari 17.4).
- The URL holds the terms, not the page: cursor paging can't jump to page 5 without fetching
  pages 1-4, so a shared link opens at page 1.
- No end-to-end tests in the repo; browser checks were run with throwaway Playwright scripts. Adding
  them as a Playwright suite would be the next step.

## AI-assisted development reflection

_To be written at the end._
