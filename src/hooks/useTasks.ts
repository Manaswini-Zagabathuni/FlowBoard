// ============================================================
// FlowBoard — useTasks hook
// src/hooks/useTasks.ts
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task, Status } from '../types';
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPositions,
  subscribeToTasks,
  logActivity,
  supabase,
} from '../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

function isDueSoon(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  const diff = new Date(task.due_date).getTime() - Date.now();
  return diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

// ── Hook ─────────────────────────────────────────────────────

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousTasks = useRef<Task[]>([]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTasks()
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = subscribeToTasks(({ eventType, new: next, old }) => {
      setTasks((prev) => {
        switch (eventType) {
          case 'INSERT':
            return [...prev, next].sort((a, b) => a.position - b.position);
          case 'UPDATE':
            return prev
              .map((t) => (t.id === next.id ? { ...t, ...next } : t))
              .sort((a, b) => a.position - b.position);
          case 'DELETE':
            return prev.filter((t) => t.id !== old.id);
          default:
            return prev;
        }
      });
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Memoised selectors ────────────────────────────────────

  const tasksByStatus = useMemo<Record<Status, Task[]>>(() => {
    const map: Record<Status, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const t of tasks) {
      map[t.status]?.push(t);
    }
    return map;
  }, [tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  // ── Mutations ─────────────────────────────────────────────

  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'labels'>) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: Task = {
        ...task,
        id: tempId,
        user_id: '',
        created_at: new Date().toISOString(),
        labels: [],
      };
      previousTasks.current = tasks;
      setTasks((prev) => [...prev, optimistic]);
      try {
        const saved = await createTask(task);
        setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        return saved;
      } catch (err: any) {
        setTasks(previousTasks.current);
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  const editTask = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>,
      logEntry?: { action: string; from_value?: string | null; to_value?: string | null }
    ) => {
      previousTasks.current = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      try {
        const saved = await updateTask(id, updates);
        if (logEntry) {
          await logActivity({
            task_id: id,
            action: logEntry.action,
            from_value: logEntry.from_value ?? null,
            to_value: logEntry.to_value ?? null,
          });
        }
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...saved } : t))
        );
        return saved;
      } catch (err: any) {
        setTasks(previousTasks.current);
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  const removeTask = useCallback(
    async (id: string) => {
      previousTasks.current = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await deleteTask(id);
      } catch (err: any) {
        setTasks(previousTasks.current);
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  const reorderTasks = useCallback(
    async (updates: Array<{ id: string; position: number; status: string }>) => {
      previousTasks.current = tasks;
      const updatesMap = new Map(updates.map((u) => [u.id, u]));
      setTasks((prev) =>
        prev
          .map((t) => {
            const u = updatesMap.get(t.id);
            return u ? { ...t, position: u.position, status: u.status as Status } : t;
          })
          .sort((a, b) => a.position - b.position)
      );
      try {
        await updateTaskPositions(updates);
      } catch (err: any) {
        setTasks(previousTasks.current);
        setError(err.message);
        throw err;
      }
    },
    [tasks]
  );

  return {
    tasks,
    tasksByStatus,
    stats,
    loading,
    error,
    isOverdue,
    isDueSoon,
    addTask,
    editTask,
    removeTask,
    reorderTasks,
  };
}
