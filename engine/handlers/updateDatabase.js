import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data.db');

export default async function updateDatabase({ config }) {
  const { table, set, where } = config;
  if (!table || !set || !where) {
    throw new Error('UpdateDatabase: config must include "table", "set", and "where"');
  }

  const db = new DatabaseSync(DB_PATH);

  // Collect all column names
  const setCols   = Object.keys(set);
  const whereCols = Object.keys(where);
  const allCols   = [...new Set([...whereCols, ...setCols])];

  // Create table if it doesn't exist
  const colDefs = allCols.map(c => `"${c}" TEXT`).join(', ');
  db.exec(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs})`);

  // Ensure the target row exists before updating
  const whereClause  = whereCols.map(c => `"${c}" = ?`).join(' AND ');
  const whereValues  = whereCols.map(c => String(where[c]));
  const existsStmt   = db.prepare(`SELECT 1 FROM "${table}" WHERE ${whereClause}`);
  const exists       = existsStmt.get(...whereValues);

  if (!exists) {
    const insertCols = allCols.map(c => `"${c}"`).join(', ');
    const insertVals = allCols.map(c => set[c] ?? where[c] ?? null).map(v => v !== null ? String(v) : null);
    const placeholders = allCols.map(() => '?').join(', ');
    db.prepare(`INSERT INTO "${table}" (${insertCols}) VALUES (${placeholders})`).run(...insertVals);
  }

  // Apply the update
  const setClause  = setCols.map(c => `"${c}" = ?`).join(', ');
  const setValues  = setCols.map(c => String(set[c]));
  const result = db.prepare(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`)
    .run(...setValues, ...whereValues);

  db.close();
  return { changes: result.changes, table, set, where };
}
