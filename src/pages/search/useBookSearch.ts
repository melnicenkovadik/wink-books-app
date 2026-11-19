import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect, useRef } from 'react'
import { booksApi, useLazySearchBooksQuery, type SearchBooksArgs } from '../../entities/book'

type ActiveRequest = {
  key: string
  abort: () => void
}

export function useBookSearch(args: SearchBooksArgs | null) {
  const [trigger] = useLazySearchBooksQuery()
  const { currentData, error, isFetching } = booksApi.endpoints.searchBooks.useQueryState(
    args ?? skipToken,
  )
  const activeRequest = useRef<ActiveRequest | null>(null)

  const q = args?.q
  const page = args?.page
  const limit = args?.limit

  const start = (searchArgs: SearchBooksArgs, key: string, preferCache: boolean) => {
    activeRequest.current?.abort()
    const request = trigger(searchArgs, preferCache)
    activeRequest.current = { key, abort: () => request.abort() }
  }

  useEffect(() => {
    const key = q && page && limit ? `${q}|${page}|${limit}` : null
    // StrictMode runs this twice. If we abort and start the same request right away,
    // RTK Query still sees it as pending and skips it, so just keep the first one.
    if (key === (activeRequest.current?.key ?? null)) return

    if (key && q && page && limit) {
      start({ q, page, limit }, key, true)
    } else {
      activeRequest.current?.abort()
      activeRequest.current = null
    }
    // oxlint-disable-next-line react/exhaustive-deps
  }, [trigger, q, page, limit])

  const retry = () => {
    if (args) start(args, `${args.q}|${args.page}|${args.limit}`, false)
  }

  return { data: currentData, error, isFetching, retry }
}
