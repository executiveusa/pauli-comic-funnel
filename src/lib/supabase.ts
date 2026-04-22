import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';

// Supabase client initialization - validate required env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Re-export Supabase auth types for use in app
export type { User, Session } from '@supabase/supabase-js';

// Authentication functions
export async function signInWithPassword(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user ?? null, session: data.session ?? null, error };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { user: data.user ?? null, session: data.session ?? null, error };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function isTeamMember(userId: string): Promise<boolean> {
  try {
    // Check if user exists in team table (customize based on your schema)
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error: error as Error };
  }
}
