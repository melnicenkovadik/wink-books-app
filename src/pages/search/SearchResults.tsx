import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  booksApi,
  describeApiError,
  getSearchBounds,
  selectSearchQueries,
  type SearchBooksResult,
} from '../../entities/book'
import { ErrorAlert } from '../../shared/ui/ErrorAlert'
import { BookList } from './BookList'
import { BookListSkeleton } from './BookListSkeleton'
import { EmptyPage } from './EmptyPage'
import { Paginator } from './Paginator'
import { getKnownPageCount } from './pagination'
import { useBookSearch } from './useBookSearch'
import type { SearchState } from './useSearchUrlState'

type Props = SearchState & {
  onPageChange: (page: number) => void
}

type ShownPage = {
  q: string
  limit: number
  data: SearchBooksResult
}

// One search: loading, error, nothing found, a page past the end, or the list.
export function SearchResults({ q, page, limit, onPageChange }: Props) {
  const { data, error, isFetching, retry } = useBookSearch({ q, page, limit })
  const bounds = getSearchBounds(useSelector(selectSearchQueries), q, limit)
  const prefetchSearch = booksApi.usePrefetch('searchBooks')
  const apiError = describeApiError(error)

  // The last page we showed. While another page of the SAME search loads it stays
  // on screen (dimmed), so the layout does not jump. A new query never reuses it.
  const [shown, setShown] = useState<ShownPage>()
  if (data && data.books.length > 0 && shown?.data !== data) setShown({ q, limit, data })
  const previousPage = shown?.q === q && shown.limit === limit ? shown.data : undefined

  const renderPaginator = (totalItems: number) => (
    <Paginator
      page={page}
      pageCount={getKnownPageCount(bounds.totalItems ?? totalItems, limit, bounds)}
      onPageChange={onPageChange}
      onPageIntent={(nextPage) => prefetchSearch({ q, page: nextPage, limit })}
    />
  )

  if (!data) {
    if (apiError && !isFetching) {
      return (
        <ErrorAlert message={apiError.message} onRetry={apiError.canRetry ? retry : undefined}>
          {page > 1 && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => onPageChange(1)}
            >
              Go to page 1
            </button>
          )}
        </ErrorAlert>
      )
    }
    if (previousPage) {
      return (
        <>
          <p className="small text-body-secondary" role="status">
            Loading page {page}...
          </p>
          <div className="book-list-loading" aria-busy="true">
            <BookList books={previousPage.books} />
          </div>
          {renderPaginator(previousPage.totalItems)}
        </>
      )
    }
    return (
      <>
        <p className="visually-hidden" role="status">
          Loading results...
        </p>
        <BookListSkeleton rows={limit} />
      </>
    )
  }

  if (data.books.length === 0 && page === 1) {
    return (
      <p className="text-center py-5" role="status">
        No books found for "{q}".
      </p>
    )
  }

  if (data.books.length === 0) {
    return (
      <EmptyPage
        q={q}
        limit={limit}
        lastPageWithBooks={bounds.lastPageWithBooks ?? 1}
        firstEmptyPage={bounds.firstEmptyPage ?? page}
        onPageChange={onPageChange}
      >
        {renderPaginator(data.totalItems)}
      </EmptyPage>
    )
  }

  const totalItems = bounds.totalItems ?? data.totalItems
  return (
    <>
      <p className="small text-body-secondary" role="status">
        About {totalItems.toLocaleString('en')} results, page {page} of{' '}
        {getKnownPageCount(totalItems, limit, bounds)}
      </p>
      <BookList books={data.books} />
      {renderPaginator(data.totalItems)}
    </>
  )
}
