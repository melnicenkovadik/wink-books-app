export type PageItem = number | 'ellipsis'

export function getPageCount(totalItems: number, limit: number) {
  return Math.ceil(totalItems / limit)
}

// e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 120]
export function getPageItems(page: number, pageCount: number): PageItem[] {
  const pages = [1, page - 1, page, page + 1, pageCount].filter((p) => p >= 1 && p <= pageCount)
  const unique = [...new Set(pages)].sort((a, b) => a - b)

  const items: PageItem[] = []
  for (const current of unique) {
    const previous = items.at(-1)
    if (typeof previous === 'number' && current - previous > 1) items.push('ellipsis')
    items.push(current)
  }
  return items
}
