import { describe, expect, it } from 'vitest'
import { getSearchBounds } from './searchBounds'

type Queries = Parameters<typeof getSearchBounds>[0]

// builds the part of the RTK Query cache the function reads
function cached(q: string, page: number, limit: number, totalItems: number, bookCount: number) {
  return {
    endpointName: 'searchBooks',
    status: 'fulfilled',
    originalArgs: { q, page, limit },
    data: { totalItems, books: Array.from({ length: bookCount }, (_, i) => ({ id: String(i) })) },
  }
}

const asQueries = (entries: object[]) => Object.fromEntries(entries.entries()) as unknown as Queries

describe('getSearchBounds', () => {
  it('knows nothing about a query that was never loaded', () => {
    expect(getSearchBounds(asQueries([]), 'dune', 10)).toEqual({})
  })

  it('takes the smallest total reported for the query', () => {
    const queries = asQueries([cached('dune', 1, 10, 476, 10), cached('dune', 2, 10, 21762, 10)])
    expect(getSearchBounds(queries, 'dune', 10).totalItems).toBe(476)
  })

  it('ignores the total of an empty page', () => {
    const queries = asQueries([cached('dune', 1, 10, 476, 10), cached('dune', 60, 10, 0, 0)])
    expect(getSearchBounds(queries, 'dune', 10).totalItems).toBe(476)
  })

  it('remembers the first empty page and the last page with books', () => {
    const queries = asQueries([
      cached('dune', 1, 10, 500, 10),
      cached('dune', 7, 10, 500, 10),
      cached('dune', 40, 10, 500, 0),
      cached('dune', 30, 10, 500, 0),
    ])
    expect(getSearchBounds(queries, 'dune', 10)).toEqual({
      totalItems: 500,
      lastPageWithBooks: 7,
      firstEmptyPage: 30,
    })
  })

  it('does not mix pages of another page size', () => {
    const queries = asQueries([cached('dune', 1, 10, 500, 10), cached('dune', 9, 5, 500, 0)])
    const bounds = getSearchBounds(queries, 'dune', 10)
    expect(bounds.firstEmptyPage).toBeUndefined()
    expect(bounds.lastPageWithBooks).toBe(1)
  })

  it('does not mix other queries or other endpoints', () => {
    const queries = asQueries([
      cached('tolkien', 1, 10, 30, 10),
      { endpointName: 'getBookById', status: 'fulfilled', originalArgs: 'abc', data: {} },
    ])
    expect(getSearchBounds(queries, 'dune', 10)).toEqual({})
  })

  it('does not treat an empty first page as the end of a longer list', () => {
    const queries = asQueries([cached('zzzz', 1, 10, 0, 0)])
    expect(getSearchBounds(queries, 'zzzz', 10).firstEmptyPage).toBeUndefined()
  })
})
