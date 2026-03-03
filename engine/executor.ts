import { parseXML } from './parser.js'
import handlers from './handlers/index.js'
import { ExecutionContext } from './context.js'
import { interpolate } from './interpolate.js'
import type { TaskResult, ExecutionEvent } from './types.js'

function getDocConfig(element: any): Record<string, unknown> {
  if (!element.documentation || element.documentation.length === 0) return {}
  try {
    return JSON.parse(element.documentation[0].text)
  } catch {
    return {}
  }
}

export async function execute(
  xmlString: string,
  emit?: (event: ExecutionEvent) => void
): Promise<TaskResult[]> {
  const { flowElements } = await parseXML(xmlString)

  const startEvent = flowElements.find((el: any) => el.$type === 'bpmn:StartEvent')
  if (!startEvent) throw new Error('No StartEvent found in process')

  const results: TaskResult[] = []
  const context = new ExecutionContext()
  let current: any = startEvent

  while (current) {
    const type: string = current.$type

    if (type === 'bpmn:EndEvent') {
      emit?.({ type: 'process-done', elementId: current.id, name: current.name })
      break
    }

    if (type === 'bpmn:ExclusiveGateway') {
      const defaultId: string | undefined = current.default?.id
      const taken = current.outgoing.find((flow: any) => {
        if (flow.id === defaultId) return false
        const cond: string | undefined = flow.conditionExpression?.body?.trim()
        if (!cond) return true
        try {
          return new Function('ctx', `return !!(${cond})`)(context.all())
        } catch {
          return false
        }
      }) ?? current.outgoing.find((f: any) => f.id === defaultId)

      emit?.({
        type: 'gateway-decision',
        elementId: current.id,
        name: current.name,
        chosenFlowId: taken?.id,
      })

      current = taken?.targetRef ?? null
      continue
    }

    if (type === 'bpmn:ServiceTask') {
      const taskName: string = current.name
      const handler = (handlers as Record<string, any>)[taskName]
      const rawConfig = getDocConfig(current)
      const resolvedConfig = interpolate(rawConfig, context.all())
      let output: unknown = null
      let error: string | null = null

      emit?.({ type: 'task-start', elementId: current.id, name: taskName })

      if (!handler) {
        error = `No handler registered for task name "${taskName}"`
        emit?.({ type: 'task-end', elementId: current.id, name: taskName, error: error ?? undefined })
      } else {
        try {
          output = await handler({
            taskId: current.id,
            name: taskName,
            config: resolvedConfig,
            context: context.all(),
          })
          context.set(current.id, output)
          emit?.({ type: 'task-end', elementId: current.id, name: taskName, output })
        } catch (e: any) {
          error = e.message
          emit?.({ type: 'task-end', elementId: current.id, name: taskName, error: error ?? undefined })
        }
      }

      results.push({ taskId: current.id, name: taskName, output, error })
    }

    if (!current.outgoing || current.outgoing.length === 0) break
    current = current.outgoing[0].targetRef
  }

  return results
}
