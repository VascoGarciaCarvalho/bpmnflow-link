import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import { fileURLToPath } from 'url'
import type { HandlerInput } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data.db')

export default async function updateDatabase({ config }: HandlerInput) {
  const { table, set, where } = config as {
    table?: string
    set?: Record<string, string>
    where?: Record<string, string>
  }

  if (!table || !set || !where) {
    throw new Error('UpdateDatabase: config must include "table", "set", and "where"')
  }

  const db = new DatabaseSync(DB_PATH)

  const setCols = Object.keys(set)
  const whereCols = Object.keys(where)
  const allCols = [...new Set([...whereCols, ...setCols])]

  const colDefs = allCols.map(c => `"${c}" TEXT`).join(', ')
  db.exec(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs})`)

  const whereClause = whereCols.map(c => `"${c}" = ?`).join(' AND ')
  const whereValues = whereCols.map(c => String(where[c]))
  const existsStmt = db.prepare(`SELECT 1 FROM "${table}" WHERE ${whereClause}`)
  const exists = existsStmt.get(...whereValues)

  if (!exists) {
    const insertCols = allCols.map(c => `"${c}"`).join(', ')
    const insertVals = allCols.map(c => {
      const v = set[c] ?? where[c] ?? null
      return v !== null ? String(v) : null
    })
    const placeholders = allCols.map(() => '?').join(', ')
    db.prepare(`INSERT INTO "${table}" (${insertCols}) VALUES (${placeholders})`).run(...insertVals)
  }

  const setClause = setCols.map(c => `"${c}" = ?`).join(', ')
  const setValues = setCols.map(c => String(set[c]))
  const result = db
    .prepare(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`)
    .run(...setValues, ...whereValues)

  db.close()
  return { changes: result.changes, table, set, where }
}
