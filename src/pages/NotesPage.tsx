import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/AppSidebar";
import { FileText, Mic, Star, Save, Edit, Check, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase, getCurrentUserId } from "@/lib/supabase";
import { AudioPlayer } from "@/components/AudioPlayer";

interface Note {
  id: string;
  title: string;
  content: string;
  is_favorite: boolean;
  folder_id: string | null;
  recording_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { toast } = useToast();
  const { colorScheme } = useTheme();

  // Load notes when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setNotes(data || []);
        if (data && data.length > 0) {
          setSelectedNote(data[0]);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          variant: "destructive",
          title: "Error loading notes",
          description: "There was a problem loading your notes. Please try again.",
        });
      }
    };

    fetchNotes();
  }, [toast]);

  const filteredNotes = () => {
    switch (activeTab) {
      case "recent":
        return notes.slice(0, 3);
      case "favorites":
        return notes.filter(note => note.is_favorite);
      default:
        return notes;
    }
  };

  const toggleFavorite = async (noteId: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    const newIsFavorite = !noteToUpdate.is_favorite;
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: newIsFavorite })
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, is_favorite: newIsFavorite } : note
      );
      
      setNotes(updatedNotes);
      
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote({ ...selectedNote, is_favorite: newIsFavorite });
      }
      
      const action = newIsFavorite ? "added to" : "removed from";
      toast({
        title: `Note ${action} favorites`,
        description: `"${noteToUpdate.title}" has been ${action} your favorites`,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: "destructive",
        title: "Error updating note",
        description: "There was a problem updating the note. Please try again.",
      });
    }
  };

  const handleEdit = () => {
    if (!selectedNote) return;
    setEditedContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNote.id);

      if (error) throw error;

      // Update local state
      const updatedNote = {
        ...selectedNote,
        content: editedContent,
        updated_at: new Date().toISOString()
      };
      
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      );
      
      setNotes(updatedNotes);
      setSelectedNote(updatedNote);
      setIsEditing(false);
      
      toast({
        title: "Note saved",
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: "destructive",
        title: "Error saving note",
        description: "There was a problem saving your changes. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent("");
    
    toast({
      title: "Editing cancelled",
      description: "Your changes have been discarded",
      variant: "destructive",
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Update local state
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      // If the deleted note was selected, select the first note
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
      }
      
      toast({
        title: "Note deleted",
        description: "The note has been permanently removed",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error deleting note",
        description: "There was a problem deleting the note. Please try again.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1">
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Your Notes</h1>
            <p className="text-muted-foreground">View and manage your notes from recordings</p>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Notes List</CardTitle>
                    <CardDescription>Select a note to view</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                      {filteredNotes().length > 0 ? (
                        filteredNotes().map((note) => (
                          <div
                            key={note.id}
                            className={`p-4 cursor-pointer border-l-4 ${
                              selectedNote?.id === note.id
                                ? "border-primary bg-accent/20"
                                : "border-transparent hover:bg-accent/10"
                            }`}
                            onClick={() => setSelectedNote(note)}
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{note.title}</h3>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                  "h-8 w-8 animate-spin-hover", 
                                  note.is_favorite && "text-yellow-500"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(note.id);
                                }}
                              >
                                <Star 
                                  className={cn(
                                    "h-4 w-4", 
                                    note.is_favorite ? "fill-yellow-500" : ""
                                  )} 
                                />
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatDate(note.created_at)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p>No notes found in this category</p>
                          <p className="text-sm mt-2">Try recording a lecture first!</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => window.location.href = '/record'}
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Record a Lecture
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedNote ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedNote.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {formatDate(selectedNote.created_at)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isEditing ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 animate-fade-in"
                                onClick={handleEdit}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-destructive animate-fade-in"
                                onClick={() => handleDeleteNote(selectedNote.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-destructive animate-fade-in"
                                onClick={handleCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-primary animate-fade-in"
                                onClick={handleSave}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-9 w-9 animate-spin-hover", 
                              selectedNote.is_favorite && "text-yellow-500 favorite-star active"
                            )}
                            onClick={() => toggleFavorite(selectedNote.id)}
                          >
                            <Star 
                              className={cn(
                                "h-5 w-5", 
                                selectedNote.is_favorite ? "fill-yellow-500" : ""
                              )} 
                            />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      <ScrollArea className="h-[50vh]">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {isEditing ? (
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[40vh] w-full p-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                              placeholder="Edit your note content here..."
                            />
                          ) : (
                            <p>{selectedNote.content}</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex items-center justify-center h-[60vh]">
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">Select a note to view its content</p>
                      {notes.length === 0 && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.location.href = '/record'}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Record a Lecture
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
