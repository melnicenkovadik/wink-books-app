export type ImageLinks = {
  smallThumbnail?: string
  thumbnail?: string
  small?: string
  medium?: string
}

export type VolumeDto = {
  id: string
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    industryIdentifiers?: { type: string; identifier: string }[]
    pageCount?: number
    categories?: string[]
    averageRating?: number
    imageLinks?: ImageLinks
    language?: string
    previewLink?: string
    infoLink?: string
    canonicalVolumeLink?: string
  }
}

export type VolumesResponse = {
  totalItems: number
  items?: VolumeDto[]
}

export type Book = {
  id: string
  title: string
  subtitle?: string
  authors: string[]
  publisher?: string
  publishedDate?: string
  description: string
  pageCount?: number
  categories: string[]
  averageRating?: number
  language?: string
  coverUrl: string
  infoLink?: string
  googleBooksUrl?: string
}

export type SearchBooksArgs = {
  q: string
  page: number
  limit: number
}

export type SearchBooksResult = {
  totalItems: number
  books: Book[]
}
