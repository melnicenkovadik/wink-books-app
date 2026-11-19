import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { dailyQuotaError, makeResponse, makeVolume } from '../../test/fixtures'
import { stubFetch } from '../../test/fetchStub'
import { renderApp } from '../../test/renderApp'

const searchInput = () => screen.getByRole('searchbox', { name: 'Search books' })
const currentUrl = () => screen.getByTestId('url').textContent

// Answers every search with books named after the query and page: "harry-p2-1", "harry-p2-2"…
const replyByQuery = (url: URL) => {
  const q = url.searchParams.get('q')
  const limit = Number(url.searchParams.get('maxResults'))
  const page = Number(url.searchParams.get('startIndex')) / limit + 1
  return { body: makeResponse(`${q}-p${page}`, limit) }
}

describe('live search', () => {
  it('shows a hint and sends nothing before the user types', () => {
    const calls = stubFetch(replyByQuery)
    renderApp()

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
    expect(screen.getByAltText('Powered by Google')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('searches without Enter, once the user pauses typing', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.type(searchInput(), 'harry')

    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()
    expect(calls).toHaveLength(1)
    expect(calls[0].url.origin + calls[0].url.pathname).toBe(
      'https://www.googleapis.com/books/v1/volumes',
    )
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({
      q: 'harry',
      startIndex: '0',
      maxResults: '10',
      key: 'test-key',
    })
    expect(currentUrl()).toBe('/?q=harry')
  })

  it('searches for a single character', async () => {
    stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.type(searchInput(), 'a')

    expect(await screen.findByText('Book a-p1-1')).toBeInTheDocument()
  })

  it('cancels the previous request when the query changes', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'ha')
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.type(searchInput(), 'rry')
    await waitFor(() => expect(calls).toHaveLength(2))

    expect(calls[0].signal.aborted).toBe(true)
    expect(calls[1].signal.aborted).toBe(false)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('never shows books from an older query, even if its response arrives late', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'ha')
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.type(searchInput(), 'rry')
    await waitFor(() => expect(calls).toHaveLength(2))

    await act(async () => calls[1].respond(makeResponse('harry', 10)))
    await act(async () => calls[0].respond(makeResponse('ha', 10)))

    expect(await screen.findByText('Book harry-1')).toBeInTheDocument()
    expect(screen.queryByText('Book ha-1')).not.toBeInTheDocument()
  })

  it('shows skeletons instead of the previous books while a new query loads', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'ha')
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0].respond(makeResponse('ha', 10)))
    expect(await screen.findByText('Book ha-1')).toBeInTheDocument()

    await user.type(searchInput(), 'rry')
    await waitFor(() => expect(calls).toHaveLength(2))

    expect(screen.queryByText('Book ha-1')).not.toBeInTheDocument()
    expect(screen.getByText('Loading results…')).toBeInTheDocument()
  })

  it('reuses the cache when the user goes back to an earlier query', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.type(searchInput(), 'ha')
    expect(await screen.findByText('Book ha-p1-1')).toBeInTheDocument()
    await user.type(searchInput(), 'r')
    expect(await screen.findByText('Book har-p1-1')).toBeInTheDocument()
    await user.type(searchInput(), '{Backspace}')

    expect(await screen.findByText('Book ha-p1-1')).toBeInTheDocument()
    expect(calls).toHaveLength(2)
  })

  it('clears the results and cancels the request when the field is emptied', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'ha')
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.clear(searchInput())

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
    expect(calls[0].signal.aborted).toBe(true)
    expect(calls).toHaveLength(1)
    expect(currentUrl()).toBe('/')
  })

  it('keeps focus and a trailing space in the field without a new request', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.type(searchInput(), 'harry')
    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()
    await user.type(searchInput(), ' ')
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(searchInput()).toHaveValue('harry ')
    expect(searchInput()).toHaveFocus()
    expect(calls).toHaveLength(1)
  })
})

