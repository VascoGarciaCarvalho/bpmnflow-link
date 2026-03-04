import express from 'express'
import { parseXML } from './engine/parser.js'
import { execute } from './engine/executor.js'
import { saveRun, listRuns, getRun } from './engine/history.js'
import type { ExecutionEvent, TaskResult } from './engine/types.js'

const app = express()
const PORT = 3000

app.use(express.json({ limit: '5mb' }))

// Serve built client in production, raw public/ in development fallback
app.use(express.static('dist'))
app.use(express.static('public'))

// POST /api/parse — returns list of tasks found in the BPMN
app.post('/api/parse', async (req, res) => {
  const { xml } = req.body
  if (!xml) return res.status(400).json({ error: 'Missing "xml" in request body' })

  try {
    const { flowElements } = await parseXML(xml)
    const tasks = flowElements
      .filter((el: any) => el.$type === 'bpmn:ServiceTask')
      .map((el: any) => ({ id: el.id, name: el.name, type: el.$type }))
    res.json({ tasks })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/execute — runs the full process and returns results per task
app.post('/api/execute', async (req, res) => {
  const { xml, inputVars = {} } = req.body
  if (!xml) return res.status(400).json({ error: 'Missing "xml" in request body' })

  try {
    const startTime = Date.now()
    const { results, processName } = await execute(xml, undefined, inputVars)
    const durationMs = Date.now() - startTime
    saveRun(processName, inputVars, results, durationMs)
    res.json({ results })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/execute-stream — SSE streaming execution
app.post('/api/execute-stream', async (req, res) => {
  const { xml, inputVars = {} } = req.body
  if (!xml) return res.status(400).json({ error: 'Missing xml' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const collectedResults: TaskResult[] = []

  const emit = (event: ExecutionEvent) => {
    if (event.type === 'task-end') {
      collectedResults.push({
        taskId: event.elementId,
        name: event.name ?? event.elementId,
        output: event.output ?? null,
        error: event.error ?? null,
      })
    }
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  const startTime = Date.now()
  try {
    const { processName } = await execute(xml, emit, inputVars)
    const durationMs = Date.now() - startTime
    saveRun(processName, inputVars, collectedResults, durationMs)
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', elementId: '', error: err.message })}\n\n`)
  }

  res.end()
})

// GET /api/history — list all runs
app.get('/api/history', (_req, res) => {
  try {
    res.json(listRuns())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/history/:id — get a single run with full details
app.get('/api/history/:id', (req, res) => {
  try {
    const run = getRun(Number(req.params.id))
    if (!run) return res.status(404).json({ error: 'Run not found' })
    res.json(run)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`BPMNFlow Link running at http://localhost:${PORT}`)
})
