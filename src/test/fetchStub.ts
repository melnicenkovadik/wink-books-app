import { vi } from 'vitest'

export type FetchCall = {
  url: URL
  signal: AbortSignal
  respond: (body: unknown, status?: number) => void
  fail: () => void
}

type Reply = { body: unknown; status?: number }

// without autoReply the test has to call respond()/fail() itself
export function stubFetch(autoReply?: (url: URL) => Reply) {
  const calls: FetchCall[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn((request: Request) => {
      return new Promise<Response>((resolve, reject) => {
        const respond = (body: unknown, status = 200) =>
          resolve(
            new Response(JSON.stringify(body), {
              status,
              headers: { 'Content-Type': 'application/json' },
            }),
          )
        const url = new URL(request.url)

        request.signal.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        )
        calls.push({
          url,
          signal: request.signal,
          respond,
          fail: () => reject(new TypeError('Failed to fetch')),
        })

        if (autoReply) {
          const reply = autoReply(url)
          respond(reply.body, reply.status)
        }
      })
    }),
  )

  return calls
}
