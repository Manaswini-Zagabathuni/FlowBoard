import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, PRIORITY_CONFIG } from '../../types';
import { isAfter, isBefore, addDays, startOfDay, format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  columnColor: string;
}

export function TaskCard({ task, onClick, columnColor }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    '--col-accent': columnColor,
  } as React.CSSProperties;

  const priorityCfg = PRIORITY_CONFIG[task.priority];

  let dueClass = '';
  let dueLabel = '';
  if (task.due_date) {
    const today = startOfDay(new Date());
    const due = new Date(task.due_date);
    if (isAfter(today, due)) {
      dueClass = 'overdue';
      dueLabel = 'Overdue';
    } else if (isBefore(due, addDays(today, 3))) {
      dueClass = 'soon';
      dueLabel = format(due, 'MMM d');
    } else {
      dueLabel = format(due, 'MMM d');
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      <div className="task-card-top">
        <span className="task-card-title">{task.title}</span>
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="task-card-labels">
          {task.labels.map(l => (
            <span key={l.id} className="label-chip" style={{ background: l.color + 'cc' }}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="task-card-footer">
        <span className="priority-badge" style={{ color: priorityCfg.color }}>
          {priorityCfg.label}
        </span>
        {task.due_date && (
          <span className={`due-badge ${dueClass}`}>
            <Calendar size={10} />
            {dueClass === 'overdue' ? dueLabel : dueLabel}
          </span>
        )}
      </div>
    </div>
  );
}
