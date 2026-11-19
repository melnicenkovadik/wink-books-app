import { describe, expect, it } from 'vitest'
import { getPageCount, getPageItems } from './pagination'

describe('getPageCount', () => {
  it.each([
    [0, 10, 0],
    [1, 10, 1],
    [10, 10, 1],
    [11, 10, 2],
    [476, 20, 24],
  ])('%i items by %i per page -> %i pages', (total, limit, expected) => {
    expect(getPageCount(total, limit)).toBe(expected)
  })
})

describe('getPageItems', () => {
  it('returns a single page', () => {
    expect(getPageItems(1, 1)).toEqual([1])
  })

  it('returns every page when there are no gaps', () => {
    expect(getPageItems(2, 3)).toEqual([1, 2, 3])
  })

  it('collapses the tail when the first page is current', () => {
    expect(getPageItems(1, 120)).toEqual([1, 2, 'ellipsis', 120])
  })

  it('collapses both sides around a middle page', () => {
    expect(getPageItems(5, 120)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 120])
  })

  it('collapses the head when the last page is current', () => {
    expect(getPageItems(120, 120)).toEqual([1, 'ellipsis', 119, 120])
  })

  it('still shows the way back when the current page is past the end', () => {
    expect(getPageItems(50, 3)).toEqual([1, 'ellipsis', 3])
  })
})
