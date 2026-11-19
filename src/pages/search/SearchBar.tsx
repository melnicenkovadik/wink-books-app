import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { normalizeQuery } from './useSearchUrlState'

export const SEARCH_DEBOUNCE_MS = 300

type Props = {
  query: string
  onSearch: (value: string) => void
}

export function SearchBar({ query, onSearch }: Props) {
  const [text, setText] = useState(query)
  const [lastQuery, setLastQuery] = useState(query)
  const timer = useRef<number | undefined>(undefined)

  // The URL changed from outside (Back/Forward): follow it, but never touch
  // what the user is typing when it already matches.
  if (query !== lastQuery) {
    setLastQuery(query)
    if (normalizeQuery(text) !== query) setText(query)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setText(value)
    window.clearTimeout(timer.current)

    // Clearing the field should clear the results right away.
    if (normalizeQuery(value) === '') {
      onSearch('')
      return
    }
    timer.current = window.setTimeout(() => onSearch(value), SEARCH_DEBOUNCE_MS)
  }

  return (
    <div>
      <label htmlFor="search" className="form-label fw-semibold">
        Search books
      </label>
      <input
        id="search"
        type="search"
        className="form-control form-control-lg"
        placeholder="Title, author, ISBN…"
        autoComplete="off"
        value={text}
        onChange={handleChange}
      />
    </div>
  )
}
