import type { ExecutionEvent } from '../types'

interface Props {
  events: ExecutionEvent[]
  running: boolean
}

export default function ExecutionPanel({ events, running }: Props) {
  const visible = events.filter(
    e => e.type === 'task-end' || e.type === 'gateway-decision' || e.type === 'error'
  )

  return (
    <div className="execution-panel">
      <div className="panel-section-header" style={{ background: '#1a1d27' }}>
        Execution results {running && <span style={{ color: '#60a5fa' }}>● live</span>}
      </div>
      <div className="execution-results">
        {visible.length === 0 && !running && (
          <div className="empty-state">No results yet — click Execute</div>
        )}
        {visible.map((evt, i) => {
          if (evt.type === 'gateway-decision') {
            return (
              <div key={i} className="gateway-row">
                <span>⬡</span>
                <span>{evt.name ?? evt.elementId}</span>
                <span style={{ color: '#6b7280' }}>→ {evt.chosenFlowId ?? '(none)'}</span>
              </div>
            )
          }

          if (evt.type === 'error') {
            return (
              <div key={i} className="result-row">
                <div className="result-header">
                  <span className="result-icon error">✗</span>
                  <span className="result-name">{evt.elementId}</span>
                </div>
                <div className="result-error">{evt.error}</div>
              </div>
            )
          }

          // task-end
          const isError = Boolean(evt.error)
          return (
            <div key={i} className="result-row">
              <div className="result-header">
                <span className={`result-icon ${isError ? 'error' : 'ok'}`}>
                  {isError ? '✗' : '✓'}
                </span>
                <span className="result-name">{evt.name ?? evt.elementId}</span>
              </div>
              {isError ? (
                <div className="result-error">{evt.error}</div>
              ) : (
                <pre className="result-output">
                  {JSON.stringify(evt.output, null, 2)}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
