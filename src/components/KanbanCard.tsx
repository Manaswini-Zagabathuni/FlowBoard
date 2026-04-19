// ============================================================
// FlowBoard — KanbanCard (upgraded)
// src/components/KanbanCard.tsx
//
// Changes vs original:
//  • Wrapped in React.memo — only re-renders when task data changes
//  • Assignee avatar row
//  • Completion confetti trigger (done status)
//  • Spring drop animation via CSS
//  • Keyboard: Enter / Space opens detail panel
// ============================================================

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { GripVertical, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import type { Task, Label, TeamMember } from '../types';

// ── Confetti (canvas-confetti lazy import) ───────────────────
async function fireConfetti() {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
    });
  } catch {
    // canvas-confetti not installed — fail silently
  }
}

// ── Priority badge ────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, string> = {
  high: 'priority-high',
  normal: 'priority-normal',
  low: 'priority-low',
};

// ── Avatar helpers ────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({ member }: { member: TeamMember }) {
  return (
    <span
      className="avatar"
      style={{ background: member.avatar_color }}
      title={member.display_name}
      aria-label={member.display_name}
    >
      {initials(member.display_name)}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface KanbanCardProps {
  task: Task;
  assignees?: TeamMember[];
  isOverdue: boolean;
  isDueSoon: boolean;
  commentCount?: number;
  onOpen: (task: Task) => void;
}

// ── Component ─────────────────────────────────────────────────
export const KanbanCard = memo(function KanbanCard({
  task,
  assignees = [],
  isOverdue,
  isDueSoon,
  commentCount = 0,
  onOpen,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const prevStatus = useRef(task.status);

  // Fire confetti exactly once when status changes to "done"
  useEffect(() => {
    if (prevStatus.current !== 'done' && task.status === 'done') {
      fireConfetti();
    }
    prevStatus.current = task.status;
  }, [task.status]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.4 : 1,
  };

  const handleClick = useCallback(() => onOpen(task), [onOpen, task]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(task);
      }
    },
    [onOpen, task]
  );

  const dueDateLabel =
    task.due_date
      ? format(parseISO(task.due_date), 'MMM d')
      : null;

  const dueBadgeClass = isOverdue
    ? 'due-badge due-overdue'
    : isDueSoon
    ? 'due-badge due-soon'
    : 'due-badge';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${task.status === 'done' ? 'card-done' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}. Priority: ${task.priority}. Status: ${task.status}.`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Drag handle */}
      <span
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </span>

      {/* Priority badge */}
      <span className={PRIORITY_STYLES[task.priority] ?? 'priority-normal'}>
        {task.priority}
      </span>

      {/* Title */}
      <p className="card-title">{task.title}</p>

      {/* Labels */}
      {(task.labels ?? []).length > 0 && (
        <div className="label-row">
          {task.labels!.map((label: Label) => (
            <span
              key={label.id}
              className="label-chip"
              style={{ background: label.color + '33', color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="card-footer">
        {/* Due date */}
        {dueDateLabel && (
          <span className={dueBadgeClass}>
            <Calendar size={11} />
            {dueDateLabel}
          </span>
        )}

        {/* Comment count */}
        {commentCount > 0 && (
          <span className="meta-chip">
            <MessageSquare size={11} />
            {commentCount}
          </span>
        )}

        {/* Overdue alert icon */}
        {isOverdue && (
          <span className="overdue-icon" aria-label="Overdue">
            <AlertCircle size={13} />
          </span>
        )}

        {/* Assignee avatars */}
        {assignees.length > 0 && (
          <div className="avatar-row" style={{ marginLeft: 'auto' }}>
            {assignees.slice(0, 3).map((m) => (
              <Avatar key={m.id} member={m} />
            ))}
            {assignees.length > 3 && (
              <span className="avatar avatar-overflow">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
},
// Custom equality — only re-render when the data we actually display changes
(prev, next) =>
  prev.task.id === next.task.id &&
  prev.task.title === next.task.title &&
  prev.task.status === next.task.status &&
  prev.task.priority === next.task.priority &&
  prev.task.due_date === next.task.due_date &&
  prev.task.description === next.task.description &&
  prev.isOverdue === next.isOverdue &&
  prev.isDueSoon === next.isDueSoon &&
  prev.commentCount === next.commentCount &&
  prev.assignees?.length === next.assignees?.length &&
  JSON.stringify(prev.task.labels) === JSON.stringify(next.task.labels)
);
