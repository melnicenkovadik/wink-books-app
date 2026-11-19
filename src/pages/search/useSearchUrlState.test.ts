import { describe, expect, it } from 'vitest'
import { normalizeQuery, parseSearchState } from './useSearchUrlState'

const parse = (query: string) => parseSearchState(new URLSearchParams(query))

describe('parseSearchState', () => {
  it('uses defaults for an empty URL', () => {
    expect(parse('')).toEqual({ q: '', page: 1, limit: 10 })
  })

  it('reads valid values', () => {
    expect(parse('q=harry+potter&page=3&limit=20')).toEqual({
      q: 'harry potter',
      page: 3,
      limit: 20,
    })
  })

  it.each(['abc', '0', '-3', '2.5', ''])('falls back to page 1 for page=%s', (page) => {
    expect(parse(`q=a&page=${page}`).page).toBe(1)
  })

  it.each(['7', '40', 'abc'])('falls back to 10 for limit=%s', (limit) => {
    expect(parse(`q=a&limit=${limit}`).limit).toBe(10)
  })
})

describe('normalizeQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeQuery('  harry   potter ')).toBe('harry potter')
    expect(normalizeQuery('   ')).toBe('')
  })
})
