// ============================================================
// FlowBoard — KanbanColumn (upgraded)
// src/components/KanbanColumn.tsx
//
// Changes vs original:
//  • Accepts memoised taskList slice (no filtering inside)
//  • useCallback on all handlers
//  • Accessible column header with task count
// ============================================================

import React, { memo, useCallback } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import type { Task, Status, TeamMember } from '../types';

const COLUMN_META: Record<
  Status,
  { label: string; accentClass: string }
> = {
  todo: { label: 'To Do', accentClass: 'col-todo' },
  in_progress: { label: 'In Progress', accentClass: 'col-inprogress' },
  in_review: { label: 'In Review', accentClass: 'col-inreview' },
  done: { label: 'Done', accentClass: 'col-done' },
};

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  assigneeMap: Map<string, TeamMember[]>;
  commentCountMap: Map<string, number>;
  overdueFn: (task: Task) => boolean;
  dueSoonFn: (task: Task) => boolean;
  onAddTask: (status: Status) => void;
  onOpenTask: (task: Task) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  tasks,
  assigneeMap,
  commentCountMap,
  overdueFn,
  dueSoonFn,
  onAddTask,
  onOpenTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status];
  const taskIds = tasks.map((t) => t.id);

  const handleAdd = useCallback(() => onAddTask(status), [onAddTask, status]);

  return (
    <section
      className={`kanban-column ${isOver ? 'column-over' : ''}`}
      aria-label={`${meta.label} column, ${tasks.length} tasks`}
    >
      {/* Column header */}
      <div className={`column-header ${meta.accentClass}`}>
        <span className="column-title">{meta.label}</span>
        <span className="column-count" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
        <button
          className="add-task-btn"
          onClick={handleAdd}
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Sortable task list */}
      <div ref={setNodeRef} className="column-body">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              assignees={assigneeMap.get(task.id)}
              commentCount={commentCountMap.get(task.id)}
              isOverdue={overdueFn(task)}
              isDueSoon={dueSoonFn(task)}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="empty-column" aria-hidden="true">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
});
