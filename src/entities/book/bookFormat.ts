// Google sends categories as paths: "Fiction / Science Fiction / General".
// The same words repeat in every path, so we show each label once.
export function getCategoryLabels(categories: string[]) {
  const seen = new Set<string>()
  const labels: string[] = []

  for (const part of categories.flatMap((category) => category.split('/'))) {
    const label = part.trim()
    const key = label.toLowerCase()
    if (!label || key === 'general' || seen.has(key)) continue
    seen.add(key)
    labels.push(label)
  }
  return labels
}

// "it" -> "Italian"
export function getLanguageName(code: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}
