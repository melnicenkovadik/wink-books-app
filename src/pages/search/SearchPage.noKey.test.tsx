import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { stubFetch } from '../../test/fetchStub'
import { renderApp } from '../../test/renderApp'

vi.mock('../../shared/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/config')>()),
  GOOGLE_BOOKS_API_KEY: '',
}))

it('explains that the API key is missing instead of calling the API', async () => {
  const calls = stubFetch()
  renderApp('/?q=harry')

  expect(await screen.findByText('API key is not configured.')).toBeInTheDocument()
  expect(calls).toHaveLength(0)
})
