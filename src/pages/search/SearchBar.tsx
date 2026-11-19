import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLocation } from 'react-router'
import { normalizeQuery } from './useSearchUrlState'

export const SEARCH_DEBOUNCE_MS = 300

type Props = {
  query: string
  onSearch: (value: string) => void
}

export function SearchBar({ query, onSearch }: Props) {
  const [text, setText] = useState(query)
  const timer = useRef<number | undefined>(undefined)
  const { key: locationKey } = useLocation()
  const [syncedLocationKey, setSyncedLocationKey] = useState(locationKey)

  // back/forward: take the value from the url, but don't touch what is being typed
  if (locationKey !== syncedLocationKey) {
    setSyncedLocationKey(locationKey)
    if (normalizeQuery(text) !== query) setText(query)
  }

  // and drop the pending search, or the old timer overwrites the url later
  useEffect(() => () => window.clearTimeout(timer.current), [locationKey])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setText(value)
    window.clearTimeout(timer.current)

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
        placeholder="Title, author, ISBN"
        autoComplete="off"
        value={text}
        onChange={handleChange}
      />
    </div>
  )
}
