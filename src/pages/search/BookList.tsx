import { useLocation } from 'react-router'
import type { Book } from '../../entities/book'
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary'
import { BookListItem } from './BookListItem'

export function BookList({ books }: { books: Book[] }) {
  const location = useLocation()
  // set by BookListItem when a book is opened, so Back returns focus to it
  const focusBookId = (location.state as { focusBookId?: string } | null)?.focusBookId

  return (
    <ul className="book-grid">
      {books.map((book) => (
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
  )
}
