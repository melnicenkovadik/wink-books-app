import { useState } from 'react'
import { applyTheme, getInitialTheme, saveTheme, type Theme } from '../shared/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  const handleClick = () => {
    setTheme(next)
    applyTheme(next)
    saveTheme(next)
  }

  return (
    <button type="button" className="theme-toggle" onClick={handleClick}>
      {next === 'dark' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
