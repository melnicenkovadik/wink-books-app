import { createElement, type ReactNode } from 'react'

const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li']

// Google sends the description as HTML. Instead of injecting it, we walk the parsed
// tree and rebuild it from React elements: only the tags above survive, attributes never do.
function toReact(node: ChildNode, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const tag = node.nodeName.toLowerCase()
  if (tag === 'script' || tag === 'style') return null

  const children = Array.from(node.childNodes, toReact)
  if (!ALLOWED_TAGS.includes(tag)) return children
  if (tag === 'br') return <br key={key} />
  return createElement(tag, { key }, ...children)
}

export function BookDescription({ html }: { html: string }) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return <div className="book-details-description">{Array.from(doc.body.childNodes, toReact)}</div>
}
