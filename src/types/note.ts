export interface Note {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  folderId: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields
  recordingId?: string;  // If the note was created from a recording
  summary?: string;      // AI-generated summary
  keywords?: string[];   // AI-generated keywords
} 