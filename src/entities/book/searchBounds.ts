import { booksApi } from './booksApi'
import type { SearchBooksArgs, SearchBooksResult } from './types'

type BooksApiState = ReturnType<typeof booksApi.reducer>

export type SearchBounds = {
  totalItems?: number
  firstEmptyPage?: number
  lastPageWithBooks?: number
}

export const selectSearchQueries = (state: { booksApi: BooksApiState }) => state.booksApi.queries

// Google's totalItems is not reliable: it grows on later pages and promises far more
// than it can return. So for one query we trust the smallest total we have seen,
// and remember where the results actually stopped.
export function getSearchBounds(
  queries: BooksApiState['queries'],
  q: string,
  limit: number,
): SearchBounds {
  const bounds: SearchBounds = {}

  for (const entry of Object.values(queries)) {
    if (entry?.endpointName !== 'searchBooks') continue
    // WHY: the cache is typed as a union of all endpoints, the name check above is the real guard
    const args = entry.originalArgs as unknown as SearchBooksArgs
    const data = entry.data as SearchBooksResult | undefined
    if (args.q !== q) continue

    const hasBooks = entry.status === 'fulfilled' && data !== undefined && data.books.length > 0

    if (hasBooks) {
      bounds.totalItems = Math.min(bounds.totalItems ?? Infinity, data.totalItems)
    }
    if (args.limit !== limit) continue

    if (hasBooks) {
      bounds.lastPageWithBooks = Math.max(bounds.lastPageWithBooks ?? 0, args.page)
    } else if (entry.status === 'fulfilled' && args.page > 1) {
      bounds.firstEmptyPage = Math.min(bounds.firstEmptyPage ?? Infinity, args.page)
    }
  }

  return bounds
}
