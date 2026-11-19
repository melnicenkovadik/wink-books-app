export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Bootstrap 5.3 switches its colours by this attribute
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-bs-theme', theme)
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
}
