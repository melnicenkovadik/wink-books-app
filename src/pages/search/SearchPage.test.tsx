import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { dailyQuotaError, makeResponse, makeVolume } from '../../test/fixtures'
import { stubFetch, type FetchCall } from '../../test/fetchStub'
import { renderApp } from '../../test/renderApp'

const searchInput = () => screen.getByRole('searchbox', { name: 'Search books' })
const currentUrl = () => screen.getByTestId('url').textContent

// books are named after the query and page: harry-p2-1, harry-p2-2
const replyByQuery = (url: URL) => {
  const q = url.searchParams.get('q')
  const limit = Number(url.searchParams.get('maxResults'))
  const page = Number(url.searchParams.get('startIndex')) / limit + 1
  return { body: makeResponse(`${q}-p${page}`, limit) }
}

// fails the request and every automatic retry of it
async function failAll(calls: FetchCall[], times: number) {
  for (let attempt = 1; attempt <= times; attempt++) {
    await waitFor(() => expect(calls).toHaveLength(attempt))
    await act(async () => calls[attempt - 1].fail())
  }
}

describe('live search', () => {
  it('shows a hint and sends nothing before the user types', () => {
    const calls = stubFetch(replyByQuery)
    renderApp()

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('searches on every typed character and cancels the requests it no longer needs', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'har')
    await waitFor(() => expect(calls).toHaveLength(3))

    expect(calls.map((call) => call.url.searchParams.get('q'))).toEqual(['h', 'ha', 'har'])
    expect(calls.map((call) => call.signal.aborted)).toEqual([true, true, false])
    expect(calls[2].url.origin + calls[2].url.pathname).toBe(
      'https://www.googleapis.com/books/v1/volumes',
    )
    expect(Object.fromEntries(calls[2].url.searchParams)).toEqual({
      q: 'har',
      startIndex: '0',
      maxResults: '10',
      printType: 'books',
      fields:
        'totalItems,items(id,volumeInfo(title,authors,publishedDate,description,imageLinks/thumbnail))',
      key: 'test-key',
    })

    await act(async () => calls[2].respond(makeResponse('har', 10)))
    expect(await screen.findByText('Book har-1')).toBeInTheDocument()
    expect(currentUrl()).toBe('/?q=har')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('never shows books from an older query, even if its response arrives late', async () => {
    const calls = stubFetch()
    const { user } = renderApp()

    await user.type(searchInput(), 'har')
    await waitFor(() => expect(calls).toHaveLength(3))

    await act(async () => calls[2].respond(makeResponse('har', 10)))
    await act(async () => calls[1].respond(makeResponse('ha', 10)))

    expect(await screen.findByText('Book har-1')).toBeInTheDocument()
    expect(screen.queryByText('Book ha-1')).not.toBeInTheDocument()
  })

  it('shows skeletons instead of the previous books while a new query loads', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=ha')
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0].respond(makeResponse('ha', 10)))
    expect(await screen.findByText('Book ha-1')).toBeInTheDocument()

    await user.type(searchInput(), 'r')
    await waitFor(() => expect(calls).toHaveLength(2))

    expect(screen.queryByText('Book ha-1')).not.toBeInTheDocument()
    expect(screen.getByText('Loading results...')).toBeInTheDocument()
  })

  it('reuses the cache when the user goes back to an earlier query', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp('/?q=ha')
    expect(await screen.findByText('Book ha-p1-1')).toBeInTheDocument()

    await user.type(searchInput(), 'r')
    expect(await screen.findByText('Book har-p1-1')).toBeInTheDocument()
    await user.type(searchInput(), '{Backspace}')

    expect(await screen.findByText('Book ha-p1-1')).toBeInTheDocument()
    expect(calls).toHaveLength(2)
  })

  it('clears the results and cancels the request when the field is emptied', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=ha')
    await waitFor(() => expect(calls).toHaveLength(1))

    await user.clear(searchInput())

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
    expect(calls[0].signal.aborted).toBe(true)
    expect(calls).toHaveLength(1)
    expect(currentUrl()).toBe('/')
  })

  it('keeps focus and a trailing space in the field without a new request', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp('/?q=harry')
    expect(await screen.findByText('Book harry-p1-1')).toBeInTheDocument()

    await user.type(searchInput(), ' ')

    expect(searchInput()).toHaveValue('harry ')
    expect(searchInput()).toHaveFocus()
    expect(calls).toHaveLength(1)
  })

  it('searches for a pasted text with one request', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.click(searchInput())
    await user.paste('harry potter')

    expect(await screen.findByText('Book harry potter-p1-1')).toBeInTheDocument()
    expect(calls).toHaveLength(1)
  })
})

