import { createApi } from '@reduxjs/toolkit/query/react'
import { GOOGLE_BOOKS_API_KEY } from '../../shared/config'
import { baseQueryWithRetry } from './baseQuery'
import { mapVolume } from './mapVolume'
import type { Book, SearchBooksArgs, SearchBooksResult, VolumeDto, VolumesResponse } from './types'

// the list needs only these, the response gets about three times smaller
const SEARCH_FIELDS =
  'totalItems,items(id,volumeInfo(title,authors,publishedDate,description,imageLinks/thumbnail))'

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: baseQueryWithRetry,
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    searchBooks: build.query<SearchBooksResult, SearchBooksArgs>({
      query: ({ q, page, limit }) => ({
        url: '/volumes',
        params: {
          q,
          startIndex: (page - 1) * limit,
          maxResults: limit,
          printType: 'books',
          fields: SEARCH_FIELDS,
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
