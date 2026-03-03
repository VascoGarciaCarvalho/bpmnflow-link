import type { HandlerInput } from '../types.js'

export default async function callAPI({ config }: HandlerInput) {
  const { url, method = 'GET', headers = {}, body } = config as {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: unknown
  }

  if (!url) throw new Error('CallAPI: missing "url" in documentation config')

  const options: RequestInit = { method, headers }
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body)
    if (!(headers as Record<string, string>)['Content-Type']) {
      (options.headers as Record<string, string>)['Content-Type'] = 'application/json'
    }
  }

  const response = await fetch(url, options)
  const text = await response.text()

  let responseBody: unknown
  try {
    responseBody = JSON.parse(text)
  } catch {
    responseBody = text
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body: responseBody,
  }
}
