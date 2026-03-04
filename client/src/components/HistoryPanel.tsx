import { useState, useEffect, useCallback } from 'react'
import type { HistoryRun, HistoryRunDetail } from '../types'

interface Props {
  refreshKey: number
}

export default function HistoryPanel({ refreshKey }: Props) {
  const [runs, setRuns] = useState<HistoryRun[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [detail, setDetail] = useState<HistoryRunDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      setRuns(data)
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns, refreshKey])

  async function toggleRow(id: number) {
    if (expanded === id) {
      setExpanded(null)
      setDetail(null)
      return
    }
    setExpanded(id)
    setLoading(true)
    try {
      const res = await fetch(`/api/history/${id}`)
      const data = await res.json()
      setDetail(data)
    } catch {
      setDetail(null)
    }
    setLoading(false)
  }

  if (runs.length === 0) {
    return (
      <div className="execution-panel">
        <div className="panel-section-header">Execution History</div>
        <div className="empty-state">No runs yet — execute a process first</div>
      </div>
    )
  }

  return (
    <div className="execution-panel">
      <div className="panel-section-header">Execution History</div>
      <div className="history-list execution-results">
        {runs.map(run => (
          <div key={run.id} className="history-item" onClick={() => toggleRow(run.id)}>
            <div className="history-item-meta">
              <span className={`result-icon ${run.hadErrors ? 'error' : 'ok'}`} style={{ display: 'inline-flex' }}>
                {run.hadErrors ? '✗' : '✓'}
              </span>
              <span className="result-name" style={{ flex: 1 }}>{run.processName}</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{run.durationMs}ms</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{run.taskCount} tasks</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#4b5563', paddingLeft: '24px' }}>
              {new Date(run.timestamp).toLocaleString()}
            </div>

            {expanded === run.id && (
              <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
                {loading ? (
                  <div style={{ color: '#6b7280', fontSize: '0.8rem', padding: '4px 0' }}>Loading…</div>
                ) : detail ? (
                  detail.results.map((r, i) => (
                    <div key={i} className="result-row" style={{ marginLeft: -14, marginRight: -14 }}>
                      <div className="result-header">
                        <span className={`result-icon ${r.error ? 'error' : 'ok'}`}>{r.error ? '✗' : '✓'}</span>
                        <span className="result-name">{r.name}</span>
                      </div>
                      {r.error ? (
                        <div className="result-error">{r.error}</div>
                      ) : (
                        <pre className="result-output">{JSON.stringify(r.output, null, 2)}</pre>
                      )}
                    </div>
                  ))
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
