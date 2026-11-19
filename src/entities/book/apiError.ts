import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export type ApiError = {
  message: string
  canRetry: boolean
}

type GoogleErrorBody = {
  error?: {
    message?: string
    details?: { metadata?: { quota_limit?: string } }[]
  }
}

function isDailyQuota(body: GoogleErrorBody) {
  const limit = body.error?.details?.find((item) => item.metadata?.quota_limit)?.metadata
    ?.quota_limit
  return /perday/i.test(limit ?? '') || /per day/i.test(body.error?.message ?? '')
}

// null = cancelled request, nothing to show
export function describeApiError(
  error: FetchBaseQueryError | SerializedError | undefined,
): ApiError | null {
  if (!error) return null

  if (!('status' in error)) {
    if (error.name === 'AbortError') return null
    return { message: error.message ?? 'Something went wrong.', canRetry: true }
  }

  if (error.status === 'FETCH_ERROR') {
    if (error.error.includes('AbortError')) return null
    return { message: 'Network error. Check your connection and try again.', canRetry: true }
  }

  if (error.status === 'TIMEOUT_ERROR') {
    return { message: 'Google Books took too long to answer.', canRetry: true }
  }

  if (typeof error.status !== 'number') {
    return { message: 'Something went wrong.', canRetry: true }
  }

  const body = (error.data ?? {}) as GoogleErrorBody
  const details = body.error?.message

  if (error.status === 429) {
    return isDailyQuota(body)
      ? { message: 'The daily request quota for this API key is used up.', canRetry: false }
      : { message: 'Too many requests. Please try again in a moment.', canRetry: true }
  }
  if (error.status === 404) return { message: 'Book not found.', canRetry: false }
  if (error.status === 403) {
    return {
      message: ['Google Books refused the request (403).', details].filter(Boolean).join(' '),
      canRetry: false,
    }
  }
  if (error.status === 400) {
    return {
      message: ['The search request was rejected.', details].filter(Boolean).join(' '),
      canRetry: false,
    }
  }
  if (error.status >= 500) {
    return { message: 'Google Books is temporarily unavailable.', canRetry: true }
  }
  return { message: details ?? 'Something went wrong.', canRetry: true }
}
