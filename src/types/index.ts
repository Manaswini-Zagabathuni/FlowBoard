// ============================================================
// FlowBoard — Shared Types
// src/types/index.ts
// ============================================================

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

export interface TeamMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
}

export interface TaskAssignee {
  task_id: string;
  member_id: string;
  member?: TeamMember;
}

// Column type for future dynamic columns feature
export interface Column {
  id: string;
  user_id: string;
  title: string;
  position: number;
  color: string | null;
  created_at: string;
}

// Board template type
export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  columns: Array<{ title: string; color: string }>;
  tasks: Array<{
    title: string;
    description: string;
    status: Status;
    priority: Priority;
  }>;
}
