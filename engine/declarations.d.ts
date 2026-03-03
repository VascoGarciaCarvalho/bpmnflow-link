declare module 'bpmn-moddle'

declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string)
    exec(sql: string): void
    prepare(sql: string): Statement
    close(): void
  }

  interface Statement {
    get(...params: unknown[]): unknown
    run(...params: unknown[]): { changes: number; lastInsertRowid: number }
    all(...params: unknown[]): unknown[]
  }
}
