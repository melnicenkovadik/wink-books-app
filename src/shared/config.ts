export const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1'
export const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ?? ''
export const HAS_API_KEY = GOOGLE_BOOKS_API_KEY !== ''

// a failed request is repeated this many times before the user sees an error
export const MAX_RETRIES = 3
export const REQUEST_TIMEOUT_MS = 10_000
export const RETRY_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 400
