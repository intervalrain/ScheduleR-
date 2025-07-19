"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTaskRefresh } from "@/context/TaskContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";

interface DeleteTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  task: {
    id: string;
    title: string;
  } | null;
  onTaskDeleted?: () => void;
}

export function DeleteTaskDialog({
  isOpen,
  setIsOpen,
  task,
  onTaskDeleted,
}: DeleteTaskDialogProps) {
  const { data: session } = useSession();
  const { triggerRefresh, markTaskAsDeleted } = useTaskRefresh();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!task || !session) {
      console.log('Cannot delete task: missing task or session');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Attempting to delete task:', task.id);
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Task deleted successfully:', result);
        
        // Mark task as deleted immediately (for instant UI updates)
        markTaskAsDeleted(task.id);
        
        // Close dialog immediately
        setIsOpen(false);
        
        // Call the callback first
        if (onTaskDeleted) {
          onTaskDeleted();
        }
        
        // Trigger global refresh after a short delay
        setTimeout(() => {
          triggerRefresh();
        }, 200);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Failed to delete task:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        alert(`Failed to delete task: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error deleting task:', error);
      alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-destructive" />
            Delete Task
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The task and all its associated data will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        
        {!session && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800">Preview Mode</h4>
                <p className="text-xs text-amber-700">
                  You're viewing the delete confirmation. Sign in to delete actual tasks.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Are you sure you want to delete this task?
          </p>
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium text-sm">{task?.title}</h4>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || !session}
          >
            {!session ? "Preview Mode" : isDeleting ? "Deleting..." : "Delete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}