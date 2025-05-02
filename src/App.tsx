import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { UnavailableTimesProvider } from '@/contexts/UnavailableTimesContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from 'sonner';
import { SidebarProvider } from './components/ui/sidebar';
import { DataProvider } from '@/contexts/DataContext';
import { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';

import Index from '@/pages/HomePage';
import NotesPage from '@/pages/NotesPage';
import NewNotePage from '@/pages/NewNotePage';
import CalendarPage from '@/pages/CalendarPage';
import ResourcesPage from '@/pages/ResourcesPage';
import ToolsPage from '@/pages/ToolsPage';
import RecordPage from '@/pages/RecordPage';
import SettingsPage from '@/pages/SettingsPage';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import DashboardPage from "@/pages/dashboard/DashboardPage";

import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <SettingsProvider>
            <DataProvider>
              <UnavailableTimesProvider>
                <TaskProvider>
                  <SidebarProvider>
                    <Toaster />
                    <Routes>
                      <Route
                        path="/"
                        element={
                          isAuthenticated ? (
                            <Navigate to="/record" replace />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          isAuthenticated ? (
                            <DashboardPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/notes"
                        element={
                          isAuthenticated ? (
                            <NotesPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/notes/new"
                        element={
                          isAuthenticated ? (
                            <NewNotePage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/calendar"
                        element={
                          isAuthenticated ? (
                            <CalendarPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/resources"
                        element={
                          isAuthenticated ? (
                            <ResourcesPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/tools"
                        element={
                          isAuthenticated ? (
                            <ToolsPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/record"
                        element={
                          isAuthenticated ? (
                            <RecordPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          isAuthenticated ? (
                            <SettingsPage />
                          ) : (
                            <Navigate to="/auth" replace />
                          )
                        }
                      />
                      <Route
                        path="/auth"
                        element={
                          !isAuthenticated ? (
                            <AuthPage />
                          ) : (
                            <Navigate to="/" replace />
                          )
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SidebarProvider>
                </TaskProvider>
              </UnavailableTimesProvider>
            </DataProvider>
          </SettingsProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
