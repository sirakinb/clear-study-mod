export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          duration: number;
          task_type: 'one-time' | 'multi-day';
          status: 'pending' | 'completed';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      focus_sessions: {
        Row: {
          id: string;
          task_id: string;
          start_time: string;
          end_time: string;
          completed: boolean;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['focus_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['focus_sessions']['Insert']>;
      };
      unavailable_times: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          label: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['unavailable_times']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['unavailable_times']['Insert']>;
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_favorite: boolean;
          folder_id: string | null;
          recording_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['notes']['Insert']>;
      };
      recordings: {
        Row: {
          id: string;
          title: string;
          transcript: string;
          folder_id: string | null;
          summary: string | null;
          keywords: string[] | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recordings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['recordings']['Insert']>;
      };
    };
  };
} 