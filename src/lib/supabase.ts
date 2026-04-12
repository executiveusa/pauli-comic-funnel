import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

// Authentication functions
export async function signInWithPassword(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error: error as Error };
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
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error: error as Error };
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
