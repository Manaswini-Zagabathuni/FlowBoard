import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ActivityLog } from '../types';

export function useActivityLog(user: User | null, taskId: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const fetchLogs = useCallback(async () => {
    if (!taskId || !user) return;
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    setLogs(data || []);
  }, [taskId, user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, refetch: fetchLogs };
}