describe('home screen', () => {
  it('starts a search from a suggestion and fills the field', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Tolkien' }))

    expect(await screen.findByText('Book Tolkien-p1-1')).toBeInTheDocument()
    expect(searchInput()).toHaveValue('Tolkien')
    expect(currentUrl()).toBe('/?q=Tolkien')
    expect(calls).toHaveLength(1)
  })

  it('puts the query into the tab title', async () => {
    stubFetch(replyByQuery)
    renderApp('/?q=dune')

    await screen.findByText('Book dune-p1-1')
    expect(document.title).toBe('dune - Book Search')
  })

  it('sends nothing for spaces only', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.type(searchInput(), '   ')

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('collapses extra spaces before they reach the API and the URL', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp()

    await user.click(searchInput())
    await user.paste('  harry    potter ')

    await screen.findByText('Book harry potter-p1-1')
    expect(calls[0].url.searchParams.get('q')).toBe('harry potter')
    expect(currentUrl()).toBe('/?q=harry+potter')
    expect(searchInput()).toHaveValue('  harry    potter ')
  })

  it('shows a page for an unknown address with a way back', async () => {
    stubFetch(replyByQuery)
    const { user } = renderApp('/no/such/page')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to search' }))

    expect(screen.getByText('Start typing to search for books.')).toBeInTheDocument()
  })
})

