import type { ReactNode } from 'react'
import { useFindLastPage } from './useFindLastPage'

type Props = {
  q: string
  limit: number
  lastPageWithBooks: number
  firstEmptyPage: number
  onPageChange: (page: number) => void
  children: ReactNode
}

// A page past the real end of the results: Google promised more than it has.
export function EmptyPage({ onPageChange, children, ...range }: Props) {
  const { findLastPage, isSearching } = useFindLastPage()

  const goToLastPage = async () => {
    onPageChange(await findLastPage(range))
  }

  return (
    <div className="text-center py-5">
      <p role="status">No results on this page.</p>
      <p className="small text-body-secondary">
        Google Books reports more results than it can return.
      </p>
      <button
        type="button"
        className="btn btn-primary mb-4"
        disabled={isSearching}
        onClick={goToLastPage}
      >
        {isSearching ? 'Looking for the last page...' : 'Go to the last page with results'}
      </button>
      {children}
    </div>
  )
}
