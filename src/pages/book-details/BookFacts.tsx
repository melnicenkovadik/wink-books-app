import { getCategoryLabels, getLanguageName, type Book } from '../../entities/book'

export function BookFacts({ book }: { book: Book }) {
  const facts = [
    ['Publisher', book.publisher],
    ['Published', book.publishedDate],
    ['Pages', book.pageCount],
    ['Language', book.language && getLanguageName(book.language)],
    ['Rating', book.averageRating ? `${book.averageRating} / 5` : undefined],
  ].filter(([, value]) => Boolean(value))
  const categories = getCategoryLabels(book.categories)

  return (
    <>
      {facts.length > 0 && (
        <dl className="book-facts">
          {facts.map(([label, value]) => (
            <div key={label} className="book-fact">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {categories.length > 0 && (
        <ul className="book-categories" aria-label="Categories">
          {categories.map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      )}
    </>
  )
}
