import { useState } from 'react'
import { useLazySearchBooksQuery } from '../../entities/book'

type Range = {
  q: string
  limit: number
  // a page that has books and a page that is known to be empty
  lastPageWithBooks: number
  firstEmptyPage: number
}

// Google does not say where the results really end, so we look for it:
// halve the range between a page with books and an empty one. About 7 requests for 100 pages.
export function useFindLastPage() {
  const [trigger] = useLazySearchBooksQuery()
  const [isSearching, setIsSearching] = useState(false)

  const findLastPage = async ({ q, limit, lastPageWithBooks, firstEmptyPage }: Range) => {
    let low = lastPageWithBooks
    let high = firstEmptyPage
    setIsSearching(true)

    try {
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2)
        const { data } = await trigger({ q, page: middle, limit }, true)
        // a failed far page (Google answers 400 there) counts as empty
        if (data && data.books.length > 0) low = middle
        else high = middle
      }
    } finally {
      setIsSearching(false)
    }
    return low
  }

  return { findLastPage, isSearching }
}
