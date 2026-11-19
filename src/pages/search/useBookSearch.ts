import { useEffect, useRef } from 'react'
import { booksApi, useLazySearchBooksQuery, type SearchBooksArgs } from '../../entities/book'

type ActiveRequest = {
  key: string
  abort: () => void
}

const toKey = ({ q, page, limit }: SearchBooksArgs) => `${q}|${page}|${limit}`

// Runs the search and makes sure there is only one request in flight:
// starting a new one cancels the previous. The returned data always belongs
// to the current arguments, never to an earlier search.
export function useBookSearch(args: SearchBooksArgs) {
  const [trigger] = useLazySearchBooksQuery()
  const { currentData, error, isFetching } = booksApi.endpoints.searchBooks.useQueryState(args)
  const activeRequest = useRef<ActiveRequest | null>(null)
  const isMounted = useRef(false)
  const { q, page, limit } = args

  const start = (searchArgs: SearchBooksArgs, preferCache: boolean) => {
    activeRequest.current?.abort()
    const request = trigger(searchArgs, preferCache)
    activeRequest.current = { key: toKey(searchArgs), abort: () => request.abort() }
  }

  useEffect(() => {
    const searchArgs = { q, page, limit }
    // StrictMode runs this twice. If we abort and start the same request right away,
    // RTK Query still sees it as pending and skips it, so just keep the first one.
    if (activeRequest.current?.key === toKey(searchArgs)) return
    start(searchArgs, true)
    // oxlint-disable-next-line react/exhaustive-deps
  }, [trigger, q, page, limit])

  // the search goes away (field cleared, another page of the app): stop waiting for it.
  // deferred, because StrictMode unmounts and mounts again in the same tick
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      setTimeout(() => {
        if (isMounted.current) return
        activeRequest.current?.abort()
        activeRequest.current = null
      })
    }
  }, [])

  return { data: currentData, error, isFetching, retry: () => start(args, false) }
}
