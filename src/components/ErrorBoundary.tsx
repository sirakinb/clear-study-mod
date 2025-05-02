import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isAuthError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isAuthError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's an authentication error
    const isAuthError = error.message.includes('Auth') || 
                       error.message.includes('session') ||
                       error.message.includes('user') ||
                       error.message.includes('authentication');
    
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      isAuthError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = async (): Promise<void> => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Auth error UI
      if (this.state.isAuthError) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Authentication Error</h2>
                <p className="text-muted-foreground mb-6">
                  {this.state.error?.message || "We couldn't authenticate you. Using demo mode instead."}
                </p>
                <Button 
                  className="gap-2" 
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="h-4 w-4" /> 
                  Retry with Test User
                </Button>
              </div>
            </div>
          </div>
        );
      }
      
      // Generic error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button 
                className="gap-2" 
                onClick={this.handleRetry}
              >
                <RefreshCw className="h-4 w-4" /> 
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 