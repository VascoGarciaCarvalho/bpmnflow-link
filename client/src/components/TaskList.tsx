import type { TaskInfo } from '../types'

interface Props {
  tasks: TaskInfo[]
}

export default function TaskList({ tasks }: Props) {
  return (
    <div className="panel-section">
      <div className="panel-section-header">Tasks detected</div>
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">No tasks yet</div>
        ) : (
          tasks.map(t => (
            <div key={t.id} className="task-item">
              <span className="task-badge">{t.name}</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t.id}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
