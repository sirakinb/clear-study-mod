// Airtable API integration utilities

import { Task } from '@/types/task';
import { Note } from '@/types/note';

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;

const TASKS_TABLE = 'Tasks';
const NOTES_TABLE = 'Notes';
const RECORDINGS_TABLE = 'Recordings';

export interface AirtableTranscript {
  title: string;
  transcript: string;
  date: string;
  duration?: number;
  notes?: string;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
}

/**
 * Saves a transcript to Airtable
 * @param data Transcript data to save
 * @param config Airtable configuration
 * @returns Promise with Airtable record ID
 */
export const saveToAirtable = async (
  data: AirtableTranscript, 
  config: AirtableConfig
): Promise<string> => {
  try {
    console.log(`Saving transcript to Airtable. Base ID: ${config.baseId}, Table: ${config.tableName}`);
    console.log(`Transcript data: Title "${data.title}", Length ${data.transcript.length} characters`);
    
    // Validate table name
    if (config.tableName !== "Transcripts") {
      throw new Error('Table name must be exactly "Transcripts"');
    }
    
    const response = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.tableName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Title: data.title,
            Transcript: data.transcript,
            Date: data.date,
            Duration: data.duration || 0,
            Notes: data.notes || ""
          }
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API Error (${response.status}): ${errorText}`);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        console.error("Could not parse error response as JSON:", parseError);
      }
      
      throw new Error(`Airtable save failed: ${
        errorData?.error?.message || 
        `HTTP Status ${response.status}: ${response.statusText}`
      }`);
    }

    const responseData = await response.json();
    const recordId = responseData.records?.[0]?.id;
    
    if (!recordId) {
      throw new Error('No record ID received from Airtable');
    }
    
    console.log(`Successfully saved to Airtable! Record ID: ${recordId}`);
    return recordId;
  } catch (error) {
    console.error("Error saving to Airtable:", error);
    throw error;
  }
};

/**
 * Validates if Airtable credentials are correct by making a test request
 * @param config Airtable configuration
 * @returns Promise<boolean> - true if credentials are valid
 */
export const validateAirtableCredentials = async (config: AirtableConfig): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${config.baseId}/${config.tableName}?maxRecords=1`, 
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error("Error validating Airtable credentials:", error);
    return false;
  }
};

// Base Airtable fetch function
async function airtableFetch(table: string, method: string, data?: any) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Tasks CRUD operations
export async function createTask(task: Omit<Task, 'id'>) {
  const data = {
    fields: {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      difficulty: task.difficulty,
      status: task.status,
      urgency: task.urgency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  const result = await airtableFetch(TASKS_TABLE, 'POST', { records: [data] });
  return result.records[0];
}

export async function getTasks() {
  const result = await airtableFetch(TASKS_TABLE, 'GET');
  return result.records.map((record: any) => ({
    id: record.id,
    ...record.fields,
  }));
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const data = {
    fields: {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
  
  const result = await airtableFetch(`${TASKS_TABLE}/${id}`, 'PATCH', data);
  return result;
}

export async function deleteTask(id: string) {
  return airtableFetch(`${TASKS_TABLE}/${id}`, 'DELETE');
}

// Notes CRUD operations
export async function createNote(note: Omit<Note, 'id'>) {
  const data = {
    fields: {
      title: note.title,
      content: note.content,
      isFavorite: note.isFavorite,
      folderId: note.folderId,
      recordingId: note.recordingId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  const result = await airtableFetch(NOTES_TABLE, 'POST', { records: [data] });
  return result.records[0];
}

export async function getNotes() {
  const result = await airtableFetch(NOTES_TABLE, 'GET');
  return result.records.map((record: any) => ({
    id: record.id,
    ...record.fields,
  }));
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const data = {
    fields: {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
  
  const result = await airtableFetch(`${NOTES_TABLE}/${id}`, 'PATCH', data);
  return result;
}

export async function deleteNote(id: string) {
  return airtableFetch(`${NOTES_TABLE}/${id}`, 'DELETE');
}

// Utility functions for data sync
export async function syncAllData() {
  const [tasks, notes] = await Promise.all([
    getTasks(),
    getNotes(),
  ]);
  
  return {
    tasks,
    notes,
  };
}

// Function to handle initial data load
export async function loadInitialData() {
  try {
    const data = await syncAllData();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error loading initial data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 