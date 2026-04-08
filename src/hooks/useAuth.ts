import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        // Create anonymous session
        supabase.auth.signInAnonymously().then(({ data, error }) => {
          if (error) {
            setError(error.message);
          } else {
            setUser(data.user);
          }
          setLoading(false);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, error };
}
