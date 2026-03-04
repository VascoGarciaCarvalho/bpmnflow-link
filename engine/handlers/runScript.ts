import type { HandlerInput } from '../types.js'

export default async function runScript({ config, context }: HandlerInput): Promise<unknown> {
  const { code } = config as { code?: string }
  if (!code) throw new Error('RunScript: missing "code" in config')
  const fn = new Function('ctx', `"use strict";\n${code}`)
  const result = await Promise.resolve(fn(context))
  return result ?? null
}
