import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="h3">Page not found</h1>
      <Link to="/">Back to search</Link>
    </div>
  )
}
