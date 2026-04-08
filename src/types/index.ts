export type Priority = 'low' | 'normal' | 'high';
export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  user_id: string;
  position: number;
  created_at: string;
  labels?: Label[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
}

export const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#6b7280' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review', label: 'In Review', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#6b7280' },
  normal: { label: 'Normal', color: '#3b82f6' },
  high: { label: 'High', color: '#ef4444' },
};

export const LABEL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
