import type { SyntheticEvent } from 'react'
import { PLACEHOLDER_COVER_URL } from './mapVolume'

type Props = {
  src: string
  title: string
  className?: string
}

export function BookCover({ src, title, className = '' }: Props) {
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    if (img.src !== PLACEHOLDER_COVER_URL) img.src = PLACEHOLDER_COVER_URL
  }

  return (
    <img
      className={`book-cover ${className}`}
      src={src}
      alt={`Cover of ${title}`}
      loading="lazy"
      onError={handleError}
    />
  )
}
