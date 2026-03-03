export interface HandlerInput {
  taskId: string
  name: string
  config: Record<string, unknown>
  context: Record<string, unknown>
}

export type Handler = (input: HandlerInput) => Promise<unknown>

export interface TaskResult {
  taskId: string
  name: string
  output: unknown
  error: string | null
}

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
