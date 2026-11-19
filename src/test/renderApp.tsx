import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { App } from '../app/App'
import { createStore } from '../app/store'

function BrowserChrome() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="url">{location.pathname + location.search}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Browser back
      </button>
    </>
  )
}

export function renderApp(initialUrl = '/') {
  const user = userEvent.setup()
  const store = createStore()
  render(
    <StrictMode>
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialUrl]}>
          <App />
          <BrowserChrome />
        </MemoryRouter>
      </Provider>
    </StrictMode>,
  )
  return { user }
}
