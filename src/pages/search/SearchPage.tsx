import { useRef } from 'react'
import { HAS_API_KEY } from '../../shared/config'
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary'
import { MissingApiKeyAlert } from '../../shared/ui/MissingApiKeyAlert'
import { PageSizeSelect } from './PageSizeSelect'
import { SearchBar } from './SearchBar'
import { SearchHint } from './SearchHint'
import { SearchResults } from './SearchResults'
import { useSearchUrlState } from './useSearchUrlState'

export function SearchPage() {
  const { q, page, limit, setQuery, setLimit, setPage } = useSearchUrlState()
  const results = useRef<HTMLDivElement>(null)

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
    results.current?.focus()
    results.current?.scrollIntoView({ block: 'start' })
  }

  const renderResults = () => {
    if (!HAS_API_KEY) return <MissingApiKeyAlert />
    if (!q) return <SearchHint onSearch={setQuery} />
    return <SearchResults q={q} page={page} limit={limit} onPageChange={handlePageChange} />
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
