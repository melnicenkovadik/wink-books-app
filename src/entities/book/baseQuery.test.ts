import { describe, expect, it } from 'vitest'
import { isTemporaryError } from './baseQuery'

describe('isTemporaryError', () => {
  it('is true for what can go away on its own', () => {
    expect(isTemporaryError({ status: 'FETCH_ERROR', error: 'Failed to fetch' })).toBe(true)
    expect(isTemporaryError({ status: 503, data: {} })).toBe(true)
  })

  it('is false for answers that will not change', () => {
    expect(isTemporaryError({ status: 400, data: {} })).toBe(false)
    expect(isTemporaryError({ status: 404, data: {} })).toBe(false)
    expect(isTemporaryError({ status: 429, data: {} })).toBe(false)
  })
})
