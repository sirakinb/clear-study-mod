import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, differenceInDays, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { useTasks } from "@/contexts/TaskContext";
import { useUnavailableTimes } from "@/contexts/UnavailableTimesContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Ban, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnavailableTimesDialog from "@/components/UnavailableTimesDialog";
import TaskDialog from "@/components/TaskDialog";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [showUnavailableTimesDialog, setShowUnavailableTimesDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const { tasks, getTasksForDateRange } = useTasks();
  const { isTimeBlockUnavailable, unavailableTimes } = useUnavailableTimes();

  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const endOfCurrentWeek = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
    };
  });

  const getTasksForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      if (task.startDate && task.dueDate) {
        return isWithinInterval(date, { start: task.startDate, end: task.dueDate });
      }
      
      if (task.startDate && !task.dueDate) {
        return isSameDay(task.startDate, date);
      }
      
      if (!task.startDate && task.dueDate) {
        return isSameDay(task.dueDate, date);
      }
      
      return false;
    }).sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  };

  const getTasksForWeek = () => {
    return getTasksForDateRange(startOfCurrentWeek, endOfCurrentWeek);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-950/10';
      case 'medium':
        return 'border-amber-500 bg-amber-50 dark:bg-amber-950/10';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-950/10';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800/10';
    }
  };

  const timeBlocks = Array.from({ length: 17 }, (_, i) => {
    return format(new Date().setHours(i + 8, 0, 0, 0), 'h:mm a');
  });

  const getTaskPosition = (task: typeof tasks[0], date: Date, index: number, totalTasks: number) => {
    if (task.taskType === 'multi-day' && task.pomodoroSessions && task.pomodoroSessions.length > 0) {
      const sessionsForDay = task.pomodoroSessions.filter(session => 
        isSameDay(session.startTime, date)
      );
      
      if (sessionsForDay.length > 0) {
        const session = sessionsForDay[0];
        const hour = session.startTime.getHours();
        const minute = session.startTime.getMinutes();
        
        const topPosition = (hour - 8) * 4 + (minute / 60) * 4;
        
        const durationMs = session.endTime.getTime() - session.startTime.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        const height = (durationMinutes / 60) * 4;
        
        // Calculate width and left position for multiple tasks
        const width = `calc(${100 / totalTasks}% - 0.5rem)`;
        const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
        
        return {
          top: `${topPosition}rem`,
          height: `${height}rem`,
          width,
          left
        };
      }
    }
    
    if (task.startDate && task.dueDate) {
      if (isSameDay(task.startDate, date)) {
        // Calculate width and left position for multiple tasks
        const width = `calc(${100 / totalTasks}% - 0.5rem)`;
        const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
        
        return {
          top: '8rem',
          height: '4rem',
          width,
          left
        };
      }
      if (isSameDay(task.dueDate, date)) {
        // Calculate width and left position for multiple tasks
        const width = `calc(${100 / totalTasks}% - 0.5rem)`;
        const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
        
        return {
          top: '12rem',
          height: '5rem',
          width,
          left
        };
      }
      // Calculate width and left position for multiple tasks
      const width = `calc(${100 / totalTasks}% - 0.5rem)`;
      const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
      
      return {
        top: '10rem',
        height: '3rem',
        width,
        left
      };
    }
    
    if (task.dueDate) {
      const hour = task.dueDate.getHours();
      const minute = task.dueDate.getMinutes();
      
      const topPosition = (hour - 8) * 4 + (minute / 60) * 4;
      
      const height = (task.duration / 60) * 4;
      
      // Calculate width and left position for multiple tasks
      const width = `calc(${100 / totalTasks}% - 0.5rem)`;
      const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
      
      return {
        top: `${topPosition}rem`,
        height: `${height}rem`,
        width,
        left
      };
    }
    
    // Calculate width and left position for multiple tasks
    const width = `calc(${100 / totalTasks}% - 0.5rem)`;
    const left = `calc(${(index * 100) / totalTasks}% + 0.25rem)`;
    
    return {
      top: '9rem',
      height: '3rem',
      width,
      left
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setSelectedDate(prevDate => 
        direction === 'prev' ? addDays(prevDate, -1) : addDays(prevDate, 1)
      );
    } else {
      setSelectedDate(prevDate => 
        direction === 'prev' ? addDays(prevDate, -7) : addDays(prevDate, 7)
      );
    }
  };

  const getTaskStatusIndicator = (task: typeof tasks[0]) => {
    if (task.completed) {
      return <div className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full"></div>;
    }
    return null;
  };

  const getTaskDateText = (task: typeof tasks[0]) => {
    if (task.startDate && task.dueDate) {
      return `${format(task.startDate, 'MMM d')} - ${format(task.dueDate, 'MMM d')}`;
    }
    if (task.dueDate) {
      return `Due: ${format(task.dueDate, 'MMM d')}`;
    }
    if (task.startDate) {
      return `Start: ${format(task.startDate, 'MMM d')}`;
    }
    return '';
  };

  const getPomodoroSessionText = (task: typeof tasks[0], date: Date) => {
    if (task.taskType === 'multi-day' && task.pomodoroSessions) {
      const sessionsForDay = task.pomodoroSessions.filter(session => 
        isSameDay(session.startTime, date)
      );
      
      if (sessionsForDay.length > 0) {
        const completedSessions = sessionsForDay.filter(s => s.completed).length;
        return `${completedSessions}/${sessionsForDay.length} sessions`;
      }
    }
    return null;
  };

  const isTimeSlotUnavailable = (date: Date, hour: number): boolean => {
    const timeToCheck = new Date(date);
    timeToCheck.setHours(hour, 0, 0, 0);
    return isTimeBlockUnavailable(timeToCheck);
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-3 lg:p-4 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h1 className="text-xl lg:text-2xl font-bold font-heading text-primary">Calendar</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTaskDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Add Task</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUnavailableTimesDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Ban className="h-4 w-4" />
                  <span className="hidden md:inline">Unavailable Times</span>
                </Button>
                <Tabs defaultValue="day" value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedDate(new Date())} className="h-8 text-xs">
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[calc(100vh-120px)] overflow-hidden items-start">
              <Card className="md:col-span-1 w-full max-w-xs md:max-w-sm lg:max-w-md mx-auto min-h-[500px]">
                <CardContent className="p-4 w-full h-full flex justify-center items-center">
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-3 overflow-hidden">
                <Card className="h-full">
                  <CardContent className="p-2 h-full overflow-hidden">
                    {view === 'day' ? (
                      <div className="h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-2">
                          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </h2>
                        
                        <div className="relative border rounded-md flex-1 overflow-auto">
                          <div className="absolute top-0 left-0 w-14 h-full border-r">
                            {timeBlocks.map((time) => (
                              <div 
                                key={time} 
                                className="h-16 border-b text-xs text-muted-foreground flex items-start justify-center pt-1"
                              >
                                {time}
                              </div>
                            ))}
                          </div>
                          
                          <div className="ml-14 relative">
                            {timeBlocks.map((time, index) => {
                              const hour = index + 8;
                              const isUnavailable = isTimeSlotUnavailable(selectedDate, hour);
                              
                              return (
                                <div 
                                  key={time} 
                                  className={cn(
                                    "border-b w-full h-16",
                                    isUnavailable ? "bg-red-50 dark:bg-red-950/10" : "bg-background"
                                  )}
                                >
                                  {isUnavailable && (
                                    <div className="h-full w-full flex items-center justify-center opacity-20">
                                      <Ban className="h-6 w-6 text-red-500" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {isToday(selectedDate) && (
                              <div 
                                className="absolute w-full h-0.5 bg-red-500 z-10"
                                style={{ 
                                  top: `${(new Date().getHours() - 8) * 4 + (new Date().getMinutes() / 60) * 4}rem` 
                                }}
                              >
                                <div className="absolute -left-1 -top-1.5 rounded-full w-3 h-3 bg-red-500" />
                              </div>
                            )}
                            
                            {getTasksForDate(selectedDate).map((task, index, array) => {
                              // Group tasks by their time slot
                              const tasksAtSameTime = array.filter(t => {
                                if (task.taskType === 'multi-day' && task.pomodoroSessions && t.taskType === 'multi-day' && t.pomodoroSessions) {
                                  const taskSession = task.pomodoroSessions.find(s => isSameDay(s.startTime, selectedDate));
                                  const otherSession = t.pomodoroSessions.find(s => isSameDay(s.startTime, selectedDate));
                                  return taskSession && otherSession && 
                                         taskSession.startTime.getTime() === otherSession.startTime.getTime();
                                }
                                if (task.dueDate && t.dueDate) {
                                  return task.dueDate.getTime() === t.dueDate.getTime();
                                }
                                return false;
                              });
                              
                              // Only render if this is the first task in its time slot
                              if (tasksAtSameTime[0] === task) {
                                return tasksAtSameTime.map((t, i) => (
                                  <div 
                                    key={t.id}
                                    className={`absolute rounded-md p-1 border-l-4 mx-1 overflow-hidden shadow-sm ${getUrgencyColor(t.urgency)} ${t.completed ? 'opacity-60' : ''}`}
                                style={{
                                      ...getTaskPosition(t, selectedDate, i, tasksAtSameTime.length),
                                      maxHeight: '4rem'
                                }}
                              >
                                <div className="flex flex-col h-full overflow-hidden relative">
                                      {getTaskStatusIndicator(t)}
                                      <h3 className={`font-medium text-xs truncate ${t.completed ? 'line-through' : ''}`}>
                                        {t.name}
                                  </h3>
                                  
                                  <div className="flex items-center gap-1 text-xs mt-0.5">
                                        {t.taskType === 'multi-day' && t.pomodoroSessions ? (
                                      <span className="flex items-center">
                                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                                            {getPomodoroSessionText(t, selectedDate) || `${t.duration} min`}
                                      </span>
                                    ) : (
                                      <span className="flex items-center">
                                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                                            {t.duration} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                                ));
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-2">
                          Week of {format(startOfCurrentWeek, 'MMMM d, yyyy')}
                        </h2>
                        
                        <div className="grid grid-cols-7 border rounded-md flex-1 overflow-auto">
                          <div className="contents">
                            {weekDays.map(day => (
                              <div 
                                key={day.dayName} 
                                className={cn(
                                  "p-1 border-b text-center sticky top-0 bg-background z-10",
                                  isToday(day.date) && "bg-primary/5 font-bold"
                                )}
                              >
                                <div className="text-xs font-medium">{day.dayName}</div>
                                <div className={cn(
                                  "flex items-center justify-center rounded-full mx-auto w-6 h-6 text-xs",
                                  isToday(day.date) && "bg-primary text-primary-foreground"
                                )}>
                                  {day.dayNumber}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {weekDays.map(day => (
                            <div 
                              key={day.dayName} 
                              className={cn(
                                "p-1 border-r min-h-[10rem] relative",
                                isToday(day.date) && "bg-primary/5"
                              )}
                            >
                              {unavailableTimes
                                .filter(block => block.dayOfWeek === day.date.getDay())
                                .map(block => (
                                  <div 
                                    key={block.id}
                                    className="mb-1 p-1 rounded-md border-l-2 text-xs bg-red-50 dark:bg-red-950/10 border-red-300"
                                  >
                                    <div className="font-medium truncate flex items-center">
                                      <Ban className="h-3 w-3 mr-0.5 text-red-500" />
                                      {block.startHour}:{block.startMinute.toString().padStart(2, '0')} - 
                                      {block.endHour}:{block.endMinute.toString().padStart(2, '0')}
                                    </div>
                                    {block.label && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {block.label}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              
                              {tasks
                                .filter(task => task.taskType === 'multi-day' && task.pomodoroSessions)
                                .flatMap(task => {
                                  if (!task.pomodoroSessions) return [];
                                  return task.pomodoroSessions
                                    .filter(session => isSameDay(session.startTime, day.date))
                                    .map(session => ({ task, session }));
                                })
                                .sort((a, b) => a.session.startTime.getTime() - b.session.startTime.getTime())
                                .map(({ task, session }) => (
                                  <div 
                                    key={session.id} 
                                    className={`mb-1 p-1 rounded-md border-l-2 text-xs ${getUrgencyColor(task.urgency)} ${session.completed ? 'opacity-60' : ''}`}
                                  >
                                    <div className={`font-medium truncate ${session.completed ? 'line-through' : ''}`}>
                                      {task.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {format(session.startTime, 'h:mm')} - {format(session.endTime, 'h:mm a')}
                                    </div>
                                  </div>
                                ))}
                              
                              {getTasksForDate(day.date)
                                .filter(task => 
                                  !(task.taskType === 'multi-day' && task.pomodoroSessions?.some(s => isSameDay(s.startTime, day.date)))
                                )
                                .map(task => (
                                  <div 
                                    key={task.id} 
                                    className={`mb-1 p-1 rounded-md border-l-2 text-xs ${getUrgencyColor(task.urgency)} ${task.completed ? 'opacity-60' : ''}`}
                                  >
                                    <div className={`font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                                      {task.name}
                                    </div>
                                    
                                    {task.dueDate && (
                                      <div className="text-xs text-muted-foreground flex items-center">
                                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                                        {format(task.dueDate, 'h:mm a')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      <UnavailableTimesDialog 
        open={showUnavailableTimesDialog} 
        onOpenChange={setShowUnavailableTimesDialog} 
      />
      <TaskDialog 
        open={showTaskDialog} 
        onOpenChange={setShowTaskDialog} 
      />
    </div>
  );
};

export default CalendarPage;
