export function BookListSkeleton({ rows }: { rows: number }) {
  return (
    <ul className="book-grid placeholder-glow" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index}>
          <div className="book-card">
            <div className="book-row-cover">
              <span className="placeholder book-cover d-block w-100" />
            </div>
            <div className="flex-grow-1">
              <span className="placeholder col-7 d-block mb-2" />
              <span className="placeholder placeholder-sm col-4 d-block mb-3" />
              <span className="placeholder placeholder-sm col-12 d-block mb-1" />
              <span className="placeholder placeholder-sm col-10 d-block" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
