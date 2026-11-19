import { describe, expect, it } from 'vitest'
import { getCategoryLabels, getLanguageName } from './bookFormat'

describe('getCategoryLabels', () => {
  it('splits the paths Google sends and shows every label once', () => {
    expect(
      getCategoryLabels([
        'Fiction / Science Fiction / General',
        'Fiction / Fantasy / General',
        'Fiction / Science Fiction / Space Opera',
      ]),
    ).toEqual(['Fiction', 'Science Fiction', 'Fantasy', 'Space Opera'])
  })

  it('treats the same label in another case as a duplicate', () => {
    expect(getCategoryLabels(['Fiction', 'fiction ', ' FICTION'])).toEqual(['Fiction'])
  })

  it('drops empty parts and the meaningless "General"', () => {
    expect(getCategoryLabels(['Cooking / / General', ''])).toEqual(['Cooking'])
  })

  it('returns nothing for a book without categories', () => {
    expect(getCategoryLabels([])).toEqual([])
  })
})

describe('getLanguageName', () => {
  it('turns a language code into a name people read', () => {
    expect(getLanguageName('it')).toBe('Italian')
    expect(getLanguageName('en')).toBe('English')
  })

  it('falls back to the code when it is not a language', () => {
    expect(getLanguageName('not a code')).toBe('NOT A CODE')
  })
})
