import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { describeApiError, getSearchBounds, selectSearchQueries } from '../../entities/book'
import { GOOGLE_BOOKS_API_KEY } from '../../shared/config'
import { ErrorAlert } from '../../shared/ui/ErrorAlert'
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary'
import { BookListItem } from './BookListItem'
import { BookListSkeleton } from './BookListSkeleton'
import { PageSizeSelect } from './PageSizeSelect'
import { Paginator } from './Paginator'
import { getKnownPageCount } from './pagination'
import { SearchBar } from './SearchBar'
import { useBookSearch } from './useBookSearch'
import { useSearchUrlState } from './useSearchUrlState'

const SUGGESTIONS = ['Dune', 'Tolkien', 'Italian cooking', 'JavaScript']

export function SearchPage() {
  const { q, page, limit, setQuery, setLimit, setPage } = useSearchUrlState()
  const location = useLocation()
  const results = useRef<HTMLDivElement>(null)

  const hasApiKey = GOOGLE_BOOKS_API_KEY !== ''
  const { data, error, isFetching, retry } = useBookSearch(
    hasApiKey && q ? { q, page, limit } : null,
  )
  const apiError = describeApiError(error)
  const bounds = getSearchBounds(useSelector(selectSearchQueries), q, limit)
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
        <div className="text-center py-5">
          <p className="mb-3">Start typing to search for books.</p>
          <div className="search-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="search-chip"
                onClick={() => setQuery(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (!data) {
      if (apiError && !isFetching) {
        return (
          <ErrorAlert message={apiError.message} onRetry={apiError.canRetry ? retry : undefined}>
            {page > 1 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => handlePageChange(1)}
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
    const lastPage = bounds.lastPageWithBooks ?? 1
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
            onClick={() => handlePageChange(lastPage)}
          >
            Go to page {lastPage}
          </button>
          {paginator}
        </div>
      )
    }

    return (
      <>
        <p className="small text-body-secondary" role="status">
          About {totalItems.toLocaleString('en')} results, page {page} of {pageCount}
        </p>
        <ul className="book-grid">
          {data.books.map((book) => (
            <li key={book.id}>
              <ErrorBoundary
                fallback={
                  <div className="book-card text-body-secondary">This book could not be shown.</div>
                }
              >
                <BookListItem book={book} shouldFocus={book.id === focusBookId} />
              </ErrorBoundary>
            </li>
          ))}
        </ul>
        {paginator}
      </>
    )
  }

  return (
    <>
      <section className={q ? 'search-hero-compact' : 'search-hero'}>
        <div className="container">
          {q ? (
            <h1 className="visually-hidden">Search books</h1>
          ) : (
            <div>
              <h1 className="search-hero-title">Find your next book</h1>
              <p className="search-hero-text">
                Search millions of titles from Google Books by title, author or ISBN.
              </p>
            </div>
          )}
          <div className="row g-3 align-items-end">
            <div className={q ? 'col' : 'col-12 col-md'}>
              <SearchBar query={q} onSearch={setQuery} />
            </div>
            <div className={q ? 'col-auto' : 'col-6 col-md-auto'}>
              <PageSizeSelect value={limit} onChange={setLimit} />
            </div>
          </div>
        </div>
      </section>
      <div ref={results} tabIndex={-1} className="container py-4 search-results">
        <ErrorBoundary resetKey={`${q}|${page}|${limit}`} message="The results could not be shown.">
          {renderResults()}
        </ErrorBoundary>
      </div>
    </>
  )
}
