// ============================================================
// FlowBoard — Supabase client + typed query helpers
// src/lib/supabase.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Task, Label, Comment, ActivityLog, TeamMember } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth ────────────────────────────────────────────────────

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ── Tasks ───────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      labels:task_labels(label:labels(*))
    `)
    .order('position', { ascending: true });

  if (error) throw error;

  // Flatten nested label join
  return (data ?? []).map((t: any) => ({
    ...t,
    labels: (t.labels ?? []).map((tl: any) => tl.label).filter(Boolean),
  }));
}

export async function createTask(
  task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'labels'>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function updateTaskPositions(
  updates: Array<{ id: string; position: number; status: string }>
): Promise<void> {
  // Batch update via upsert
  const { error } = await supabase.from('tasks').upsert(
    updates.map(({ id, position, status }) => ({ id, position, status })),
    { onConflict: 'id' }
  );
  if (error) throw error;
}

// ── Labels ──────────────────────────────────────────────────

export async function fetchLabels(): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createLabel(
  label: Omit<Label, 'id' | 'user_id'>
): Promise<Label> {
  const { data, error } = await supabase
    .from('labels')
    .insert(label)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('labels').delete().eq('id', id);
  if (error) throw error;
}

export async function addLabelToTask(
  taskId: string,
  labelId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId });
  if (error) throw error;
}

export async function removeLabelFromTask(
  taskId: string,
  labelId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);
  if (error) throw error;
}

// ── Comments ────────────────────────────────────────────────

export async function fetchComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createComment(
  comment: Omit<Comment, 'id' | 'user_id' | 'created_at'>
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Activity Log ────────────────────────────────────────────

export async function fetchActivity(taskId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function logActivity(
  entry: Omit<ActivityLog, 'id' | 'user_id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert(entry);
  if (error) throw error;
}

// ── Team Members ────────────────────────────────────────────

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('display_name');
  if (error) throw error;
  return data ?? [];
}

export async function createTeamMember(
  member: Omit<TeamMember, 'id' | 'user_id' | 'created_at'>
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert(member)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTaskAssignees(taskId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('task_assignees')
    .select('member:team_members(*)')
    .eq('task_id', taskId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.member).filter(Boolean);
}

export async function assignMember(
  taskId: string,
  memberId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_assignees')
    .insert({ task_id: taskId, member_id: memberId });
  if (error) throw error;
}

export async function unassignMember(
  taskId: string,
  memberId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('member_id', memberId);
  if (error) throw error;
}

// ── Realtime ────────────────────────────────────────────────

export function subscribeToTasks(
  callback: (payload: { eventType: string; new: Task; old: Task }) => void
) {
  return supabase
    .channel('tasks-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload: any) => callback(payload)
    )
    .subscribe();
}
