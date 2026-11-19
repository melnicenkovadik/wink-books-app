import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeResponse, makeVolume } from '../../test/fixtures'
import { stubFetch } from '../../test/fetchStub'
import { renderApp } from '../../test/renderApp'

const reply = (url: URL) =>
  url.pathname.endsWith('/volumes')
    ? { body: makeResponse('harry', 10) }
    : {
        body: makeVolume(url.pathname.split('/').pop()!, {
          description: '<p>Full <b>description</b></p>',
          publisher: 'Bloomsbury',
        }),
      }

describe('book details', () => {
  it('opens a book directly by its URL', async () => {
    const calls = stubFetch(reply)
    renderApp('/books/abc123')

    expect(await screen.findByRole('heading', { name: 'Book abc123' })).toBeInTheDocument()
    expect(calls[0].url.pathname).toBe('/books/v1/volumes/abc123')
    expect(screen.getByText('Bloomsbury')).toBeInTheDocument()
    expect(screen.getByText('Full description')).toBeInTheDocument()
  })

  it('links to the infoLink of the book', async () => {
    stubFetch(reply)
    renderApp('/books/abc123')

    expect(await screen.findByRole('link', { name: 'View on Google Books' })).toHaveAttribute(
      'href',
      'https://books.google.com/books?id=abc123',
    )
  })

  it('shows no Google Books link when the API did not send an infoLink', async () => {
    stubFetch(() => ({ body: makeVolume('abc123', { infoLink: undefined }) }))
    renderApp('/books/abc123')

    expect(await screen.findByRole('heading', { name: 'Book abc123' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'View on Google Books' })).not.toBeInTheDocument()
  })

  it('shows "Book not found" for an unknown id', async () => {
    stubFetch(() => ({ body: { error: { code: 404, message: 'Not found' } }, status: 404 }))
    renderApp('/books/nope')

    expect(await screen.findByText('Book not found.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Back to search' })).toHaveAttribute('href', '/')
  })

  it('goes from the list to a book and back to the same results', async () => {
    const calls = stubFetch(reply)
    const { user } = renderApp('/?q=harry&page=2&limit=5')

    await user.click(await screen.findByRole('link', { name: 'Book harry-3' }))
    expect(await screen.findByRole('heading', { name: 'Book harry-3' })).toBeInTheDocument()
    expect(screen.getByTestId('url')).toHaveTextContent('/books/harry-3')

    await user.click(screen.getByRole('button', { name: '← Back to results' }))

    const link = await screen.findByRole('link', { name: 'Book harry-3' })
    expect(screen.getByTestId('url')).toHaveTextContent('/?q=harry&page=2&limit=5')
    await waitFor(() => expect(link).toHaveFocus())
    expect(calls).toHaveLength(2)
  })
})
