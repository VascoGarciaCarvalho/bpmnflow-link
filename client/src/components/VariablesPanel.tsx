import { useState, useRef, forwardRef, useImperativeHandle } from 'react'

export interface VariablesPanelHandle {
  getVars: () => Record<string, unknown>
}

interface Props {
  onChange: (vars: Record<string, unknown>) => void
}

const VariablesPanel = forwardRef<VariablesPanelHandle, Props>(({ onChange }, ref) => {
  const [text, setText] = useState('{\n  \n}')
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const textRef = useRef(text)

  useImperativeHandle(ref, () => ({
    getVars() {
      try {
        return JSON.parse(textRef.current)
      } catch {
        return {}
      }
    }
  }))

  function handleChange(value: string) {
    setText(value)
    textRef.current = value
    try {
      const parsed = JSON.parse(value)
      setError(null)
      onChange(parsed)
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message)
    }
  }

  return (
    <div className="panel-section">
      <div
        className="panel-section-header"
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span>Input Variables</span>
        <span style={{ color: '#4b5563' }}>{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
        <div style={{ padding: '8px 14px' }}>
          <textarea
            className="variables-textarea"
            value={text}
            onChange={e => handleChange(e.target.value)}
            placeholder={'{\n  "myVar": "value"\n}'}
            spellCheck={false}
          />
          {error && <div className="variables-error">{error}</div>}
        </div>
      )}
    </div>
  )
})

export default VariablesPanel
