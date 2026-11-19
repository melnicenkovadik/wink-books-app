import { useSelector } from 'react-redux'
import { describeApiError, getSearchBounds, selectSearchQueries } from '../../entities/book'
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

// One search: loading, error, nothing found, a page past the end, or the list.
export function SearchResults({ q, page, limit, onPageChange }: Props) {
  const { data, error, isFetching, retry } = useBookSearch({ q, page, limit })
  const bounds = getSearchBounds(useSelector(selectSearchQueries), q, limit)
  const apiError = describeApiError(error)

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
    return (
      <>
        <p className="visually-hidden" role="status">
          Loading results...
        </p>
        <BookListSkeleton rows={limit} />
      </>
    )
  }

  const totalItems = bounds.totalItems ?? data.totalItems
  const pageCount = getKnownPageCount(totalItems, limit, bounds)
  const paginator = <Paginator page={page} pageCount={pageCount} onPageChange={onPageChange} />

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
        {paginator}
      </EmptyPage>
    )
  }

  return (
    <>
      <p className="small text-body-secondary" role="status">
        About {totalItems.toLocaleString('en')} results, page {page} of {pageCount}
      </p>
      <BookList books={data.books} />
      {paginator}
    </>
  )
}
