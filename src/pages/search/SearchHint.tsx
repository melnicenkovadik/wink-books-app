const SUGGESTIONS = ['Dune', 'Tolkien', 'Italian cooking', 'JavaScript']

export function SearchHint({ onSearch }: { onSearch: (query: string) => void }) {
  return (
    <div className="text-center py-5">
      <p className="mb-3">Start typing to search for books.</p>
      <div className="search-suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="search-chip"
            onClick={() => onSearch(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
