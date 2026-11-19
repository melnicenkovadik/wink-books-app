import { describe, expect, it } from 'vitest'
import { htmlToText, mapVolume } from './mapVolume'

describe('mapVolume', () => {
  it('maps a full volume and upgrades links to https', () => {
    const book = mapVolume({
      id: 'abc',
      volumeInfo: {
        title: 'Title',
        authors: ['A', 'B'],
        imageLinks: { thumbnail: 'http://books.google.com/cover.jpg' },
        infoLink: 'http://books.google.com/books?id=abc',
      },
    })

    expect(book).toMatchObject({
      id: 'abc',
      title: 'Title',
      authors: ['A', 'B'],
      coverUrl: 'https://books.google.com/cover.jpg',
      infoLink: 'https://books.google.com/books?id=abc',
      googleBooksUrl: 'https://books.google.com/books?id=abc',
    })
  })

  it('uses the WiNK placeholder when the volume has no image', () => {
    expect(mapVolume({ id: 'abc', volumeInfo: { title: 'No cover' } }).coverUrl).toBe(
      'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover',
    )
  })

  it('fills in defaults for missing fields', () => {
    expect(mapVolume({ id: 'abc' })).toMatchObject({
      title: 'Untitled',
      authors: [],
      description: '',
      categories: [],
      infoLink: undefined,
      googleBooksUrl: undefined,
    })
  })

  it('keeps infoLink empty and falls back to other Google Books links', () => {
    const withCanonical = mapVolume({
      id: 'abc',
      volumeInfo: { canonicalVolumeLink: 'https://books.google.com/books/about/X.html?id=abc' },
    })
    expect(withCanonical.infoLink).toBeUndefined()
    expect(withCanonical.googleBooksUrl).toBe('https://books.google.com/books/about/X.html?id=abc')

    const withIsbn = mapVolume({
      id: 'abc',
      volumeInfo: { industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780747532743' }] },
    })
    expect(withIsbn.googleBooksUrl).toBe('https://books.google.com/books?vid=ISBN9780747532743')
  })
})

describe('htmlToText', () => {
  it('turns markup into plain text with line breaks', () => {
    expect(htmlToText('<p>First <b>bold</b></p><p>Second<br>line</p>')).toBe(
      'First bold\n\nSecond\nline',
    )
  })

  it('drops scripts', () => {
    expect(htmlToText('Hello<script>alert(1)</script> world')).toBe('Hello world')
  })

  it('returns an empty string when there is no description', () => {
    expect(htmlToText(undefined)).toBe('')
  })
})
