import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { 
  AlertTriangle, 
  Check, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Save,
  FolderPlus,
  Trash2,
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  Volume2,
  Upload
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/contexts/ThemeContext";
import { useData } from "@/contexts/DataContext";
import type { Database } from "@/lib/supabase";
type Recording = Database['public']['Tables']['recordings']['Row'];
import { 
  getMediaStream, 
  createMediaRecorder,
  generateAudioBlob,
  createFallbackAudioBlob,
  convertAudioToCompatibleFormat,
  processAudioForCompatibility,
  handleAudioFileUpload,
} from "@/utils/recordingUtils";
import { FolderDialog } from "@/components/FolderDialog";
import { AudioPlayer } from "@/components/AudioPlayer";
import { formatTime } from "@/utils/formatUtils";
import { MicrophonePermissionDialog } from "@/components/MicrophonePermissionDialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSettings, isConfigured as checkIsConfigured } from "@/contexts/SettingsContext";
import { useNavigate } from "react-router-dom";
import { transcribeAudioWithSDK } from "@/utils/assemblyAIUtils";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const RecordPage = () => {
  // Get data context
  const { recordings, addRecording, deleteRecording, isLoading, error } = useData();
  
  // State for recording functionality
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFormat, setAudioFormat] = useState<string>('webm');
  const [audioMetadata, setAudioMetadata] = useState<any>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micPermissionDialog, setMicPermissionDialog] = useState<{
    open: boolean;
    errorType: "permission-denied" | "not-found" | "in-use" | "other";
  }>({
    open: false,
    errorType: "other"
  });
  
  // State for UI
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [uploadedTranscription, setUploadedTranscription] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingNotes, setRecordingNotes] = useState("");
  const [showRecordings, setShowRecordings] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { colorScheme } = useTheme();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();

  // State declarations at the top
  const [folderName, setFolderName] = useState<string>("");
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});
  
  // First define recordingsByFolder
  const recordingsByFolder = recordings.reduce((acc, recording) => {
    const folderId = recording.folder_id || 'default';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(recording);
    return acc;
  }, {} as Record<string, typeof recordings>);

  // Then define getFolderName and the effect that uses it
  const getFolderName = async (folderId: string) => {
    try {
      const { data: folder } = await supabase
        .from('folders')
        .select('name')
        .eq('id', folderId)
        .single();
      
      const name = folder?.name || 'Unnamed Folder';
      setFolderNames(prev => ({ ...prev, [folderId]: name }));
      return name;
    } catch (error) {
      console.error('Error getting folder name:', error);
      return 'Unnamed Folder';
    }
  };

  useEffect(() => {
    Object.keys(recordingsByFolder).forEach(folderId => {
      if (!folderNames[folderId]) {
        getFolderName(folderId);
      }
    });
  }, [recordingsByFolder]);

  useEffect(() => {
    // Use IIFE for async operations
    (async () => {
      try {
        // Use the static method
        setIsConfigured(checkIsConfigured());
      } catch (error) {
        console.error("Error checking configuration status:", error);
        setIsConfigured(false);
      }
    })();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handlePlayRecording = (recordingId: string) => {
    setSelectedRecording(recordings.find(r => r.id === recordingId) || null);
  };

  const startRecording = async () => {
    if (!recordingTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for the recording",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Starting recording process...");
      
      setAudioBlob(null);
      audioChunksRef.current = [];
      setIsFallbackMode(false);
      
      console.log("Requesting microphone access...");
      let stream: MediaStream | null = null;
      
      try {
        stream = await getMediaStream();
        console.log("Microphone access granted");
      } catch (micError) {
        console.warn("Failed to get microphone, using fallback mode:", micError);
        setIsFallbackMode(true);
        if (micError instanceof Error) {
          toast({
            title: "Using Fallback Mode",
            description: "Recording in fallback mode due to browser limitations",
            variant: "default",
          });
        }
      }
      
      if (!isFallbackMode && stream) {
        try {
          // Create MediaRecorder with specific MIME type for better compatibility
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm';

          mediaRecorderRef.current = createMediaRecorder(stream, (event: BlobEvent) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          });
          
          // Start recording
          mediaRecorderRef.current.start();
          setIsRecording(true);
          setIsPaused(false);
          
          // Start timer
          intervalRef.current = setInterval(() => {
            setRecordingTime((prevTime) => prevTime + 1);
          }, 1000);
          
          toast({
            title: "Recording Started",
            description: "Your recording has begun",
            variant: "default",
          });
        } catch (error) {
          console.error("Error setting up MediaRecorder:", error);
          setIsFallbackMode(true);
          toast({
            title: "Recording Error",
            description: "Failed to start recording. Using fallback mode.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Recording start error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('microphone-permission-denied')) {
        console.log("Microphone permission denied, showing dialog");
        setMicPermissionDialog({
          open: true,
          errorType: "permission-denied"
        });
      } else if (errorMessage.includes('microphone-not-found')) {
        console.log("Microphone not found, showing dialog");
        setMicPermissionDialog({
          open: true,
          errorType: "not-found"
        });
      } else if (errorMessage.includes('microphone-in-use')) {
        console.log("Microphone in use, showing dialog");
        setMicPermissionDialog({
          open: true,
          errorType: "in-use"
        });
      } else {
        console.log("Unknown microphone error, showing dialog");
        setMicPermissionDialog({
          open: true,
          errorType: "other"
        });
        
        toast({
          title: "Error",
          description: error.message || "An error occurred while processing the recording",
          variant: "destructive",
        });
      }
    }
  };
  
  const pauseRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {
        console.warn("Error pausing recorder:", e);
      }
    }
    
    setIsPaused(true);
    
    toast({
      title: "Recording Paused",
      description: "Your recording has been paused",
    });
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (e) {
        console.warn("Error resuming recorder:", e);
      }
    }
    
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    intervalRef.current = interval;
    
    setIsPaused(false);
    
    toast({
      title: "Recording Resumed",
      description: "Your recording has been resumed",
    });
  };
  
  const stopRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Set up the onstop handler before stopping
        mediaRecorderRef.current.onstop = () => {
          console.log("MediaRecorder stopped, creating audio blob");
          if (audioChunksRef.current.length > 0) {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm;codecs=opus';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log(`Created audio blob with size ${audioBlob.size} bytes and type ${mimeType}`);
            setAudioBlob(audioBlob);
            setAudioFormat(mimeType.includes('webm') ? 'webm' : 'mp3');
            // Open save dialog instead of folder dialog since we don't need to select a folder yet
            setShowSaveDialog(true);
          } else {
            console.warn("No audio chunks recorded, using fallback blob");
            setAudioBlob(createFallbackAudioBlob());
            setAudioFormat('mp3');
            setShowSaveDialog(true);
          }
        };
        
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stopped successfully");
      } catch (e) {
        console.warn("Error stopping recorder:", e);
        // Only use fallback if there's an actual error
        setAudioBlob(createFallbackAudioBlob());
        setAudioFormat('mp3');
        setShowSaveDialog(true);
      }
    } else if (isFallbackMode) {
      // If we're in fallback mode and no MediaRecorder exists
      console.warn("Using fallback blob because we're in fallback mode");
      setAudioBlob(createFallbackAudioBlob());
      setAudioFormat('mp3');
      setShowSaveDialog(true);
    }
    
    setIsRecording(false);
    setIsPaused(false);
  };
  
  const resetRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder for reset:", e);
      }
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset all recording-related state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setRecordingTitle("");
    setRecordingNotes("");
    audioChunksRef.current = [];
    setAudioBlob(null);
    setIsFallbackMode(false);
    mediaRecorderRef.current = null;
    
    toast({
      title: "Recording Cleared",
      description: "Your recording data has been cleared",
    });
  };

  const handleSaveRecording = async (folderId: string) => {
    try {
      if (!audioBlob) {
        toast({
          title: "Error",
          description: "No audio recording found.",
          variant: "destructive"
        });
        return;
      }

      setIsSaving(true);
      toast({
        title: "Transcribing",
        description: "Your recording is being transcribed...",
      });

      // Get the transcription from AssemblyAI
      const transcriptionResult = await transcribeAudioWithSDK(audioBlob, settings.assemblyAIKey);
      
      if (!transcriptionResult) {
        toast({
          title: "Error",
          description: "Failed to transcribe the recording.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Create the recording object
      const recording = {
        title: recordingTitle,
        transcript: transcriptionResult.text,
        folder_id: folderId,
        summary: recordingNotes || null,
        keywords: [] as string[] | null
      };

      // Add the recording to the database
      const savedRecording = await addRecording(recording);

      // Create a note with the transcription
      const note = {
        title: recordingTitle,
        content: transcriptionResult.text,
        is_favorite: false,
        folder_id: folderId,
        recording_id: savedRecording.id
      };

      // Save the note to the database
      const { data: savedNote, error: noteError } = await supabase
        .from('notes')
        .insert(note)
        .select()
        .single();

      if (noteError) {
        console.error("Error saving note:", noteError);
        toast({
          title: "Warning",
          description: "Recording saved but note creation failed.",
          variant: "default"
        });
      }

      toast({
        title: "Success",
        description: "Recording and transcription saved successfully!",
      });

      // Reset all recording state after successful save
      resetRecording();
      setShowSaveDialog(false);
      setIsSaving(false);
    } catch (error) {
      console.error("Error saving recording:", error);
      toast({
        title: "Error",
        description: "Failed to save the recording.",
        variant: "destructive"
      });
      setIsSaving(false);
    }
  };
  
  const restartRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder for restart:", e);
      }
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setRecordingTime(0);
    audioChunksRef.current = [];
    
    await startRecording();
    
    toast({
      title: "Recording Restarted",
      description: "Your recording has been restarted"
    });
  };

  // Update folderName when currentFolder changes
  useEffect(() => {
    if (currentFolder) {
      getFolderName(currentFolder).then(name => setFolderName(name));
    } else {
      setFolderName("");
    }
  }, [currentFolder]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        try {
          const result = await handleAudioFileUpload(file);
          if (result.audioUrl) {
            const response = await fetch(result.audioUrl);
            const blob = await response.blob();
            setAudioBlob(blob);
            setAudioFormat(result.format);
            setShowSaveDialog(true);
          }
        } catch (error) {
          console.error("Error processing dropped file:", error);
          toast({
            title: "Error",
            description: "Failed to process the audio file.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invalid File",
          description: "Please drop an audio file.",
          variant: "destructive"
        });
      }
    }
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="p-6">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">Record Lecture</h1>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                  <p className="text-lg text-foreground">Loading recordings...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="p-6">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">Record Lecture</h1>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-lg text-foreground mb-2">Failed to load recordings</p>
                  <p className="text-sm text-muted-foreground mb-6">{error.message}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Record Lecture</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  resetRecording(); // Reset recording state when switching views
                  setShowRecordings(!showRecordings);
                }}
                className="flex items-center gap-2"
              >
                {showRecordings ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {showRecordings ? "New Recording" : "My Recordings"}
              </Button>
            </div>
          </div>

          {showRecordings ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">My Recordings</CardTitle>
                <CardDescription>Manage your saved recordings</CardDescription>
              </CardHeader>
              <CardContent>
                {recordings.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2 text-foreground">No Recordings Yet</p>
                    <p className="text-muted-foreground mb-4">
                      Start recording to create transcripts of your lectures.
                    </p>
                    <Button 
                      onClick={() => setShowRecordings(false)}
                      className="flex items-center gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Create New Recording
                    </Button>
                  </div>
                ) : (
                  <Accordion type="multiple" defaultValue={Array.from(expandedFolders)}>
                    {Object.entries(recordingsByFolder).map(([folderId, folderRecordings]) => (
                      <AccordionItem key={folderId} value={folderId}>
                        <AccordionTrigger className="hover:no-underline text-foreground">
                          <div className="flex items-center">
                            <Folder className="h-4 w-4 mr-2 text-primary" />
                            <span>{folderNames[folderId] || 'Loading...'}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({folderRecordings.length})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 space-y-4">
                            {folderRecordings.map((recording) => (
                              <div 
                                key={recording.id} 
                                className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow">
                                    <h3 className="font-medium text-foreground">{recording.title}</h3>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {formatDate(recording.created_at)} • {formatTime(recordingTime)}
                                    </div>
                                    {recording.summary && (
                                      <p className="text-sm mt-2 text-foreground/80">{recording.summary}</p>
                                    )}
                                    {recording.transcript && (
                                      <div className="mt-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                          <FileText className="h-4 w-4" />
                                          Transcription
                                        </div>
                                        <div className="bg-accent/10 p-3 rounded-md">
                                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                            {recording.transcript}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 ml-4"
                                    onClick={async () => {
                                      try {
                                        if (selectedRecording && selectedRecording.id === recording.id) {
                                          setSelectedRecording(null);
                                        }
                                        await deleteRecording(recording.id);
                                        toast({
                                          title: "Recording Deleted",
                                          description: "The recording and its transcription have been permanently removed.",
                                        });
                                      } catch (error) {
                                        console.error('Failed to delete recording:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to delete the recording. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-foreground">Recording Information</CardTitle>
                  <CardDescription>Provide details about the lecture you are recording</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="recording-title" className="block text-sm font-medium text-foreground/80 mb-1">
                      Recording Title
                    </label>
                    <Input
                      id="recording-title"
                      type="text"
                      placeholder="Enter a title for your recording"
                      value={recordingTitle}
                      onChange={(e) => setRecordingTitle(e.target.value)}
                      disabled={isRecording}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="recording-notes" className="block text-sm font-medium text-foreground/80 mb-1">
                      Notes
                    </label>
                    <Textarea
                      id="recording-notes"
                      placeholder="Add any notes about this recording"
                      value={recordingNotes}
                      onChange={(e) => setRecordingNotes(e.target.value)}
                      disabled={isRecording}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-foreground">Record or Upload Audio</CardTitle>
                  <CardDescription>Start a new recording or upload an existing audio file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {!isRecording && !uploadedFile ? (
                      <>
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 mb-4 mx-auto">
                          <Mic className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-lg mb-6">Drag and drop an audio file here or</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            variant="default"
                            size="lg"
                            className="bg-primary hover:bg-primary/90 flex items-center gap-2 hover-glow" 
                            onClick={startRecording}
                          >
                            <Mic className="h-4 w-4" />
                            Start Recording
                          </Button>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            id="audio-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFile(file);
                                try {
                                  const result = await handleAudioFileUpload(file);
                                  if (result.audioUrl) {
                                    const response = await fetch(result.audioUrl);
                                    const blob = await response.blob();
                                    setAudioBlob(blob);
                                    setAudioFormat(result.format);
                                    setShowSaveDialog(true);
                                  }
                                } catch (error) {
                                  console.error("Error processing uploaded file:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to process the audio file.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="lg"
                            className="flex items-center gap-2 hover-glow"
                            onClick={() => document.getElementById('audio-upload')?.click()}
                          >
                            <Upload className="h-4 w-4" />
                            Upload Audio
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 mb-4 relative">
                          <div className={`absolute inset-0 rounded-full bg-primary/30 ${isPaused ? '' : 'animate-pulse'} opacity-50`}></div>
                          <div className="z-10 text-primary font-mono text-xl font-semibold">
                            {formatTime(recordingTime)}
                          </div>
                        </div>
                        
                        <div className="w-full max-w-md mb-6">
                          <Progress value={100} className="h-2" />
                        </div>
                        
                        <p className={`text-${isPaused ? 'accent' : 'primary'} font-medium text-lg mb-4`}>
                          {isPaused ? 'Recording paused' : 'Recording for transcription...'}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 justify-center mb-6">
                          {isPaused ? (
                            <Button 
                              variant="default"
                              size="lg"
                              className="bg-primary hover:bg-primary/90 flex items-center gap-2 hover-glow" 
                              onClick={resumeRecording}
                            >
                              <Play className="h-4 w-4" />
                              Resume
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              size="lg"
                              className="flex items-center gap-2 hover-glow" 
                              onClick={pauseRecording}
                            >
                              <Pause className="h-4 w-4" />
                              Pause
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline"
                            size="lg"
                            className="flex items-center gap-2 hover-glow" 
                            onClick={restartRecording}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restart
                          </Button>
                          
                          <Button 
                            variant="destructive"
                            size="lg"
                            className="flex items-center gap-2 hover-glow" 
                            onClick={stopRecording}
                          >
                            <Square className="h-4 w-4" />
                            Stop & Transcribe
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {!isRecording && !uploadedFile && (
                    <div className="mt-8 bg-accent/10 border border-accent/20 rounded-md p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-primary/80 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Before you start</h4>
                          <p className="text-sm text-foreground/80 mt-1">
                            Make sure you have permission to record and that your microphone is working properly.
                            You can also upload existing audio files for transcription.
                            Your recording will be transcribed and saved to your database. Audio storage is not available.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isRecording && isConfigured && (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                      <div className="flex items-start">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">API Keys Configured</h4>
                          <p className="text-sm text-foreground/80 mt-1">
                            AssemblyAI API key is configured. Your recordings will be automatically transcribed and saved to your database.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
      
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording</DialogTitle>
            <DialogDescription>
              Enter a title for your recording and select a folder to save it in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={recordingNotes}
                onChange={(e) => setRecordingNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Folder</Label>
              <div className="col-span-3 flex items-center gap-2">
                <span className="flex-grow text-muted-foreground">
                  {currentFolder ? folderName : 'Select a folder'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFolderDialogOpen(true)}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Choose Folder
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (!currentFolder) {
                    toast({
                      title: "Error",
                      description: "Please select a folder first.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsSaving(true);
                  await handleSaveRecording(currentFolder);
                  setShowSaveDialog(false);
                  toast({
                    title: "Success",
                    description: "Recording saved successfully",
                  });
                } catch (error) {
                  console.error("Error saving recording:", error);
                  toast({
                    title: "Error",
                    description: "Failed to save recording. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={!recordingTitle || !currentFolder || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Recording'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSelectFolder={(folderId) => {
          setCurrentFolder(folderId);
          setFolderDialogOpen(false);
        }}
      />
      
      <MicrophonePermissionDialog
        open={micPermissionDialog.open}
        onOpenChange={(open) => {
          setMicPermissionDialog({
            ...micPermissionDialog,
            open: open
          });
        }}
        errorType={micPermissionDialog.errorType}
        onRetry={() => {
          setMicPermissionDialog({
            ...micPermissionDialog,
            open: false
          });
          setTimeout(() => {
            startRecording();
          }, 500);
        }}
      />
    </div>
  );
};

export default RecordPage;
