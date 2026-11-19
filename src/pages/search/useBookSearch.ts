import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect, useRef } from 'react'
import { booksApi, useLazySearchBooksQuery, type SearchBooksArgs } from '../../entities/book'

type ActiveRequest = {
  key: string
  abort: () => void
}

// Starts the search for the given arguments and cancels the previous one when they change.
// The returned state always belongs to the current arguments, never to an earlier search.
export function useBookSearch(args: SearchBooksArgs | null) {
  const [trigger] = useLazySearchBooksQuery()
  const { currentData, error, isFetching } = booksApi.endpoints.searchBooks.useQueryState(
    args ?? skipToken,
  )
  const activeRequest = useRef<ActiveRequest | null>(null)

  const q = args?.q
  const page = args?.page
  const limit = args?.limit

  useEffect(() => {
    const key = q && page && limit ? `${q}|${page}|${limit}` : null
    // Same arguments again (React StrictMode runs effects twice): keep the running request.
    // Aborting and restarting it in the same tick would be ignored by RTK Query as a duplicate.
    if (key === (activeRequest.current?.key ?? null)) return

    activeRequest.current?.abort()
    activeRequest.current = null

    if (key && q && page && limit) {
      const request = trigger({ q, page, limit }, true)
      activeRequest.current = { key, abort: () => request.abort() }
    }
  }, [trigger, q, page, limit])

  const retry = () => {
    if (args) trigger(args)
  }

  return { data: currentData, error, isFetching, retry }
}
