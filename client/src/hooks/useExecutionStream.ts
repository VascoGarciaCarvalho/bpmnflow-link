import { useState } from 'react'
import type { ExecutionEvent } from '../types'

export function useExecutionStream() {
  const [events, setEvents] = useState<ExecutionEvent[]>([])
  const [running, setRunning] = useState(false)

  async function start(xml: string) {
    setRunning(true)
    setEvents([])

    const res = await fetch('/api/execute-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml }),
    })

    if (!res.body) {
      setRunning(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''
      for (const chunk of chunks) {
        if (chunk.startsWith('data: ')) {
          try {
            const event: ExecutionEvent = JSON.parse(chunk.slice(6))
            setEvents(prev => [...prev, event])
          } catch {
            // ignore malformed
          }
        }
      }
    }

    setRunning(false)
  }

  function reset() {
    setEvents([])
    setRunning(false)
  }

  return { events, running, start, reset }
}
