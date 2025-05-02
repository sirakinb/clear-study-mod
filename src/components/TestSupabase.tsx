import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function TestSupabase() {
  const { addTask, tasks, deleteTask } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTask = async () => {
    setIsLoading(true);
    try {
      await addTask({
        title: 'Test Task',
        description: 'This is a test task',
        difficulty: 'medium',
        duration: 30,
        task_type: 'one-time',
        status: 'pending',
        due_date: null,
        due_time: null
      });
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Supabase Test</h2>
      
      <div className="space-y-4">
        <Button 
          onClick={handleAddTask}
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Test Task'}
        </Button>

        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Tasks:</h3>
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span>{task.title}</span>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 