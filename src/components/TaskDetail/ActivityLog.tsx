import { ActivityLog as ActivityLogType, Status } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface ActivityLogProps {
  logs: ActivityLogType[];
}

const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

function describeAction(log: ActivityLogType): string {
  if (log.action === 'status_changed') {
    const from = STATUS_LABELS[log.from_value as Status] ?? log.from_value ?? '?';
    const to = STATUS_LABELS[log.to_value as Status] ?? log.to_value ?? '?';
    return `Moved from ${from} → ${to}`;
  }
  if (log.action === 'title_changed') return `Title updated`;
  if (log.action === 'priority_changed') return `Priority changed to ${log.to_value}`;
  if (log.action === 'description_changed') return `Description updated`;
  return log.action.replace(/_/g, ' ');
}

export function ActivityLogPanel({ logs }: ActivityLogProps) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">
        <Activity size={12} /> Activity
      </div>

      {logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity yet.</p>
      ) : (
        <div className="activity-list">
          {logs.map(log => (
            <div key={log.id} className="activity-item">
              <div className="activity-dot" />
              <div className="activity-content">
                <p className="activity-action">{describeAction(log)}</p>
                <p className="activity-time">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
