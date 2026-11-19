import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BookDescription } from './BookDescription'

describe('BookDescription', () => {
  it('keeps simple formatting', () => {
    const { container } = render(
      <BookDescription html="<p>First <b>bold</b> and <i>italic</i></p><ul><li>One</li></ul>" />,
    )

    expect(screen.getByText('bold').tagName).toBe('B')
    expect(screen.getByText('italic').tagName).toBe('I')
    expect(screen.getByRole('listitem')).toHaveTextContent('One')
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('keeps line breaks', () => {
    const { container } = render(<BookDescription html="Line one<br>Line two" />)
    expect(container.querySelectorAll('br')).toHaveLength(1)
  })

  it('drops scripts completely', () => {
    const { container } = render(<BookDescription html="Hello<script>alert(1)</script> world" />)

    expect(container.querySelector('script')).toBeNull()
    expect(container).toHaveTextContent('Hello world')
  })

  it('never copies attributes, so event handlers and styles cannot get in', () => {
    const { container } = render(
      <BookDescription html='<p onclick="alert(1)" style="color:red">Text</p>' />,
    )
    const paragraph = container.querySelector('p')!

    expect(paragraph.getAttributeNames()).toEqual([])
  })

  it('turns tags that are not allowed into plain text', () => {
    const { container } = render(
      <BookDescription html='<a href="javascript:alert(1)">link</a> <img src="x" onerror="x"> <h1>Big</h1>' />,
    )

    expect(container.querySelector('a, img, h1')).toBeNull()
    expect(container).toHaveTextContent('link Big')
  })
})
