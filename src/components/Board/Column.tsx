import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, Status } from '../../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  id: Status;
  label: string;
  color: string;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}

const EMPTY_STATES: Record<Status, { icon: string; text: string }> = {
  todo: { icon: '📋', text: 'No tasks yet.\nClick + to add one.' },
  in_progress: { icon: '⚡', text: 'Nothing in progress.\nDrag tasks here to start.' },
  in_review: { icon: '🔍', text: 'Nothing to review.\nDrag tasks here when ready.' },
  done: { icon: '✅', text: 'No completed tasks yet.\nKeep going!' },
};

export function Column({ id, label, color, tasks, onAddTask, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', status: id } });
  const taskIds = tasks.map(t => t.id);
  const empty = EMPTY_STATES[id];

  return (
    <div className={`column ${isOver ? 'drag-over' : ''}`}>
      <div className="column-header">
        <span className="column-dot" style={{ background: color }} />
        <span className="column-title">{label}</span>
        <span className="column-count">{tasks.length}</span>
        <button className="column-add-btn" onClick={onAddTask} title="Add task">
          <Plus size={14} />
        </button>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="column-body" ref={setNodeRef}>
          {tasks.length === 0 ? (
            <div className="column-empty">
              <div className="column-empty-icon">{empty.icon}</div>
              <p>{empty.text}</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                columnColor={color}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
