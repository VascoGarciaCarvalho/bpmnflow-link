export type ExecutionEventType =
  | 'task-start'
  | 'task-end'
  | 'gateway-decision'
  | 'process-done'
  | 'error'

export interface ExecutionEvent {
  type: ExecutionEventType
  elementId: string
  name?: string
  output?: unknown
  error?: string
  chosenFlowId?: string
}

export interface TaskInfo {
  id: string
  name: string
  type: string
}

export interface HistoryRun {
  id: number
  timestamp: string
  processName: string
  durationMs: number
  taskCount: number
  hadErrors: boolean
}

export interface HistoryRunDetail extends HistoryRun {
  inputVars: Record<string, unknown>
  results: Array<{
    taskId: string
    name: string
    output: unknown
    error: string | null
  }>
}
