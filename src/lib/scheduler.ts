import { format, parse, addMinutes, isBefore, isAfter, differenceInMinutes } from 'date-fns';

export type Task = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  difficulty: 'easy' | 'hard';
  priority: 'high' | 'medium' | 'low';
  preferredTimeWindow?: {
    start?: string;
    end?: string;
  };
};

export type ScheduledTask = Task & {
  startTime: Date;
  endTime: Date;
  isBreak: boolean;
  breakDuration?: number;
};

const SHORT_BREAK_DURATION = 10; // minutes
const LONG_BREAK_DURATION = 45; // minutes
const MAX_TASK_DURATION = 45; // minutes
const WORK_BLOCK_BEFORE_LONG_BREAK = 180; // minutes (3 hours)

export function createSchedule(tasks: Task[], startTime: Date = new Date()): ScheduledTask[] {
  // Sort tasks by priority and duration
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const schedule: ScheduledTask[] = [];
  let currentTime = startTime;
  let totalWorkTime = 0;
  let lastTaskWasHard = false;

  for (const task of sortedTasks) {
    // Split task into 45-minute segments if needed
    const segments = Math.ceil(task.duration / MAX_TASK_DURATION);
    const segmentDuration = Math.min(task.duration, MAX_TASK_DURATION);

    for (let i = 0; i < segments; i++) {
      // Check if we need a long break
      if (totalWorkTime >= WORK_BLOCK_BEFORE_LONG_BREAK) {
        schedule.push({
          id: `break-${Date.now()}`,
          name: 'Long Break',
          duration: LONG_BREAK_DURATION,
          difficulty: 'easy',
          priority: 'low',
          startTime: currentTime,
          endTime: addMinutes(currentTime, LONG_BREAK_DURATION),
          isBreak: true,
          breakDuration: LONG_BREAK_DURATION
        });
        currentTime = addMinutes(currentTime, LONG_BREAK_DURATION);
        totalWorkTime = 0;
      }

      // Check preferred time window
      if (task.preferredTimeWindow?.start) {
        const preferredStart = parse(task.preferredTimeWindow.start, 'h:mm a', new Date());
        if (isBefore(preferredStart, currentTime)) {
          currentTime = preferredStart;
        }
      }

      // Add short break if needed
      if (schedule.length > 0 && !schedule[schedule.length - 1].isBreak) {
        schedule.push({
          id: `break-${Date.now()}`,
          name: 'Short Break',
          duration: SHORT_BREAK_DURATION,
          difficulty: 'easy',
          priority: 'low',
          startTime: currentTime,
          endTime: addMinutes(currentTime, SHORT_BREAK_DURATION),
          isBreak: true,
          breakDuration: SHORT_BREAK_DURATION
        });
        currentTime = addMinutes(currentTime, SHORT_BREAK_DURATION);
      }

      // Add task segment
      const endTime = addMinutes(currentTime, segmentDuration);
      schedule.push({
        ...task,
        startTime: currentTime,
        endTime,
        isBreak: false
      });

      currentTime = endTime;
      totalWorkTime += segmentDuration;
      lastTaskWasHard = task.difficulty === 'hard';
    }
  }

  return schedule;
}

export function adjustSchedule(
  schedule: ScheduledTask[],
  taskId: string,
  actualDuration: number
): { newSchedule: ScheduledTask[]; adjustments: string[] } {
  const taskIndex = schedule.findIndex(t => t.id === taskId && !t.isBreak);
  if (taskIndex === -1) return { newSchedule: schedule, adjustments: [] };

  const task = schedule[taskIndex];
  const plannedDuration = differenceInMinutes(task.endTime, task.startTime);
  const durationDiff = actualDuration - plannedDuration;

  if (durationDiff === 0) {
    return { newSchedule: schedule, adjustments: [] };
  }

  const adjustments: string[] = [];
  const newSchedule = [...schedule];

  // Update the current task's duration
  newSchedule[taskIndex] = {
    ...task,
    endTime: addMinutes(task.startTime, actualDuration)
  };

  // Shift all subsequent tasks
  let currentTime = newSchedule[taskIndex].endTime;
  for (let i = taskIndex + 1; i < newSchedule.length; i++) {
    const task = newSchedule[i];
    const duration = differenceInMinutes(task.endTime, task.startTime);
    newSchedule[i] = {
      ...task,
      startTime: currentTime,
      endTime: addMinutes(currentTime, duration)
    };
    currentTime = newSchedule[i].endTime;

    if (!task.isBreak) {
      adjustments.push(`Task "${task.name}" moved to ${format(task.startTime, 'h:mm a')}`);
    }
  }

  return { newSchedule, adjustments };
}

export function formatSchedule(schedule: ScheduledTask[]): string {
  return schedule.map(task => {
    const timeRange = `${format(task.startTime, 'h:mm a')} - ${format(task.endTime, 'h:mm a')}`;
    if (task.isBreak) {
      return `${timeRange}: ${task.name} (${task.breakDuration} minutes)`;
    }
    return `${timeRange}: ${task.name} (${task.difficulty}, ${task.priority} priority)`;
  }).join('\n');
} 