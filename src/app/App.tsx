import { Link, Route, Routes } from 'react-router'
import { BookDetailsPage } from '../pages/book-details'
import { NotFoundPage } from '../pages/not-found/NotFoundPage'
import { SearchPage } from '../pages/search'

export function App() {
  return (
    <>
      <header className="app-header">
        <div className="container py-3">
          <Link to="/" className="app-brand">
            <span className="app-brand-mark" aria-hidden="true">
              B
            </span>
            Book Search
          </Link>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/books/:volumeId" element={<BookDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
