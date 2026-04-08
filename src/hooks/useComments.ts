import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Comment } from '../types';

export function useComments(user: User | null, taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId || !user) return;
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setLoading(false);
  }, [taskId, user]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!user || !taskId) return;
    const { data } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: user.id,
      content,
    }).select().single();
    if (data) setComments(prev => [...prev, data]);
  };

  return { comments, loading, addComment };
}
