import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getInitialTheme } from '../shared/theme'
import { ThemeToggle } from './ThemeToggle'

const systemPrefersDark = (matches: boolean) =>
  vi.stubGlobal('matchMedia', () => ({ matches }) as MediaQueryList)

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-bs-theme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is light by default', () => {
    expect(getInitialTheme()).toBe('light')
  })

  it('follows the system setting on the first visit', () => {
    systemPrefersDark(true)
    expect(getInitialTheme()).toBe('dark')
  })

  it('prefers what the user chose over the system setting', () => {
    systemPrefersDark(true)
    localStorage.setItem('theme', 'light')
    expect(getInitialTheme()).toBe('light')
  })

  it('ignores a broken saved value', () => {
    localStorage.setItem('theme', 'purple')
    expect(getInitialTheme()).toBe('light')
  })

  it('tells Bootstrap which theme to use', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark')
  })

  it('switches the theme, remembers it and offers the way back', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Dark mode' }))

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Light mode' }))

    expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
