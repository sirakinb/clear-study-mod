import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Plus } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import TaskDialog from "@/components/TaskDialog";
import { useTasks } from "@/contexts/TaskContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import PrioritizedTaskList from "@/components/PrioritizedTaskList";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

const DashboardPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const { colorScheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Handle window resize to detect mobile vs desktop
  useState(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Combined function to handle quick actions
  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'record':
        navigate('/record');
        break;
      case 'task':
        setDialogOpen(true);
        break;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6 bg-white dark:bg-slate-900">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <div className="flex gap-2">
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Quick Action
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="p-4 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleQuickAction('record')}
                      >
                        <Mic className="mr-2 h-4 w-4" /> New Recording
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleQuickAction('task')}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Task
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Quick Action
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleQuickAction('record')}>
                      <Mic className="mr-2 h-4 w-4" /> New Recording
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAction('task')}>
                      <Plus className="mr-2 h-4 w-4" /> Add Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* All Tasks Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">All Tasks</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </div>
            <PrioritizedTaskList 
              title="" 
              description="Organized by priority and due date" 
              showOptimized={false}
              maxTasks={20}
            />
          </div>

          {/* Today's Tasks Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
            </div>
            <PrioritizedTaskList 
              title="" 
              description="Optimized for maximum productivity" 
              showOptimized={true}
              maxDailyMinutes={240}
            />
          </div>
        </div>
      </SidebarInset>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default DashboardPage; 