import type { Book } from '../../entities/book'

export function BookFacts({ book }: { book: Book }) {
  const facts = [
    ['Publisher', book.publisher],
    ['Published', book.publishedDate],
    ['Pages', book.pageCount],
    ['Categories', book.categories.join(', ')],
    ['Language', book.language?.toUpperCase()],
    ['Rating', book.averageRating ? `${book.averageRating} / 5` : undefined],
  ].filter(([, value]) => Boolean(value))

  if (facts.length === 0) return null

  return (
    <dl className="book-facts">
      {facts.map(([label, value]) => (
        <div key={label} className="book-fact">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
