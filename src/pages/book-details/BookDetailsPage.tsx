import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { BookCover, describeApiError, useGetBookByIdQuery } from '../../entities/book'
import { GOOGLE_BOOKS_API_KEY } from '../../shared/config'

export function BookDetailsPage() {
  const { volumeId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const hasApiKey = GOOGLE_BOOKS_API_KEY !== ''

  const {
    currentData: book,
    error,
    isFetching,
    refetch,
  } = useGetBookByIdQuery(volumeId, { skip: !hasApiKey })
  const apiError = describeApiError(error)

  const cameFromSearch = (location.state as { fromSearch?: boolean } | null)?.fromSearch === true

  const backLink = cameFromSearch ? (
    <button
      type="button"
      className="btn btn-link px-0 mb-3 fw-semibold"
      onClick={() => navigate(-1)}
    >
      ← Back to results
    </button>
  ) : (
    <Link to="/" className="d-inline-block mb-3 fw-semibold">
      ← Back to search
    </Link>
  )

  const renderContent = (): ReactNode => {
    if (!hasApiKey) {
      return (
        <div className="alert alert-warning" role="alert">
          <strong>API key is not configured.</strong> See the README for details.
        </div>
      )
    }

    if (!book) {
      if (apiError && !isFetching) {
        return (
          <div
            className="alert alert-danger d-flex flex-wrap align-items-center gap-3"
            role="alert"
          >
            <span className="flex-grow-1">{apiError.message}</span>
            {apiError.canRetry && (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={refetch}>
                Try again
              </button>
            )}
          </div>
        )
      }
      return (
        <>
          <p role="status" className="visually-hidden">
            Loading book...
          </p>
          <div className="book-details row g-4 mx-0 placeholder-glow" aria-hidden="true">
            <div className="col-8 col-sm-5 col-md-4 col-lg-3 mx-auto mx-md-0">
              <span className="placeholder book-cover d-block w-100" />
            </div>
            <div className="col-12 col-md">
              <span className="placeholder placeholder-lg col-8 d-block mb-3" />
              <span className="placeholder col-4 d-block mb-4" />
              <span className="placeholder col-12 d-block mb-2" />
              <span className="placeholder col-11 d-block mb-2" />
              <span className="placeholder col-9 d-block" />
            </div>
          </div>
        </>
      )
    }

    const facts = [
      ['Publisher', book.publisher],
      ['Published', book.publishedDate],
      ['Pages', book.pageCount],
      ['Categories', book.categories.join(', ')],
      ['Language', book.language?.toUpperCase()],
      ['Rating', book.averageRating ? `${book.averageRating} / 5` : undefined],
    ].filter(([, value]) => Boolean(value))

    return (
      <article className="book-details row g-4 mx-0">
        <div className="col-8 col-sm-5 col-md-4 col-lg-3 mx-auto mx-md-0">
          <BookCover src={book.coverUrl} title={book.title} className="w-100" />
        </div>
        <div className="col-12 col-md">
          <h1 className="book-details-title mb-2">{book.title}</h1>
          {book.subtitle && <p className="lead mb-2">{book.subtitle}</p>}
          <p className="fs-5 mb-4">{book.authors.join(', ') || 'Unknown author'}</p>

          {facts.length > 0 && (
            <dl className="book-facts">
              {facts.map(([label, value]) => (
                <div key={label} className="book-fact">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {book.infoLink && (
            <a
              className="btn btn-primary btn-lg rounded-pill px-4 mb-4"
              href={book.infoLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google Books
            </a>
          )}

          <h2 className="h5">Description</h2>
          <p className="book-details-description mb-0">
            {book.description || 'No description available.'}
          </p>
        </div>
      </article>
    )
  }

  return (
    <div className="container py-4">
      {backLink}
      {renderContent()}
    </div>
  )
}
