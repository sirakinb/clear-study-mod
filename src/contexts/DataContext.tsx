import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, TEST_USER_ID, getCurrentUserId } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { toast } from 'sonner';

type Tables = Database['public']['Tables'];
type Task = Tables['tasks']['Row'];
type Note = Tables['notes']['Row'];
type Recording = Tables['recordings']['Row'];
type FocusSession = Tables['focus_sessions']['Row'];
type UnavailableTime = Tables['unavailable_times']['Row'];

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DataContextType {
  tasks: Task[];
  notes: Note[];
  recordings: Recording[];
  focusSessions: FocusSession[];
  unavailableTimes: UnavailableTime[];
  folders: Folder[];
  isLoading: boolean;
  error: Error | null;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  
  // Note operations
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Note>;
  updateNote: (id: string, note: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  
  // Recording operations
  addRecording: (recording: Omit<Recording, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Recording>;
  updateRecording: (id: string, recording: Partial<Recording>) => Promise<Recording>;
  deleteRecording: (id: string) => Promise<void>;
  
  // Focus session operations
  addFocusSession: (session: Omit<FocusSession, 'id' | 'created_at' | 'user_id'>) => Promise<FocusSession>;
  updateFocusSession: (id: string, session: Partial<FocusSession>) => Promise<FocusSession>;
  deleteFocusSession: (id: string) => Promise<void>;
  
  // Unavailable time operations
  addUnavailableTime: (time: Omit<UnavailableTime, 'id' | 'created_at' | 'user_id'>) => Promise<UnavailableTime>;
  updateUnavailableTime: (id: string, time: Partial<UnavailableTime>) => Promise<UnavailableTime>;
  deleteUnavailableTime: (id: string) => Promise<void>;
  
  // Folder operations
  addFolder: (folder: Omit<Folder, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Folder>;
  updateFolder: (id: string, folder: Partial<Folder>) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<UnavailableTime[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get user ID with fallback to test user
        const userId = await getCurrentUserId();
        
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
        
        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId);
        if (notesError) throw notesError;
        setNotes(notesData || []);
        
        // Fetch recordings
        const { data: recordingsData, error: recordingsError } = await supabase
          .from('recordings')
          .select('*')
          .eq('user_id', userId);
        if (recordingsError) throw recordingsError;
        setRecordings(recordingsData || []);
        
        // Fetch focus sessions
        const { data: focusSessionsData, error: focusSessionsError } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', userId);
        if (focusSessionsError) throw focusSessionsError;
        setFocusSessions(focusSessionsData || []);
        
        // Fetch unavailable times
        const { data: unavailableTimesData, error: unavailableTimesError } = await supabase
          .from('unavailable_times')
          .select('*')
          .eq('user_id', userId);
        if (unavailableTimesError) throw unavailableTimesError;
        setUnavailableTimes(unavailableTimesData || []);
        
        // Fetch folders
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId);
        if (foldersError) throw foldersError;
        setFolders(foldersData || []);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        
        // Set empty arrays as fallback
        setTasks([]);
        setNotes([]);
        setRecordings([]);
        setFocusSessions([]);
        setUnavailableTimes([]);
        setFolders([]);
      }
    };
    
    loadData();
    
    // Set up real-time subscriptions for tasks
    const tasksSubscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        console.log('Tasks change received:', payload);
        // Update local state based on the change
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new as Task]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? { ...task, ...payload.new } : task
          ));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        }
      })
      .subscribe();

    // Set up real-time subscriptions for folders
    const foldersSubscription = supabase
      .channel('public:folders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'folders'
      }, (payload) => {
        console.log('Folders change received:', payload);
        // Update local state based on the change
        if (payload.eventType === 'INSERT') {
          setFolders(prev => [...prev, payload.new as Folder]);
        } else if (payload.eventType === 'UPDATE') {
          setFolders(prev => prev.map(folder => 
            folder.id === payload.new.id ? { ...folder, ...payload.new } : folder
          ));
        } else if (payload.eventType === 'DELETE') {
          setFolders(prev => prev.filter(folder => folder.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(foldersSubscription);
    };
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: TEST_USER_ID }])
        .select()
        .single();

      if (error) {
        toast.error('Failed to add task');
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      throw error;
    }
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update task');
      throw error;
    }

    return data;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete task');
      throw error;
    }
  };

  // Similar CRUD functions for notes, recordings, focus sessions, and unavailable times
  const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ ...note, user_id: TEST_USER_ID }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add note');
      throw error;
    }

    return data;
  };

  const updateNote = async (id: string, note: Partial<Note>) => {
    const { data, error } = await supabase
      .from('notes')
      .update(note)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update note');
      throw error;
    }

    return data;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete note');
      throw error;
    }
  };

  const addRecording = async (recording: Omit<Recording, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      console.log('Adding recording with test user ID:', TEST_USER_ID);
      
      const { data, error } = await supabase
        .from('recordings')
        .insert([{ ...recording, user_id: TEST_USER_ID }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding recording:', error);
        toast.error('Failed to add recording');
        throw error;
      }

      // Update local state to avoid needing to refetch
      setRecordings(prev => [...prev, data]);
      
      return data;
    } catch (error) {
      console.error('Error adding recording:', error);
      toast.error('Failed to add recording');
      throw error;
    }
  };

  const updateRecording = async (id: string, recording: Partial<Recording>) => {
    const { data, error } = await supabase
      .from('recordings')
      .update(recording)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update recording');
      throw error;
    }

    return data;
  };

  const deleteRecording = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete recording');
        throw error;
      }

      // Update local state after successful deletion
      setRecordings(prev => prev.filter(recording => recording.id !== id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
      throw error;
    }
  };

  const addFocusSession = async (session: Omit<FocusSession, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([{ ...session, user_id: TEST_USER_ID }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add focus session');
      throw error;
    }

    return data;
  };

  const updateFocusSession = async (id: string, session: Partial<FocusSession>) => {
    const { data, error } = await supabase
      .from('focus_sessions')
      .update(session)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update focus session');
      throw error;
    }

    return data;
  };

  const deleteFocusSession = async (id: string) => {
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete focus session');
      throw error;
    }
  };

  const addUnavailableTime = async (time: Omit<UnavailableTime, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase
      .from('unavailable_times')
      .insert([{ ...time, user_id: TEST_USER_ID }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add unavailable time');
      throw error;
    }

    return data;
  };

  const updateUnavailableTime = async (id: string, time: Partial<UnavailableTime>) => {
    const { data, error } = await supabase
      .from('unavailable_times')
      .update(time)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update unavailable time');
      throw error;
    }

    return data;
  };

  const deleteUnavailableTime = async (id: string) => {
    const { error } = await supabase
      .from('unavailable_times')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete unavailable time');
      throw error;
    }
  };

  // Folder operations
  const addFolder = async (folder: Omit<Folder, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const { data, error } = await supabase
      .from('folders')
      .insert([{ ...folder, user_id: TEST_USER_ID }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add folder');
      throw error;
    }
    
    // Update local state
    setFolders(prev => [...prev, data]);

    return data;
  };

  const updateFolder = async (id: string, folder: Partial<Folder>) => {
    const { data, error } = await supabase
      .from('folders')
      .update(folder)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update folder');
      throw error;
    }
    
    // Update local state
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));

    return data;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete folder');
      throw error;
    }
    
    // Update local state
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const value = {
    tasks,
    notes,
    recordings,
    focusSessions,
    unavailableTimes,
    folders,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    addNote,
    updateNote,
    deleteNote,
    addRecording,
    updateRecording,
    deleteRecording,
    addFocusSession,
    updateFocusSession,
    deleteFocusSession,
    addUnavailableTime,
    updateUnavailableTime,
    deleteUnavailableTime,
    addFolder,
    updateFolder,
    deleteFolder
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 