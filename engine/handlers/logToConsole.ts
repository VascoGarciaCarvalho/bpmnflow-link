import type { HandlerInput } from '../types.js'

export default async function logToConsole({ taskId, name, config }: HandlerInput) {
  const timestamp = new Date().toISOString()
  const message = (config.message as string) || '(no message)'
  const log = `[${timestamp}] [${taskId}] ${name}: ${message}`
  console.log(log)
  return { status: 'ok', log, timestamp }
}
