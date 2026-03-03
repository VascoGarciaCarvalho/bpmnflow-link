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
