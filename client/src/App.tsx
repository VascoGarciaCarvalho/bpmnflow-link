import { useRef, useState, useEffect, useCallback } from 'react'
import DiagramViewer, { type DiagramViewerHandle } from './components/DiagramViewer'
import TaskList from './components/TaskList'
import ExecutionPanel from './components/ExecutionPanel'
import { useExecutionStream } from './hooks/useExecutionStream'
import type { TaskInfo, ExecutionEvent } from './types'

export default function App() {
  const diagramRef = useRef<DiagramViewerHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [xml, setXml] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskInfo[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const { events, running, start, reset } = useExecutionStream()

  // Handle SSE events → diagram highlights
  useEffect(() => {
    const last = events[events.length - 1]
    if (!last) return

    if (last.type === 'task-start') {
      diagramRef.current?.highlight(last.elementId, 'running')
    } else if (last.type === 'task-end') {
      diagramRef.current?.highlight(last.elementId, last.error ? 'error' : 'ok')
    } else if (last.type === 'gateway-decision') {
      diagramRef.current?.highlight(last.elementId, 'gateway-taken')
    } else if (last.type === 'process-done') {
      diagramRef.current?.highlight(last.elementId, 'ok')
    }
  }, [events])

  const loadXml = useCallback(async (xmlString: string) => {
    setParseError(null)
    reset()
    diagramRef.current?.clearHighlights()

    try {
      await diagramRef.current?.loadXML(xmlString)
    } catch (e: any) {
      setParseError(`Diagram render error: ${e.message}`)
      return
    }

    setXml(xmlString)

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: xmlString }),
      })
      const data = await res.json()
      if (data.tasks) setTasks(data.tasks)
    } catch {
      // parse endpoint failure is non-fatal
    }
  }, [reset])

  // Drag & drop
  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file) return
      const text = await file.text()
      await loadXml(text)
    },
    [loadXml]
  )

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      await loadXml(text)
      e.target.value = ''
    },
    [loadXml]
  )

  const handleExecute = useCallback(async () => {
    if (!xml || running) return
    diagramRef.current?.clearHighlights()
    await start(xml)
  }, [xml, running, start])

  return (
    <div id="root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="app-header">
        <h1>BPMNFlow Link</h1>
        {parseError && (
          <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{parseError}</span>
        )}
      </header>

      <div className="app-body">
        {/* Left — diagram */}
        <div className="diagram-panel">
          <div className="diagram-toolbar">
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Load BPMN
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bpmn,.xml"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <button
              className="btn-primary"
              disabled={!xml || running}
              onClick={handleExecute}
            >
              {running ? 'Running…' : 'Execute'}
            </button>
            {xml && !running && events.length > 0 && (
              <button
                className="btn-secondary"
                onClick={() => {
                  reset()
                  diagramRef.current?.clearHighlights()
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div
            style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
          >
            <DiagramViewer ref={diagramRef} hasXml={Boolean(xml)} />
          </div>
        </div>

        {/* Right — task list + results */}
        <div className="right-panel">
          <TaskList tasks={tasks} />
          <ExecutionPanel events={events} running={running} />
        </div>
      </div>
    </div>
  )
}
