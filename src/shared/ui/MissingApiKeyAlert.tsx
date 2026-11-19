export function MissingApiKeyAlert() {
  return (
    <div className="alert alert-warning" role="alert">
      <strong>API key is not configured.</strong> Add <code>VITE_GOOGLE_BOOKS_API_KEY</code> to{' '}
      <code>.env.local</code> and restart the dev server. See the README for details.
    </div>
  )
}
