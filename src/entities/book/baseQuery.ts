import { fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { GOOGLE_BOOKS_API_URL, MAX_RETRIES, RETRY_DELAY_MS } from '../../shared/config'

const rawBaseQuery = fetchBaseQuery({ baseUrl: GOOGLE_BOOKS_API_URL })

// only errors that can go away on their own: no connection or a 5xx.
// 4xx will not change, and repeating a 429 just burns more quota
export function isTemporaryError(error: FetchBaseQueryError) {
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return true
  return typeof error.status === 'number' && error.status >= 500
}

const queryOnce: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error && (api.signal.aborted || !isTemporaryError(result.error))) {
    retry.fail(result.error, result.meta)
  }
  return result
}

export const baseQueryWithRetry = retry(queryOnce, {
  maxRetries: MAX_RETRIES,
  backoff: (attempt) =>
    new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * 2 ** attempt)),
})
