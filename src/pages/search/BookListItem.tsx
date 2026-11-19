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

  // Remember which book was opened, so Back can return focus to it.
  const rememberBook = () => {
    navigate(location.pathname + location.search, {
      replace: true,
      state: { focusBookId: book.id },
    })
  }

  const year = book.publishedDate?.slice(0, 4)
  const byline = [book.authors.join(', ') || 'Unknown author', year].filter(Boolean).join(' · ')

  return (
    <li className="list-group-item d-flex gap-3 py-3">
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
        <h2 className="h6 mb-1">
          <Link
            ref={titleLink}
            to={detailsPath}
            state={{ fromSearch: true }}
            onClick={rememberBook}
          >
            {book.title}
          </Link>
        </h2>
        <p className="small text-body-secondary mb-1">{byline}</p>
        <p className="book-description small mb-0">
          {book.description || 'No description available.'}
        </p>
      </div>
    </li>
  )
}
