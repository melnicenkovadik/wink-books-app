import { configureStore } from '@reduxjs/toolkit'
import { booksApi } from '../entities/book'

export function createStore() {
  return configureStore({
    reducer: { [booksApi.reducerPath]: booksApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(booksApi.middleware),
  })
}

export const store = createStore()
