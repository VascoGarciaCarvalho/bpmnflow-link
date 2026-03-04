import { DatabaseSync } from 'node:sqlite'
import type { TaskResult } from './types.js'

let db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync('data.db')
    db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        processName TEXT NOT NULL,
        durationMs INTEGER NOT NULL,
        inputVars TEXT NOT NULL,
        results TEXT NOT NULL,
        hadErrors INTEGER NOT NULL
      )
    `)
  }
  return db
}

export function saveRun(
  processName: string,
  inputVars: Record<string, unknown>,
  results: TaskResult[],
  durationMs: number
): void {
  const database = getDb()
  const hadErrors = results.some(r => r.error !== null) ? 1 : 0
  const stmt = database.prepare(
    `INSERT INTO runs (timestamp, processName, durationMs, inputVars, results, hadErrors)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  stmt.run(
    new Date().toISOString(),
    processName,
    durationMs,
    JSON.stringify(inputVars),
    JSON.stringify(results),
    hadErrors
  )
}

export function listRuns(): Array<{
  id: number
  timestamp: string
  processName: string
  durationMs: number
  taskCount: number
  hadErrors: boolean
}> {
  const database = getDb()
  const rows = database.prepare(
    `SELECT id, timestamp, processName, durationMs, results, hadErrors FROM runs ORDER BY id DESC`
  ).all() as any[]
  return rows.map(row => ({
    id: row.id,
    timestamp: row.timestamp,
    processName: row.processName,
    durationMs: row.durationMs,
    taskCount: (JSON.parse(row.results) as TaskResult[]).length,
    hadErrors: row.hadErrors === 1,
  }))
}

export function getRun(id: number): {
  id: number
  timestamp: string
  processName: string
  durationMs: number
  inputVars: Record<string, unknown>
  results: TaskResult[]
  hadErrors: boolean
} | null {
  const database = getDb()
  const row = database.prepare(`SELECT * FROM runs WHERE id = ?`).get(id) as any
  if (!row) return null
  return {
    id: row.id,
    timestamp: row.timestamp,
    processName: row.processName,
    durationMs: row.durationMs,
    inputVars: JSON.parse(row.inputVars),
    results: JSON.parse(row.results),
    hadErrors: row.hadErrors === 1,
  }
}
