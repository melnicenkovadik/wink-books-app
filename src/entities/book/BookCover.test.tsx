import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BookCover } from './BookCover'
import { PLACEHOLDER_COVER_URL } from './mapVolume'

describe('BookCover', () => {
  it('shows the given image with a readable alt text', () => {
    render(<BookCover src="https://books.google.com/cover.jpg" title="Dune" />)

    const image = screen.getByAltText('Cover of Dune')
    expect(image).toHaveAttribute('src', 'https://books.google.com/cover.jpg')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('falls back to the placeholder when the image fails to load', () => {
    render(<BookCover src="https://books.google.com/broken.jpg" title="Dune" />)
    const image = screen.getByAltText('Cover of Dune')

    fireEvent.error(image)

    expect(image).toHaveAttribute('src', PLACEHOLDER_COVER_URL)
  })

  it('does not loop when the placeholder itself fails', () => {
    render(<BookCover src={PLACEHOLDER_COVER_URL} title="Dune" />)
    const image = screen.getByAltText('Cover of Dune')

    fireEvent.error(image)
    fireEvent.error(image)

    expect(image).toHaveAttribute('src', PLACEHOLDER_COVER_URL)
  })
})
