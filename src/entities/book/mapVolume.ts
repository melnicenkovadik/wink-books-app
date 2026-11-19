import type { Book, VolumeDto } from './types'

export const PLACEHOLDER_COVER_URL = 'https://placehold.co/400x600/FF5039/FFF?text=Book+Cover'

const toHttps = (url: string | undefined) => url?.replace(/^http:\/\//, 'https://')

// Google returns descriptions as HTML. We only ever render them as text.
export function htmlToText(html: string | undefined): string {
  if (!html) return ''
  const withBreaks = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n')
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html')
  doc.querySelectorAll('script, style').forEach((node) => node.remove())
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim()
}

export function mapVolume(volume: VolumeDto): Book {
  const info = volume.volumeInfo ?? {}
  const images = info.imageLinks ?? {}
  const isbn = info.industryIdentifiers?.find((item) => item.type.startsWith('ISBN'))?.identifier
  const infoLink = toHttps(info.infoLink)

  return {
    id: volume.id,
    title: info.title ?? 'Untitled',
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    description: htmlToText(info.description),
    pageCount: info.pageCount,
    categories: info.categories ?? [],
    averageRating: info.averageRating,
    language: info.language,
    coverUrl:
      toHttps(images.medium ?? images.small ?? images.thumbnail ?? images.smallThumbnail) ??
      PLACEHOLDER_COVER_URL,
    infoLink,
    googleBooksUrl:
      infoLink ??
      toHttps(info.canonicalVolumeLink ?? info.previewLink) ??
      (isbn ? `https://books.google.com/books?vid=ISBN${isbn}` : undefined),
  }
}
