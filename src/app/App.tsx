import { Link, Route, Routes } from 'react-router'
import { BookDetailsPage } from '../pages/book-details'
import { NotFoundPage } from '../pages/not-found/NotFoundPage'
import { SearchPage } from '../pages/search'

export function App() {
  return (
    <>
      <header className="app-header border-bottom bg-white">
        <div className="container py-3">
          <Link to="/" className="navbar-brand fw-semibold fs-4">
            Book Search
          </Link>
        </div>
      </header>
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/books/:volumeId" element={<BookDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
