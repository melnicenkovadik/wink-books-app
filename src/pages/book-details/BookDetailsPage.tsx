import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  BookCover,
  BookDescription,
  describeApiError,
  useGetBookByIdQuery,
} from '../../entities/book'
import { HAS_API_KEY } from '../../shared/config'
import { ErrorAlert } from '../../shared/ui/ErrorAlert'
import { MissingApiKeyAlert } from '../../shared/ui/MissingApiKeyAlert'
import { BookDetailsSkeleton } from './BookDetailsSkeleton'
import { BookFacts } from './BookFacts'

function BackLink() {
  const location = useLocation()
  const navigate = useNavigate()
  const cameFromSearch = (location.state as { fromSearch?: boolean } | null)?.fromSearch === true

  // from the list we go back in history, so the same search, page and focus come back
  if (cameFromSearch) {
    return (
      <button
        type="button"
        className="btn btn-link px-0 mb-3 fw-semibold"
        onClick={() => navigate(-1)}
      >
        ← Back to results
      </button>
    )
  }
  return (
    <Link to="/" className="d-inline-block mb-3 fw-semibold">
      ← Back to search
    </Link>
  )
}

function BookDetails({ volumeId }: { volumeId: string }) {
  const { currentData: book, error, isFetching, refetch } = useGetBookByIdQuery(volumeId)
  const apiError = describeApiError(error)

  if (!book) {
    if (apiError && !isFetching) {
      return (
        <ErrorAlert message={apiError.message} onRetry={apiError.canRetry ? refetch : undefined} />
      )
    }
    return <BookDetailsSkeleton />
  }

  return (
    <article className="book-details row g-4 mx-0">
      <div className="col-8 col-sm-5 col-md-4 col-lg-3 mx-auto mx-md-0">
        <BookCover src={book.coverUrl} title={book.title} className="w-100" />
      </div>
      <div className="col-12 col-md">
        <h1 className="book-details-title mb-2">{book.title}</h1>
        {book.subtitle && <p className="lead mb-2">{book.subtitle}</p>}
        <p className="fs-5 mb-4">{book.authors.join(', ') || 'Unknown author'}</p>

        <BookFacts book={book} />

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
        {book.descriptionHtml ? (
          <BookDescription html={book.descriptionHtml} />
        ) : (
          <p className="mb-0">No description available.</p>
        )}
      </div>
    </article>
  )
}

export function BookDetailsPage() {
  const { volumeId = '' } = useParams()

  return (
    <div className="container py-4">
      <BackLink />
      {HAS_API_KEY ? <BookDetails volumeId={volumeId} /> : <MissingApiKeyAlert />}
    </div>
  )
}
