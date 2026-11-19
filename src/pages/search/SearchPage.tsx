import { useRef } from 'react'
import { useLocation } from 'react-router'
import { describeApiError } from '../../entities/book'
import { GOOGLE_BOOKS_API_KEY } from '../../shared/config'
import { BookListItem } from './BookListItem'
import { BookListSkeleton } from './BookListSkeleton'
import { PageSizeSelect } from './PageSizeSelect'
import { Paginator } from './Paginator'
import { getPageCount } from './pagination'
import { SearchBar } from './SearchBar'
import { useBookSearch } from './useBookSearch'
import { useSearchUrlState } from './useSearchUrlState'

export function SearchPage() {
  const { q, page, limit, setQuery, setLimit, setPage } = useSearchUrlState()
  const location = useLocation()
  const results = useRef<HTMLDivElement>(null)

  const hasApiKey = GOOGLE_BOOKS_API_KEY !== ''
  const { data, error, isFetching, retry } = useBookSearch(
    hasApiKey && q ? { q, page, limit } : null,
  )
  const apiError = describeApiError(error)
  const focusBookId = (location.state as { focusBookId?: string } | null)?.focusBookId

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    results.current?.focus()
    results.current?.scrollIntoView({ block: 'start' })
  }

  const renderResults = () => {
    if (!hasApiKey) {
      return (
        <div className="alert alert-warning" role="alert">
          <strong>API key is not configured.</strong> Add <code>VITE_GOOGLE_BOOKS_API_KEY</code> to{' '}
          <code>.env.local</code> and restart the dev server. See the README for details.
        </div>
      )
    }

    if (!q) {
      return (
        <p className="text-body-secondary text-center py-5">Start typing to search for books.</p>
      )
    }

    if (!data) {
      if (apiError && !isFetching) {
        return (
          <div
            className="alert alert-danger d-flex flex-wrap align-items-center gap-3"
            role="alert"
          >
            <span className="flex-grow-1">{apiError.message}</span>
            {apiError.canRetry && (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={retry}>
                Try again
              </button>
            )}
            {page > 1 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => handlePageChange(1)}
              >
                Go to page 1
              </button>
            )}
          </div>
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

    const pageCount = getPageCount(data.totalItems, limit)
    const paginator = (
      <Paginator page={page} pageCount={pageCount} onPageChange={handlePageChange} />
    )

    if (data.books.length === 0) {
      if (page === 1) {
        return (
          <p className="text-center py-5" role="status">
            No books found for "{q}".
          </p>
        )
      }
      return (
        <div className="text-center py-5">
          <p role="status">No results on this page.</p>
          <button
            type="button"
            className="btn btn-primary mb-4"
            onClick={() => handlePageChange(1)}
          >
            Go to page 1
          </button>
          {paginator}
        </div>
      )
    }

    return (
      <>
        <p className="small text-body-secondary" role="status">
          About {data.totalItems.toLocaleString('en')} results, page {page} of {pageCount}
        </p>
        <ul className="list-group mb-4">
          {data.books.map((book) => (
            <BookListItem key={book.id} book={book} shouldFocus={book.id === focusBookId} />
          ))}
        </ul>
        {paginator}
      </>
    )
  }

  return (
    <>
      <h1 className="visually-hidden">Search books</h1>
      <div className="row g-3 align-items-end mb-4">
        <div className="col-12 col-md">
          <SearchBar query={q} onSearch={setQuery} />
        </div>
        <div className="col-6 col-md-auto">
          <PageSizeSelect value={limit} onChange={setLimit} />
        </div>
      </div>
      <div ref={results} tabIndex={-1} className="search-results">
        {renderResults()}
      </div>
    </>
  )
}
