import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Label } from '../types';

export function useLabels(user: User | null) {
  const [labels, setLabels] = useState<Label[]>([]);

  const fetchLabels = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('labels').select('*').eq('user_id', user.id);
    setLabels(data || []);
  }, [user]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const createLabel = async (name: string, color: string) => {
    if (!user) return;
    const { data } = await supabase.from('labels').insert({ name, color, user_id: user.id }).select().single();
    if (data) setLabels(prev => [...prev, data]);
    return data;
  };

  const deleteLabel = async (id: string) => {
    if (!user) return;
    await supabase.from('labels').delete().eq('id', id).eq('user_id', user.id);
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  return { labels, createLabel, deleteLabel, refetch: fetchLabels };
}