describe('pagination and page size', () => {
  it('reads the state from the URL', async () => {
    const calls = stubFetch(replyByQuery)
    renderApp('/?q=harry&page=3&limit=5')

    expect(await screen.findByText('Book harry-p3-1')).toBeInTheDocument()
    expect(calls[0].url.searchParams.get('startIndex')).toBe('10')
    expect(calls[0].url.searchParams.get('maxResults')).toBe('5')
    expect(searchInput()).toHaveValue('harry')
  })

  it('ignores broken values in the URL', async () => {
    const calls = stubFetch(replyByQuery)
    renderApp('/?q=harry&page=abc&limit=7')

    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()
    expect(calls[0].url.searchParams.get('startIndex')).toBe('0')
    expect(calls[0].url.searchParams.get('maxResults')).toBe('10')
  })

  it('derives the number of pages from totalItems and marks the current page', async () => {
    stubFetch(() => ({ body: makeResponse('harry', 10, 95) }))
    renderApp('/?q=harry')

    const nav = await screen.findByRole('navigation', { name: 'Search results pages' })
    expect(within(nav).getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    expect(within(nav).queryByRole('button', { name: 'Page 11' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  it('changes the page with startIndex and serves a visited page from the cache', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp('/?q=harry')
    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(await screen.findByText('Book harry-p2-1')).toBeInTheDocument()
    expect(calls[1].url.searchParams.get('startIndex')).toBe('10')
    expect(currentUrl()).toBe('/?q=harry&page=2')

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()
    expect(calls).toHaveLength(2)
  })

  it('changes the page size and goes back to the first page', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp('/?q=harry&page=3')
    expect(await screen.findByText('Book harry-p3-1')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Per page'), '20')

    expect(await screen.findByText('Book harry-p1-20')).toBeInTheDocument()
    expect(calls[1].url.searchParams.get('maxResults')).toBe('20')
    expect(calls[1].url.searchParams.get('startIndex')).toBe('0')
    expect(currentUrl()).toBe('/?q=harry&limit=20')
    expect(
      within(screen.getByLabelText('Per page'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['5', '10', '15', '20'])
  })

  it('keeps the books when totalItems shrinks on a later page', async () => {
    stubFetch((url) =>
      url.searchParams.get('startIndex') === '0'
        ? { body: makeResponse('p1', 10, 500) }
        : { body: makeResponse('p2', 10, 25) },
    )
    const { user } = renderApp('/?q=harry')
    await screen.findByRole('button', { name: 'Page 50' })

    await user.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(await screen.findByText('Book p2-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 50' })).not.toBeInTheDocument()
  })

  it('offers a way back from an empty far page without jumping on its own', async () => {
    const calls = stubFetch((url) =>
      url.searchParams.get('startIndex') === '0'
        ? { body: makeResponse('p1', 10, 500) }
        : { body: { kind: 'books#volumes', totalItems: 11076 } },
    )
    const { user } = renderApp('/?q=harry&page=50')

    expect(await screen.findByText('No results on this page.')).toBeInTheDocument()
    expect(calls).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Go to page 1' }))
    expect(await screen.findByText('Book p1-1')).toBeInTheDocument()
  })
})

describe('result states', () => {
  it('says when nothing was found', async () => {
    stubFetch(() => ({ body: { kind: 'books#volumes', totalItems: 0 } }))
    renderApp('/?q=zzzz')

    expect(await screen.findByText('No books found for “zzzz”.')).toBeInTheDocument()
  })

  it('reports an exhausted daily quota without a retry button', async () => {
    stubFetch(() => ({ body: dailyQuotaError, status: 429 }))
    renderApp('/?q=harry')

    expect(
      await screen.findByText('The daily request quota for this API key is used up.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('lets the user retry after a network error', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=harry')
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0].fail())

    expect(
      await screen.findByText('Network error. Check your connection and try again.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    await act(async () => calls[1].respond(makeResponse('harry', 10)))

    expect(await screen.findByText('Book harry-1')).toBeInTheDocument()
  })

  it('uses the WiNK placeholder for a book without a cover', async () => {
    stubFetch(() => ({
      body: { totalItems: 1, items: [makeVolume('x', { imageLinks: undefined })] },
    }))
    renderApp('/?q=harry')

    expect(await screen.findByAltText('Cover of Book x')).toHaveAttribute(
      'src',
      'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover',
    )
  })

  it('gives every row a separate link to Google Books', async () => {
    stubFetch(() => ({ body: makeResponse('harry', 2) }))
    renderApp('/?q=harry')

    const row = (await screen.findByText('Book harry-1')).closest('li')!
    const external = within(row).getByRole('link', { name: 'View on Google Books' })

    expect(external).toHaveAttribute('href', 'https://books.google.com/books?id=harry-1')
    expect(within(row).getByRole('link', { name: 'Book harry-1' })).toHaveAttribute(
      'href',
      '/books/harry-1',
    )
    expect(row.querySelector('a a')).toBeNull()
  })
})
