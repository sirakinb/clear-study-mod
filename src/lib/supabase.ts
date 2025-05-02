import { createClient } from '@supabase/supabase-js';
// Use a different name to avoid conflict
import type { Database as DatabaseTypes } from './database.types';

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Initializing Supabase client with:', {
  url: supabaseUrl ? 'URL present' : 'URL missing',
  key: supabaseKey ? 'KEY present' : 'KEY missing'
});

// Even if we're missing environment variables, create the client anyway
// to avoid crashes. Operations will fail gracefully later.
export const supabase = createClient<DatabaseTypes>(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);

// Test user ID for development
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

// Helper function to get the current user or fall back to the test user
export const getCurrentUserId = async (): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user.id;
    }
    console.warn('No active session, using test user');
    return TEST_USER_ID;
  } catch (error) {
    console.warn('Auth error, using test user:', error);
    return TEST_USER_ID;
  }
};

// Type definitions for our database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          due_time: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          duration: number
          task_type: 'one-time' | 'multi-day'
          status: 'pending' | 'completed'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          duration: number
          task_type: 'one-time' | 'multi-day'
          status?: 'pending' | 'completed'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          duration?: number
          task_type?: 'one-time' | 'multi-day'
          status?: 'pending' | 'completed'
          user_id?: string
          updated_at?: string
        }
      }
      focus_sessions: {
        Row: {
          id: string
          task_id: string
          start_time: string
          end_time: string
          completed: boolean
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          start_time: string
          end_time: string
          completed?: boolean
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          start_time?: string
          end_time?: string
          completed?: boolean
          user_id?: string
        }
      }
      unavailable_times: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          label?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string
          is_favorite: boolean
          folder_id: string | null
          recording_id: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          is_favorite?: boolean
          folder_id?: string | null
          recording_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          is_favorite?: boolean
          folder_id?: string | null
          recording_id?: string | null
          user_id?: string
          updated_at?: string
        }
      }
      recordings: {
        Row: {
          id: string
          title: string
          transcript: string
          folder_id: string | null
          summary: string | null
          keywords: string[] | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          transcript: string
          folder_id?: string | null
          summary?: string | null
          keywords?: string[] | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          transcript?: string
          folder_id?: string | null
          summary?: string | null
          keywords?: string[] | null
          user_id?: string
          updated_at?: string
        }
      }
    }
  }
} 