describe('history', () => {
  it('follows Back even when a typed search is still waiting for the debounce', async () => {
    stubFetch(replyByQuery)
    const { user } = renderApp('/?q=dune')
    expect(await screen.findByText('Book dune-p1-1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(await screen.findByText('Book dune-p2-1')).toBeInTheDocument()

    await user.type(searchInput(), 'marine biology', {
      initialSelectionStart: 0,
      initialSelectionEnd: 4,
    })
    await user.click(screen.getByRole('button', { name: 'Browser back' }))
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(currentUrl()).toBe('/?q=dune')
    expect(searchInput()).toHaveValue('dune')
    expect(screen.getByText('Book dune-p1-1')).toBeInTheDocument()
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

  it('keeps the current page on screen, marked as busy, while the next one loads', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=harry')
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0].respond(makeResponse('p1', 10)))
    await screen.findByText('Book p1-1')

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    await waitFor(() => expect(calls).toHaveLength(2))

    expect(screen.getByText('Loading page 2...')).toBeInTheDocument()
    expect(screen.getByText('Book p1-1').closest('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')

    await act(async () => calls[1].respond(makeResponse('p2', 10)))

    expect(await screen.findByText('Book p2-1')).toBeInTheDocument()
    expect(screen.queryByText('Book p1-1')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
  })

  it('loads the next page ahead when the user points at Next, so the click is instant', async () => {
    const calls = stubFetch(replyByQuery)
    const { user } = renderApp('/?q=harry')
    await screen.findByText('Book harry-p1-1')

    await user.hover(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].url.searchParams.get('startIndex')).toBe('10')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Book harry-p2-1')).toBeInTheDocument()
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

  it('does not trust a total that grows on later pages and learns where results end', async () => {
    // what Google really does: a small total on the first page, thousands later, books end early
    stubFetch((url) => {
      const start = Number(url.searchParams.get('startIndex'))
      if (start === 0) return { body: makeResponse('p1', 10, 60) }
      if (start === 10) return { body: makeResponse('p2', 10, 21762) }
      return { body: { kind: 'books#volumes', totalItems: 21762 } }
    })
    const { user } = renderApp('/?q=harry')
    await screen.findByText('Book p1-1')

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(await screen.findByText('Book p2-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 7' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Page 6' }))
    expect(await screen.findByText('No results on this page.')).toBeInTheDocument()
  })

  it('finds the real last page from an empty one with a few requests', async () => {
    // 100 pages promised, books only on the first 37
    const calls = stubFetch((url) => {
      const page = Number(url.searchParams.get('startIndex')) / 10 + 1
      return page <= 37
        ? { body: makeResponse(`p${page}`, 10, 1000) }
        : { body: { kind: 'books#volumes', totalItems: 1000 } }
    })
    const { user } = renderApp('/?q=harry')
    await screen.findByText('Book p1-1')

    await user.click(screen.getByRole('button', { name: 'Page 100' }))
    expect(await screen.findByText('No results on this page.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go to the last page with results' }))

    expect(await screen.findByText('Book p37-1')).toBeInTheDocument()
    expect(currentUrl()).toBe('/?q=harry&page=37')
    expect(screen.getByRole('button', { name: 'Page 37' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Page 38' })).not.toBeInTheDocument()
    expect(calls.length).toBeLessThanOrEqual(10)
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

    await user.click(screen.getByRole('button', { name: 'Go to the last page with results' }))
    expect(await screen.findByText('Book p1-1')).toBeInTheDocument()
    expect(currentUrl()).toBe('/?q=harry')
  })
})

describe('result states', () => {
  it('says when nothing was found', async () => {
    stubFetch(() => ({ body: { kind: 'books#volumes', totalItems: 0 } }))
    renderApp('/?q=zzzz')

    expect(await screen.findByText('No books found for "zzzz".')).toBeInTheDocument()
  })

  it('reports an exhausted daily quota without retrying or a retry button', async () => {
    const calls = stubFetch(() => ({ body: dailyQuotaError, status: 429 }))
    renderApp('/?q=harry')

    expect(
      await screen.findByText('The daily request quota for this API key is used up.'),
    ).toBeInTheDocument()
    expect(calls).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('repeats a failed request on its own and shows no error when it recovers', async () => {
    const calls = stubFetch()
    renderApp('/?q=harry')
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0].fail())
    await waitFor(() => expect(calls).toHaveLength(2))
    await act(async () => calls[1].respond(makeResponse('harry', 10)))

    expect(await screen.findByText('Book harry-1')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('gives up after three retries and then lets the user try again', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=harry')
    await failAll(calls, 4)

    expect(
      await screen.findByText('Network error. Check your connection and try again.'),
    ).toBeInTheDocument()
    expect(calls).toHaveLength(4)

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(calls).toHaveLength(5))
    await act(async () => calls[4].respond(makeResponse('harry', 10)))

    expect(await screen.findByText('Book harry-1')).toBeInTheDocument()
  })

  it('does not repeat a request the API refused', async () => {
    const calls = stubFetch(() => ({ body: { error: { message: 'Bad' } }, status: 400 }))
    renderApp('/?q=harry')

    expect(await screen.findByText(/The search request was rejected/)).toBeInTheDocument()
    expect(calls).toHaveLength(1)
  })

  it('cancels a retried request when the query changes', async () => {
    const calls = stubFetch()
    const { user } = renderApp('/?q=plant')
    await failAll(calls, 4)

    await user.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(calls).toHaveLength(5))
    await user.type(searchInput(), 's')
    await waitFor(() => expect(calls).toHaveLength(6))

    expect(calls[4].signal.aborted).toBe(true)
    await act(async () => calls[5].respond(makeResponse('plants', 10)))
    expect(await screen.findByText('Book plants-1')).toBeInTheDocument()
  })

  it('offers the first page when a far page fails, whatever the reason', async () => {
    stubFetch((url) =>
      url.searchParams.get('startIndex') === '0'
        ? { body: makeResponse('p1', 10) }
        : { body: { error: { code: 400, message: 'Invalid parameters.' } }, status: 400 },
    )
    const { user } = renderApp('/?q=harry&page=501&limit=5')

    expect(await screen.findByText(/The search request was rejected/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Go to page 1' }))

    expect(await screen.findByText('Book p1-1')).toBeInTheDocument()
    expect(currentUrl()).toBe('/?q=harry&limit=5')
  })

  it('does not offer the first page when the first page itself fails', async () => {
    stubFetch(() => ({
      body: { error: { code: 400, message: 'API key not valid.' } },
      status: 400,
    }))
    renderApp('/?q=harry')

    expect(await screen.findByText(/API key not valid/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to page 1' })).not.toBeInTheDocument()
  })

  it('shows the author, year and description of every book', async () => {
    stubFetch(() => ({
      body: {
        totalItems: 1,
        items: [
          makeVolume('x', {
            authors: ['Frank Herbert', 'Brian Herbert'],
            publishedDate: '1965-08-01',
            description: '<p>A <b>desert</b> planet.</p>',
          }),
        ],
      },
    }))
    renderApp('/?q=dune')

    expect(await screen.findByText('Frank Herbert, Brian Herbert')).toBeInTheDocument()
    expect(screen.getByText('1965')).toBeInTheDocument()
    expect(screen.getByText('A desert planet.')).toHaveClass('book-description')
  })

  it('fills the gaps when a book has no author and no description', async () => {
    stubFetch(() => ({
      body: {
        totalItems: 1,
        items: [makeVolume('x', { authors: undefined, description: undefined })],
      },
    }))
    renderApp('/?q=dune')

    expect(await screen.findByText('Unknown author')).toBeInTheDocument()
    expect(screen.getByText('No description available.')).toBeInTheDocument()
  })

  it('keeps the order of the books as the API returned it', async () => {
    stubFetch(() => ({
      body: { totalItems: 3, items: [makeVolume('c'), makeVolume('a'), makeVolume('b')] },
    }))
    renderApp('/?q=dune')

    await screen.findByText('Book c')
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Book c',
      'Book a',
      'Book b',
    ])
  })

  it('announces the number of results to screen readers', async () => {
    stubFetch(() => ({ body: makeResponse('harry', 10, 1234) }))
    renderApp('/?q=harry&page=2')

    expect(await screen.findByText('About 1,234 results, page 2 of 124')).toHaveAttribute(
      'role',
      'status',
    )
  })

  it('says when Google is down, after trying again by itself', async () => {
    const calls = stubFetch(() => ({ body: {}, status: 503 }))
    renderApp('/?q=harry')

    expect(await screen.findByText('Google Books is temporarily unavailable.')).toBeInTheDocument()
    expect(calls).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('shows the reason Google gave for refusing the key', async () => {
    stubFetch(() => ({
      body: { error: { code: 403, message: 'Requests from this referer are blocked.' } },
      status: 403,
    }))
    renderApp('/?q=harry')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google Books refused the request (403). Requests from this referer are blocked.',
    )
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
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

  it('links every book to its details page', async () => {
    stubFetch(() => ({ body: makeResponse('harry', 2) }))
    renderApp('/?q=harry')

    expect(await screen.findByRole('link', { name: 'Book harry-1' })).toHaveAttribute(
      'href',
      '/books/harry-1',
    )
  })
})
