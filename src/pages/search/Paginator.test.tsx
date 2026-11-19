import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Paginator } from './Paginator'

describe('Paginator', () => {
  it('is not shown when there is a single page', () => {
    const { container } = render(<Paginator page={1} pageCount={1} onPageChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('disables Previous on the first page and Next on the last', () => {
    const { rerender } = render(<Paginator page={1} pageCount={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    rerender(<Paginator page={5} pageCount={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('reports the page the user picked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Paginator page={4} pageCount={20} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Previous' }))
    await user.click(screen.getByRole('button', { name: 'Page 20' }))

    expect(onPageChange.mock.calls).toEqual([[5], [3], [20]])
  })

  it('can be used from the keyboard', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Paginator page={2} pageCount={3} onPageChange={onPageChange} />)

    screen.getByRole('button', { name: 'Page 3' }).focus()
    await user.keyboard('{Enter}')

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('does not claim "page 96 of 95" when the user is past the end', () => {
    render(<Paginator page={96} pageCount={95} onPageChange={vi.fn()} />)

    expect(screen.getByText('Page 96')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
