import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSidebar } from '@/components/AppSidebar';

export default function HomePage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('clearstudy-current-user') || '{}');

  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1 min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Welcome, {user.name || 'User'}!</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/record')}>
              <CardHeader>
                <CardTitle>Record Audio</CardTitle>
                <CardDescription>Start a new recording session</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Record and transcribe your lectures or study sessions.</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/notes/new')}>
              <CardHeader>
                <CardTitle>Create Note</CardTitle>
                <CardDescription>Write a new study note</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create detailed notes with rich text formatting.</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/notes')}>
              <CardHeader>
                <CardTitle>My Notes</CardTitle>
                <CardDescription>View your study notes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Access and organize all your study materials.</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/calendar')}>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Manage your study schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Plan and track your study sessions and deadlines.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 