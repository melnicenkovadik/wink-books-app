import type { VolumeDto } from '../entities/book/types'

export function makeVolume(id: string, overrides: VolumeDto['volumeInfo'] = {}): VolumeDto {
  return {
    id,
    volumeInfo: {
      title: `Book ${id}`,
      authors: ['Jane Doe'],
      publishedDate: '2004-05-01',
      description: `Description of ${id}`,
      imageLinks: { thumbnail: `http://books.google.com/covers/${id}.jpg` },
      infoLink: `http://books.google.com/books?id=${id}`,
      ...overrides,
    },
  }
}

export function makeResponse(prefix: string, count: number, totalItems = 100) {
  return {
    kind: 'books#volumes',
    totalItems,
    items: Array.from({ length: count }, (_, index) => makeVolume(`${prefix}-${index + 1}`)),
  }
}

// real response for a request without an api key
export const dailyQuotaError = {
  error: {
    code: 429,
    message:
      "Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service 'books.googleapis.com' for consumer 'project_number:624717413613'.",
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
        reason: 'RATE_LIMIT_EXCEEDED',
        metadata: { quota_limit: 'defaultPerDayPerProject', quota_limit_value: '0' },
      },
    ],
  },
}
