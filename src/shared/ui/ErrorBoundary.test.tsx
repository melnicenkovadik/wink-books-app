import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

let shouldCrash = true

function Widget() {
  if (shouldCrash) throw new Error('boom')
  return <p>Widget works</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldCrash = true
    // React logs the caught error, keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the rest of the page when one part crashes', () => {
    render(
      <>
        <h1>Page title</h1>
        <ErrorBoundary message="The results could not be shown.">
          <Widget />
        </ErrorBoundary>
      </>,
    )

    expect(screen.getByRole('heading', { name: 'Page title' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('The results could not be shown.')
  })

  it('renders the part again after "Try again"', async () => {
    const user = userEvent.setup()
    render(
      <ErrorBoundary>
        <Widget />
      </ErrorBoundary>,
    )

    shouldCrash = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Widget works')).toBeInTheDocument()
  })

  it('recovers on its own when the reset key changes', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="page-1">
        <Widget />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    shouldCrash = false
    rerender(
      <ErrorBoundary resetKey="page-2">
        <Widget />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Widget works')).toBeInTheDocument()
  })

  it('can show a custom fallback instead of the alert', () => {
    render(
      <ErrorBoundary fallback={<p>This book could not be shown.</p>}>
        <Widget />
      </ErrorBoundary>,
    )

    expect(screen.getByText('This book could not be shown.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
