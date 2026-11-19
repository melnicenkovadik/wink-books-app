export function BookListSkeleton({ rows }: { rows: number }) {
  return (
    <ul className="list-group placeholder-glow" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="list-group-item d-flex gap-3 py-3">
          <div className="book-row-cover">
            <span className="placeholder book-cover d-block w-100" />
          </div>
          <div className="flex-grow-1">
            <span className="placeholder col-6 d-block mb-2" />
            <span className="placeholder placeholder-sm col-3 d-block mb-2" />
            <span className="placeholder placeholder-sm col-12 d-block mb-1" />
            <span className="placeholder placeholder-sm col-10 d-block" />
          </div>
        </li>
      ))}
    </ul>
  )
}
