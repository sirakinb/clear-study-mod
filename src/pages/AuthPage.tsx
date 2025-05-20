import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface User {
  email: string;
  password: string;
  name?: string;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<User>({
    email: '',
    password: '',
    name: ''
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });

  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('savedEmail') || '';
      const savedPassword = localStorage.getItem('savedPassword') || '';
      setUserData((prev) => ({ ...prev, email: savedEmail, password: savedPassword }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Submitting with userData:', userData);
    if (rememberMe) {
      localStorage.setItem('savedEmail', userData.email);
      localStorage.setItem('savedPassword', userData.password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('savedPassword');
      localStorage.setItem('rememberMe', 'false');
    }
    
    try {
      if (isSignup) {
        // Signup logic
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name
            }
          }
        });
        
        if (error) {
          console.error('Signup error:', error);
          toast.error(error.message);
          return;
        }
        console.log('Signup successful:', data);
        toast.success('Account created successfully! Please check your email for verification.');
      } else {
        // Login logic
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (error) {
          console.error('Login error:', error);
          toast.error(error.message);
          return;
        }
        console.log('Login successful:', data);
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">{isSignup ? 'Create Account' : 'Welcome Back'}</CardTitle>
            <CardDescription className="text-center">
              {isSignup ? 'Sign up to get started' : 'Sign in to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <form onSubmit={handleSubmit} className="space-y-4 w-full flex flex-col items-center">
              {isSignup && (
                <div className="space-y-2 w-full flex flex-col items-center">
                  <Label htmlFor="name" className="self-center">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    required
                    className="w-full text-center"
                  />
                </div>
              )}
              <div className="space-y-2 w-full flex flex-col items-center">
                <Label htmlFor="email" className="self-center">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  required
                  className="w-full text-center"
                />
              </div>
              <div className="space-y-2 w-full flex flex-col items-center">
                <Label htmlFor="password" className="self-center">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                  required
                  className="w-full text-center"
                />
              </div>
              <div className="flex items-center w-full justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-checkbox rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Remember me
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></div>
                    {isSignup ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  isSignup ? 'Sign Up' : 'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center w-full">
              <Button
                variant="link"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm"
                disabled={isLoading}
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 