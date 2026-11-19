import { describe, expect, it } from 'vitest'
import { dailyQuotaError } from '../../test/fixtures'
import { describeApiError } from './apiError'

describe('describeApiError', () => {
  it('says the daily quota is used up only when the response confirms it', () => {
    expect(describeApiError({ status: 429, data: dailyQuotaError })).toEqual({
      message: 'The daily request quota for this API key is used up.',
      canRetry: false,
    })
    expect(describeApiError({ status: 429, data: { error: { message: 'Slow down' } } })).toEqual({
      message: 'Too many requests. Please try again in a moment.',
      canRetry: true,
    })
  })

  it('shows the reason Google gave for a 403 instead of guessing', () => {
    const error = describeApiError({
      status: 403,
      data: { error: { message: 'Requests from referer x are blocked.' } },
    })
    expect(error?.message).toBe(
      'Google Books refused the request (403). Requests from referer x are blocked.',
    )
    expect(error?.canRetry).toBe(false)
  })

  it('handles 400, 404 and 5xx', () => {
    expect(describeApiError({ status: 400, data: {} })?.canRetry).toBe(false)
    expect(describeApiError({ status: 404, data: {} })?.message).toBe('Book not found.')
    expect(describeApiError({ status: 503, data: {} })?.canRetry).toBe(true)
  })

  it('offers a retry for network errors', () => {
    expect(
      describeApiError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }),
    ).toEqual({ message: 'Network error. Check your connection and try again.', canRetry: true })
  })

  it('treats a cancelled request as nothing to show', () => {
    expect(describeApiError({ name: 'AbortError', message: 'Aborted' })).toBeNull()
    expect(describeApiError(undefined)).toBeNull()
  })
})
