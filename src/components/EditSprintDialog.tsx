"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, differenceInDays } from "date-fns";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface EditSprintDialogProps {
  sprint: Sprint | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSprintUpdated?: () => void;
}

export function EditSprintDialog({ 
  sprint, 
  isOpen, 
  setIsOpen, 
  onSprintUpdated 
}: EditSprintDialogProps) {
  const { data: session } = useSession();
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    duration: 14
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sprint && isOpen) {
      setEditForm({
        name: sprint.name,
        startDate: sprint.startDate.split('T')[0],
        endDate: sprint.endDate.split('T')[0],
        duration: differenceInDays(new Date(sprint.endDate), new Date(sprint.startDate)) + 1
      });
    }
  }, [sprint, isOpen]);

  const handleDurationChange = (duration: number) => {
    setEditForm(prev => {
      const startDate = new Date(prev.startDate);
      const endDate = addDays(startDate, duration - 1);
      return {
        ...prev,
        duration,
        endDate: endDate.toISOString().split('T')[0]
      };
    });
  };

  const handleSaveSprint = async () => {
    if (!sprint) return;
    
    // Disable saving when not authenticated
    if (!session) {
      console.log('Not authenticated, sprint editing disabled');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/sprints/${sprint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          startDate: new Date(editForm.startDate).toISOString(),
          endDate: new Date(editForm.endDate).toISOString()
        })
      });
      
      if (response.ok) {
        setIsOpen(false);
        if (onSprintUpdated) {
          onSprintUpdated();
        }
      } else {
        console.error('Failed to update sprint');
      }
    } catch (error) {
      console.error('Error updating sprint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sprint</DialogTitle>
          <DialogDescription>
            Modify sprint details and duration
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
                  You're viewing the sprint editing form. Sign in to make actual changes.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-3"
              disabled={!session}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={editForm.startDate}
              onChange={(e) => {
                if (session) {
                  setEditForm(prev => {
                    const startDate = new Date(e.target.value);
                    const endDate = addDays(startDate, prev.duration - 1);
                    return {
                      ...prev,
                      startDate: e.target.value,
                      endDate: endDate.toISOString().split('T')[0]
                    };
                  });
                }
              }}
              className="col-span-3"
              disabled={!session}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration
            </Label>
            <Select 
              value={editForm.duration.toString()} 
              onValueChange={session ? (value) => handleDurationChange(parseInt(value)) : () => {}}
              disabled={!session}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1 week (7 days)</SelectItem>
                <SelectItem value="14">2 weeks (14 days)</SelectItem>
                <SelectItem value="21">3 weeks (21 days)</SelectItem>
                <SelectItem value="30">1 month (30 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={editForm.endDate}
              onChange={(e) => {
                if (session) {
                  setEditForm(prev => ({ ...prev, endDate: e.target.value }));
                }
              }}
              className="col-span-3"
              disabled={!session}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSprint}
            disabled={isLoading || !session}
          >
            {!session ? "Preview Mode" : isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}