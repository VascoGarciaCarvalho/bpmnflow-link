export class ExecutionContext {
  private vars: Record<string, unknown> = {}

  set(key: string, value: unknown): void {
    this.vars[key] = value
  }

  get(key: string): unknown {
    return this.vars[key]
  }

  all(): Record<string, unknown> {
    return { ...this.vars }
  }
}
