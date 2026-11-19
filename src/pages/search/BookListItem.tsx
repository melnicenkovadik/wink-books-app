import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { BookCover, type Book } from '../../entities/book'

type Props = {
  book: Book
  shouldFocus: boolean
}

export function BookListItem({ book, shouldFocus }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const titleLink = useRef<HTMLAnchorElement>(null)
  const detailsPath = `/books/${book.id}`

  useEffect(() => {
    if (shouldFocus) titleLink.current?.focus()
  }, [shouldFocus])

  // so that Back can put focus on this book again
  const rememberBook = () => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: { focusBookId: book.id },
    })
  }

  const year = book.publishedDate?.slice(0, 4)

  return (
    <article className="book-card">
      <Link
        to={detailsPath}
        state={{ fromSearch: true }}
        onClick={rememberBook}
        className="book-row-cover"
        tabIndex={-1}
        aria-hidden="true"
      >
        <BookCover src={book.coverUrl} title={book.title} className="w-100" />
      </Link>
      <div className="book-row-body flex-grow-1">
        <h2 className="book-title">
          <Link
            ref={titleLink}
            to={detailsPath}
            state={{ fromSearch: true }}
            onClick={rememberBook}
          >
            {book.title}
          </Link>
        </h2>
        <p className="small mb-2">
          {book.authors.join(', ') || 'Unknown author'}
          {year && <span className="badge rounded-pill book-year ms-2">{year}</span>}
        </p>
        <p className="book-description small mb-0">
          {book.description || 'No description available.'}
        </p>
      </div>
    </article>
  )
}
