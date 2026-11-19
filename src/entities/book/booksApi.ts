import { createApi } from '@reduxjs/toolkit/query/react'
import { GOOGLE_BOOKS_API_KEY } from '../../shared/config'
import { baseQueryWithRetry } from './baseQuery'
import { mapVolume } from './mapVolume'
import type { Book, SearchBooksArgs, SearchBooksResult, VolumeDto, VolumesResponse } from './types'

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: baseQueryWithRetry,
  keepUnusedDataFor: 300,
  endpoints: (build) => ({
    searchBooks: build.query<SearchBooksResult, SearchBooksArgs>({
      query: ({ q, page, limit }) => ({
        url: '/volumes',
        params: {
          q,
          startIndex: (page - 1) * limit,
          maxResults: limit,
          printType: 'books',
          key: GOOGLE_BOOKS_API_KEY,
        },
      }),
      transformResponse: (response: VolumesResponse) => ({
        totalItems: response.totalItems,
        books: (response.items ?? []).map(mapVolume),
      }),
    }),
    getBookById: build.query<Book, string>({
      query: (id) => ({
        url: `/volumes/${encodeURIComponent(id)}`,
        params: { key: GOOGLE_BOOKS_API_KEY },
      }),
      transformResponse: (response: VolumeDto) => mapVolume(response),
    }),
  }),
})

export const { useLazySearchBooksQuery, useGetBookByIdQuery } = booksApi
