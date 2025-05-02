import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task } from '@/types/task';
import { Note } from '@/types/note';
import { loadInitialData, createTask, updateTask, deleteTask, createNote, updateNote, deleteNote } from '@/utils/airtableUtils';
import { toast } from '@/components/ui/use-toast';

interface SyncContextType {
  tasks: Task[];
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  // Task operations
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  // Note operations
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function initialize() {
      try {
        const result = await loadInitialData();
        if (result.success && result.data) {
          setTasks(result.data.tasks);
          setNotes(result.data.notes);
        } else {
          throw new Error(result.error || 'Failed to load data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          title: "Error Loading Data",
          description: "Failed to load your data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Task operations with optimistic updates
  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const newTask = await createTask(task);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      toast({
        title: "Error Creating Task",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // Optimistic update
      setTasks(prev => 
        prev.map(task => task.id === id ? { ...task, ...updates } : task)
      );
      
      await updateTask(id, updates);
    } catch (err) {
      // Revert on failure
      toast({
        title: "Error Updating Task",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      // Reload tasks to ensure consistency
      const result = await loadInitialData();
      if (result.success && result.data) {
        setTasks(result.data.tasks);
      }
      throw err;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      // Optimistic delete
      setTasks(prev => prev.filter(task => task.id !== id));
      await deleteTask(id);
    } catch (err) {
      toast({
        title: "Error Deleting Task",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      // Reload tasks to ensure consistency
      const result = await loadInitialData();
      if (result.success && result.data) {
        setTasks(result.data.tasks);
      }
      throw err;
    }
  };

  // Note operations with optimistic updates
  const addNote = async (note: Omit<Note, 'id'>) => {
    try {
      const newNote = await createNote(note);
      setNotes(prev => [...prev, newNote]);
    } catch (err) {
      toast({
        title: "Error Creating Note",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      // Optimistic update
      setNotes(prev => 
        prev.map(note => note.id === id ? { ...note, ...updates } : note)
      );
      
      await updateNote(id, updates);
    } catch (err) {
      toast({
        title: "Error Updating Note",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
      // Reload notes to ensure consistency
      const result = await loadInitialData();
      if (result.success && result.data) {
        setNotes(result.data.notes);
      }
      throw err;
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      // Optimistic delete
      setNotes(prev => prev.filter(note => note.id !== id));
      await deleteNote(id);
    } catch (err) {
      toast({
        title: "Error Deleting Note",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
      // Reload notes to ensure consistency
      const result = await loadInitialData();
      if (result.success && result.data) {
        setNotes(result.data.notes);
      }
      throw err;
    }
  };

  const value = {
    tasks,
    notes,
    isLoading,
    error,
    addTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    addNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
} 