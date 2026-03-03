export function interpolate(
  config: Record<string, unknown>,
  ctx: Record<string, unknown>
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(config).replace(
      /\{\{ctx\.([\w.]+)\}\}/g,
      (_, path: string) => {
        const val = path.split('.').reduce(
          (o: unknown, k: string) =>
            o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined,
          ctx
        )
        return val !== undefined ? String(val) : ''
      }
    )
  )
}
