import type { ReactNode } from 'react'

type Props = {
  message: string
  onRetry?: () => void
  children?: ReactNode
}

export function ErrorAlert({ message, onRetry, children }: Props) {
  return (
    <div className="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
      <span className="flex-grow-1">{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
      {children}
    </div>
  )
}
