import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation } from 'react-router'
import { App } from '../app/App'
import { createStore } from '../app/store'

function CurrentUrl() {
  const location = useLocation()
  return <output data-testid="url">{location.pathname + location.search}</output>
}

export function renderApp(initialUrl = '/') {
  const user = userEvent.setup()
  const store = createStore()
  render(
    <StrictMode>
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialUrl]}>
          <App />
          <CurrentUrl />
        </MemoryRouter>
      </Provider>
    </StrictMode>,
  )
  return { user }
}
