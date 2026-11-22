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

176 tests cover query building, the API service (every error kind, cancellation, timeout), the
stores (paging, caching, overlapping requests), the components and the URL behaviour. Tests sit
in `__tests__/` folders next to the code they test. See
[Testing and verification](docs/engineering-notes.md#testing-and-verification) for how the app
was also checked in a real browser.

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
docs/                 full engineering notes
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

The short version is below. The full notes, with the evidence behind each decision, are in
[docs/engineering-notes.md](docs/engineering-notes.md).

### Main decisions

- **Layered, testable structure.** Pure query logic (`utils/`), a `fetch` service that never throws
  (`services/`), two independent Pinia setup stores (`stores/`), and presentational components
  connected by one view.
- **The query means what the preview shows.** Input is searched literally (phrases and syntax
  characters are quoted), and mixed AND/OR is bracketed: on the live API, unbracketed
  `a AND b OR c` silently returns the same results as `a` alone.
- **Async handled explicitly.** One status value (`idle | loading | success | empty | error`);
  each request cancels the previous one and late responses are ignored; typed errors with Try
  again; a 30-second timeout, as uncached queries took 11-13s.
- **Paging on a forward-only API.** A stack of `cursorMark`s gives Previous; `hitCount`, not the
  cursor, decides the last page; fetched pages are cached for the session.
- **Workspace layout.** Query panel on the left, results on the right, and only the results
  scroll; reached in three iterations, each measured in a real browser.
- **Shareable searches.** The terms live in the URL, and Back/Forward step through changes.
- **Accessible by default.** WCAG 2.2 AA: labelled controls, managed focus, live regions and
  tested colour contrast; axe-core reports 0 violations.

### Trade-offs

- Searching on every change, with no Search button: immediate, at the cost of more requests,
  kept cheap by cancellation and caching.
- Next/Previous rather than numbered pages: the API ignores `page`, and jumping costs one request
  per 1,000 results skipped.
- Literal search over power-user syntax, so no field searches such as `TITLE:`.
- Only design tokens exist (Tailwind's palette is off), so every colour is contrast-tested, but a
  stray palette class silently produces no style.

### Known limitations

- No field-specific search; titles lose their italics, as markup is stripped rather than rendered.
- A shared link opens at page 1; cached pages can be slightly stale in a long session.
- Needs a browser from 2024 or later (`AbortSignal.any`).
- No end-to-end suite in the repo; browser checks used throwaway Playwright scripts.

## AI-assisted development reflection

I built this with Claude Code in VS Code for planning, code, tests and review, using Context7 to
check the current Tailwind v4 docs, and Playwright with axe-core to verify the app in a real
browser. I kept the project's rules in `CLAUDE.md` and enforced the important ones with ESLint, so
the assistant and I worked to the same standard.

The most helpful suggestion was to test against the live API before trusting the code. It showed
that an unbracketed `malaria AND vaccine OR dengue` returns exactly the same 293,407 results as
`malaria` alone, so the builder now brackets mixed operators. The same habit found the cursor that
leads to an empty last page, titles with double-encoded markup and searches slower than my first
timeout. All of these had passed the unit tests.

The suggestion I rejected was a colour-contrast test built on OKLCH colour-space maths. When I
asked whether anyone had asked for it, the answer was no, so I switched the tokens to hex and used WCAG's own formula. I also set the working
rules: nothing is committed until I have reviewed it, comments stay to one line, and the code uses
one function style. I steered the layout too, after spotting wasted space and a query preview
that scrolled out of view.

To verify the application I relied on 176 Vitest tests, and broke key logic on purpose to prove
the right tests fail. I also ran live API checks, keyboard and screen-size checks in Chromium, and
axe audits with 0 violations, and screenshots caught a Windows emoji bug that the tests could not.
Finally, a fresh clone installs, passes the tests and builds.
