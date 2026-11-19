import { Link, Route, Routes, useLocation } from 'react-router'
import { BookDetailsPage } from '../pages/book-details'
import { NotFoundPage } from '../pages/not-found/NotFoundPage'
import { SearchPage } from '../pages/search'
import { ErrorBoundary } from '../shared/ui/ErrorBoundary'
import { ThemeToggle } from './ThemeToggle'

export function App() {
  const location = useLocation()

  return (
    <>
      <header className="app-header">
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <Link to="/" className="app-brand">
            <span className="app-brand-mark" aria-hidden="true">
              B
            </span>
            Book Search
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <ErrorBoundary resetKey={location.key} message="This page could not be shown.">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/books/:volumeId" element={<BookDetailsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </>
  )
}
