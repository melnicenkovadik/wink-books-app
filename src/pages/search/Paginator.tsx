import { getPageItems } from './pagination'

type Props = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Paginator({ page, pageCount, onPageChange }: Props) {
  if (pageCount <= 1) return null

  const isFirst = page <= 1
  const isLast = page >= pageCount

  return (
    <nav aria-label="Search results pages">
      <ul className="pagination justify-content-center flex-wrap mb-0">
        <li className={`page-item ${isFirst ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            disabled={isFirst}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
        </li>

        <li className="page-item disabled d-sm-none">
          <span className="page-link">
            Page {page} of {pageCount}
          </span>
        </li>

        {getPageItems(page, pageCount).map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`gap-${index}`} className="page-item disabled d-none d-sm-block">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li
              key={item}
              className={`page-item d-none d-sm-block ${item === page ? 'active' : ''}`}
            >
              <button
                type="button"
                className="page-link"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}

        <li className={`page-item ${isLast ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            disabled={isLast}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}
