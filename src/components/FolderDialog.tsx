import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, ChevronRight, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderDialog({ open, onOpenChange, onSelectFolder }: FolderDialogProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const { toast } = useToast();
  const { folders, addFolder, deleteFolder } = useData();
  
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await addFolder({
          name: newFolderName,
          parent_id: currentFolder,
        });
        
        setNewFolderName("");
        setShowNewFolderInput(false);
        
        toast({
          title: "Folder Created",
          description: `'${newFolderName}' folder created successfully`,
        });
      } catch (error) {
        console.error("Error creating folder:", error);
        toast({
          title: "Error",
          description: "Failed to create folder",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      await deleteFolder(folder.id);
      setFolderToDelete(null);
      
      toast({
        title: "Folder Deleted",
        description: `'${folder.name}' folder has been deleted`,
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  };
  
  const handleSelectFolder = (id: string | null) => {
    onSelectFolder(id);
    onOpenChange(false);
  };
  
  const getCurrentFolderName = () => {
    if (!currentFolder) return "Root";
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : "Root";
  };
  
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };
  
  const getCurrentSubfolders = () => {
    return folders.filter(folder => folder.parent_id === currentFolder);
  };
  
  const getParentFolder = () => {
    if (!currentFolder) return null;
    const current = folders.find(f => f.id === currentFolder);
    return current ? current.parent_id : null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Folder</DialogTitle>
            <DialogDescription>
              Select a folder to save your recording or create a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center mb-4 text-sm text-muted-foreground">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateToFolder(null)}
                className="px-2"
              >
                Root
              </Button>
              
              {currentFolder && (
                <>
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {}}
                    className="px-2"
                  >
                    {getCurrentFolderName()}
                  </Button>
                </>
              )}
            </div>
            
            {currentFolder !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToFolder(getParentFolder())}
                className="mb-2"
              >
                ← Go Back
              </Button>
            )}
            
            <div className="space-y-2 max-h-52 overflow-y-auto border rounded-md p-2">
              {getCurrentSubfolders().length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No folders here. Create a new folder to organize your recordings.
                </div>
              ) : (
                getCurrentSubfolders().map(folder => (
                  <div key={folder.id} className="flex justify-between items-center">
                    <div 
                      className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer w-full"
                      onClick={() => navigateToFolder(folder.id)}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      <span>{folder.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectFolder(folder.id)}
                      >
                        Select
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFolderToDelete(folder)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {showNewFolderInput ? (
              <div className="mt-4 space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateFolder();
                }}>
                  <div className="flex gap-2">
                    <Input 
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowNewFolderInput(false);
                        }
                      }}
                      autoFocus
                    />
                    <Button type="submit" size="sm">Create</Button>
                  </div>
                </form>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNewFolderInput(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolderInput(true)}
                className="mt-4"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the folder "{folderToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFolderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => folderToDelete && handleDeleteFolder(folderToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
