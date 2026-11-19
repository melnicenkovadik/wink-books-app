import { useSearchParams } from 'react-router'

export const PAGE_SIZES = [5, 10, 15, 20] as const
export const DEFAULT_PAGE_SIZE = 10

export type PageSize = (typeof PAGE_SIZES)[number]

export type SearchState = {
  q: string
  page: number
  limit: PageSize
}

export function normalizeQuery(raw: string) {
  return raw.trim().replace(/\s+/g, ' ')
}

export function parseSearchState(params: URLSearchParams): SearchState {
  const page = Number(params.get('page'))
  const limit = Number(params.get('limit'))

  return {
    q: normalizeQuery(params.get('q') ?? ''),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: PAGE_SIZES.find((size) => size === limit) ?? DEFAULT_PAGE_SIZE,
  }
}

function toSearchParams({ q, page, limit }: SearchState) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page > 1) params.set('page', String(page))
  if (limit !== DEFAULT_PAGE_SIZE) params.set('limit', String(limit))
  return params
}

export function useSearchUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = parseSearchState(searchParams)

  // Typing replaces the history entry so Back does not step through every keystroke.
  const setQuery = (raw: string) => {
    setSearchParams(
      (prev) => toSearchParams({ ...parseSearchState(prev), q: normalizeQuery(raw), page: 1 }),
      { replace: true },
    )
  }

  const setLimit = (limit: PageSize) => {
    setSearchParams((prev) => toSearchParams({ ...parseSearchState(prev), limit, page: 1 }))
  }

  const setPage = (page: number) => {
    setSearchParams((prev) => toSearchParams({ ...parseSearchState(prev), page }))
  }

  return { ...state, setQuery, setLimit, setPage }
}
