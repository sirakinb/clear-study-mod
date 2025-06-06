import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase, getCurrentUserId } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const NewNotePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { colorScheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and content for your note.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the current user ID
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            is_favorite: false,
            user_id: userId,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Note saved",
        description: "Your note has been successfully saved.",
      });
      
      // Reset form and redirect to notes page
      setTitle("");
      setContent("");
      navigate("/notes");
      
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        variant: "destructive",
        title: "Error saving note",
        description: "There was a problem saving your note. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Note</h1>

          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle>Note Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="note-title" className="block text-sm font-medium text-foreground/80 mb-1">
                    Note Title
                  </label>
                  <Input
                    id="note-title"
                    placeholder="Enter note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="border-input focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="note-content" className="block text-sm font-medium text-foreground/80 mb-1">
                    Note Content
                  </label>
                  <Textarea
                    id="note-content"
                    placeholder="Enter your note content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] border-input focus:border-primary"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90" 
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                    Save Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
};

export default NewNotePage;
