import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { booksApi } from '../entities/book'

export function createStore() {
  const store = configureStore({
    reducer: { [booksApi.reducerPath]: booksApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(booksApi.middleware),
  })
  // lets RTK Query refetch what is on screen when the connection comes back
  setupListeners(store.dispatch)
  return store
}

export const store = createStore()
