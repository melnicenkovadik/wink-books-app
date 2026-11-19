import { act, screen, waitFor } from '@testing-library/react'
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
    expect(screen.getByText('description').tagName).toBe('B')
    expect(screen.getByText('description').closest('p')).toHaveTextContent('Full description')
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

  it('hides facts the API did not send instead of showing empty labels', async () => {
    stubFetch(() => ({ body: { id: 'abc123', volumeInfo: { title: 'Bare book' } } }))
    renderApp('/books/abc123')

    expect(await screen.findByRole('heading', { name: 'Bare book' })).toBeInTheDocument()
    expect(screen.getByText('Unknown author')).toBeInTheDocument()
    expect(screen.getByText('No description available.')).toBeInTheDocument()
    expect(screen.queryByText('Publisher')).not.toBeInTheDocument()
    expect(screen.getByAltText('Cover of Bare book')).toHaveAttribute(
      'src',
      'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover',
    )
  })

  it('opens a working Google Books page when the Play Store infoLink would be a 404', async () => {
    stubFetch(() => ({
      body: {
        id: 'abc123',
        volumeInfo: {
          title: 'Old report',
          infoLink: 'https://play.google.com/store/books/details?id=abc123',
        },
        saleInfo: { saleability: 'NOT_FOR_SALE' },
      },
    }))
    renderApp('/books/abc123')

    expect(await screen.findByRole('link', { name: 'View on Google Books' })).toHaveAttribute(
      'href',
      'https://books.google.com/books?id=abc123',
    )
  })

  it('opens the external link in a new tab without giving it access to the page', async () => {
    stubFetch(reply)
    renderApp('/books/abc123')

    const link = await screen.findByRole('link', { name: 'View on Google Books' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('retries on its own and then lets the user try again when the book cannot be loaded', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/books/abc123')
    for (let attempt = 1; attempt <= 4; attempt++) {
      await waitFor(() => expect(calls).toHaveLength(attempt))
      await act(async () => calls[attempt - 1].fail())
    }

    expect(
      await screen.findByText('Network error. Check your connection and try again.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(calls).toHaveLength(5))
    await act(async () => calls[4].respond(makeVolume('abc123')))

    expect(await screen.findByRole('heading', { name: 'Book abc123' })).toBeInTheDocument()
  })

  it('shows a loading state before the book arrives', async () => {
    const calls = stubFetch()
    renderApp('/books/abc123')

    expect(screen.getByText('Loading book...')).toBeInTheDocument()
    await waitFor(() => expect(calls).toHaveLength(1))
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
