import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Task, Status, Priority, Label } from '../types';

export function useTasks(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`*, task_labels(label_id, labels(*))`)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      // Flatten labels
      const normalized = (data || []).map((t: any) => ({
        ...t,
        labels: t.task_labels?.map((tl: any) => tl.labels).filter(Boolean) ?? [],
      }));
      setTasks(normalized);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTasks]);

  const createTask = async (data: {
    title: string;
    description?: string;
    priority: Priority;
    due_date?: string;
    status: Status;
    labelIds?: string[];
  }) => {
    if (!user) return;
    const maxPos = tasks.filter(t => t.status === data.status).length;
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        due_date: data.due_date || null,
        status: data.status,
        user_id: user.id,
        position: maxPos,
      })
      .select()
      .single();

    if (error) { setError(error.message); return; }

    // Assign labels
    if (data.labelIds?.length && task) {
      await supabase.from('task_labels').insert(
        data.labelIds.map(lid => ({ task_id: task.id, label_id: lid }))
      );
    }

    await fetchTasks();
    return task;
  };

  const updateTask = async (id: string, updates: Partial<Task> & { labelIds?: string[] }) => {
    if (!user) return;
    const { labelIds, labels: _labels, ...rest } = updates;
    const { error } = await supabase.from('tasks').update(rest).eq('id', id).eq('user_id', user.id);
    if (error) { setError(error.message); return; }

    if (labelIds !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', id);
      if (labelIds.length) {
        await supabase.from('task_labels').insert(labelIds.map(lid => ({ task_id: id, label_id: lid })));
      }
    }

    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
    if (error) setError(error.message);
    else setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTask = async (taskId: string, newStatus: Status, newPosition: number) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      setError(error.message);
      fetchTasks();
      return;
    }

    // Log activity if status changed
    if (oldStatus !== newStatus) {
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'status_changed',
        from_value: oldStatus,
        to_value: newStatus,
      });
    }
  };

  const logActivity = async (taskId: string, action: string, from?: string, to?: string) => {
    if (!user) return;
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: user.id,
      action,
      from_value: from || null,
      to_value: to || null,
    });
  };

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask, logActivity, refetch: fetchTasks };
}
