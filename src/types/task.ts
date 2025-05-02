export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;  // ISO date string
  dueTime: string;  // 24-hour format HH:mm
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed';
  urgency: number;  // Calculated field based on due date/time
  createdAt: string;
  updatedAt: string;
} 