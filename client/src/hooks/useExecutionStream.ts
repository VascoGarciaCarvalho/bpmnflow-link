import { useState } from 'react'
import type { ExecutionEvent } from '../types'

export function useExecutionStream() {
  const [events, setEvents] = useState<ExecutionEvent[]>([])
  const [running, setRunning] = useState(false)

  async function start(xml: string, inputVars: Record<string, unknown> = {}) {
    setRunning(true)
    setEvents([])

    let res: Response
    try {
      res = await fetch('/api/execute-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml, inputVars }),
      })
    } catch (e: any) {
      setEvents([{ type: 'error', elementId: '', error: `Network error: ${e.message}` }])
      setRunning(false)
      return
    }

    if (!res.ok || !res.body) {
      setEvents([{ type: 'error', elementId: '', error: `Server error: ${res.status} ${res.statusText}` }])
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
