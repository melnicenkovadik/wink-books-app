# Book Search

A small React app that searches Google Books. Test task for WiNK Srl.

- Live search with pagination and a page size selector (5, 10, 15, 20)
- Book details page with a link to Google Books (`infoLink`)
- React 19, TypeScript, Redux Toolkit (RTK Query), React Router, Bootstrap 5 with a Sass theme

## Run it

You need Node 24 (see `.nvmrc`) and a Google Books API key.

```bash
nvm use
npm ci
cp .env.example .env.local   # then put your key into .env.local
npm run dev                  # http://localhost:5173
```

Other commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview              # http://localhost:4173
```

## Why an API key is needed

The task gives the endpoint `https://www.googleapis.com/books/v1/volumes?q=...` without a key.
Today Google answers such requests with `429` and a daily limit of `0` for anonymous calls, so the
app would only show an error. With a free key the same endpoint works.

How to get a key:

1. Open Google Cloud Console, pick a project, enable **Books API**.
2. Create an API key in **APIs & Services → Credentials**.
3. Restrict it to **Books API** only.
4. Under **Websites**, allow only the sites that run the app, for example
   `http://localhost:5173/*`, `http://localhost:4173/*` and the exact URL of your hosted preview.

Vite puts every `VITE_*` variable into the browser bundle, so this key is not a secret. The
restrictions above are what protect it. The key is never committed; `.env.example` is empty on
purpose. Without a key the app shows a clear message instead of a blank page.

On CodeSandbox the key is set in **Menu → Env variables** of the sandbox, followed by a restart.

## How it works

**Search state lives in the URL.** `q`, `page` and `limit` are query parameters
(`/?q=harry&page=2&limit=20`). Reload, Back/Forward and shared links work without extra code.
Redux holds server data only (the RTK Query cache).

**Live search.** Results update while you type, without Enter. There is a short 300 ms debounce
(`SEARCH_DEBOUNCE_MS` in `SearchBar.tsx`), so a quickly typed word is one request instead of one
per letter. Clearing the field removes the results at once.

**Requests.**

- When the query, page or page size changes, the previous unfinished request is cancelled.
- Pages that were already loaded come from the cache, with no new request.
- The screen only shows data that belongs to the current query. A slow response for an older query
  can never replace newer results.
- A cancelled request is not shown as an error.
- Error messages say only what the response confirms. "Daily quota is used up" appears only when
  the `429` response says so. Temporary errors have a "Try again" button.

**Pagination.** `startIndex = (page - 1) * limit`, `maxResults = limit`. The number of pages is
`ceil(totalItems / limit)` from the latest response. Google may return a different `totalItems`
for different pages of the same search, so the paginator can change as you move. If a far page
comes back empty, the app says so and offers a way back to page 1.

**Book data.** The API response is converted to the app's own `Book` type in one place
(`mapVolume.ts`). Missing fields get defaults there. Descriptions come as HTML and are rendered as
plain text only. A book without an image uses
`https://placehold.co/400x600/FF5039/FFF?text=Book+Cover`.

**Google Books branding.** The API terms ask for a "Powered by Google" logo next to the results
and a visible link to Google Books for every book. Both are there, and results keep the order
returned by the API.

## Decisions

- **Bootstrap, not Tailwind.** The task lists Bootstrap under "Required" and Tailwind under "Nice
  to have", so Bootstrap wins. It is used through its Sass sources; theme colours are set in
  `src/app/styles/_theme.scss`. Bootstrap's JavaScript is not included because nothing needs it.
- **Colours.** White text on `#FF5039` has a contrast ratio of 3.25:1, which is too low for text.
  Links and buttons use a darker shade (`#C8321E`, 5.3:1). The cover placeholder keeps the exact
  colour from the task.
- **RTK Query** instead of hand-written thunks: caching, request state and cancellation are
  already there.
- **Two-line descriptions** use CSS `line-clamp`, so it is always two lines on any screen width and
  short texts get no dots.

## Project structure

```
src/
  app/            store, routes, global styles
  pages/
    search/       search bar, list, paginator, URL state
    book-details/ book page
    not-found/
  entities/
    book/         API, types, response mapping, cover image
  shared/         config
  test/           test helpers
```

Imports go one way: `app → pages → entities → shared`. Pages do not import each other.

## Tests

`npm test` runs unit tests for the pure functions (pagination, URL parsing, response mapping, error
messages) and behaviour tests for the pages. The network is replaced with a stub that records every
request and its `AbortSignal`, so the tests check real cancellation, late responses and cache hits.

Layout, the two-line clamp, focus and contrast were checked by hand at 360, 768 and 1280 px.
