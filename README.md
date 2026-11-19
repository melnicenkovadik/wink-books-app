# Book Search

Test task for WiNK. A React app that searches Google Books: live search, pagination, page size
(5/10/15/20) and a details page with the `infoLink`.

Stack: React 19, TypeScript, Redux Toolkit (RTK Query), React Router, Bootstrap 5 with Sass.

## Run

Node 24 is needed (there is an `.nvmrc`).

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Put your Google Books API key into `.env.local`, then open http://localhost:5173.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## About the API key

The endpoint from the task (`/books/v1/volumes?q=...`) does not work without a key anymore. Google
answers with 429 and a daily limit of 0 for anonymous requests. With a free key it works fine.

To get one: Google Cloud Console, enable Books API, create an API key, restrict it to Books API and
to the sites where the app runs (localhost and the preview URL).

The key ends up in the browser bundle like any `VITE_` variable, so it is protected by those
restrictions and not by being secret. It is not in the repo, `.env.example` is empty. If the key is
missing the app says so.

On CodeSandbox I set it in the sandbox env variables.

## Notes

- Search state (`q`, `page`, `limit`) is in the URL, so reload, back/forward and sharing a link
  just work. Redux only keeps the server data (RTK Query cache).
- Search is live with a 300 ms debounce. I didn't want to send a request for every single letter.
  It is one constant in `SearchBar.tsx` if you want to change it.
- When the query or page changes, the previous request is aborted. Pages that were already loaded
  come from the cache.
- The list only shows data for the current query, so a slow old response can't replace new results.
- `totalItems` from Google is not stable, it changes between pages of the same search. The number
  of pages is counted from the latest response, so the paginator can jump a bit. If a far page is
  empty or fails there is a button to go back to page 1.
- Book descriptions come as HTML. They are converted to plain text, nothing is injected as HTML.
- Bootstrap instead of Tailwind because the task has Bootstrap in "Required". Theme colours are in
  `src/app/styles/_theme.scss`. `#FF5039` is used for the cover placeholder as asked, but for links
  and buttons I took a darker shade, white text on `#FF5039` is hard to read.
- Description is cut to two lines with CSS `line-clamp`.

## Structure

```
src/
  app/        store, routes, styles
  pages/      search, book-details, not-found
  entities/   book: api, types, mapping, cover
  shared/     config
  test/       test helpers
```

## Tests

Vitest + Testing Library. `fetch` is stubbed, the tests check requests, aborts, late responses and
cache. Layout was checked by hand on 360, 768 and 1280 px.
