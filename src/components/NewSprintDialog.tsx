"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

interface NewSprintDialogProps {
  onSprintCreated?: () => void;
}

export function NewSprintDialog({ onSprintCreated }: NewSprintDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [sprintType, setSprintType] = useState<'PROJECT' | 'CASUAL'>('PROJECT');
  const [customWorkDays, setCustomWorkDays] = useState<number[]>([]);
  const [customWorkHours, setCustomWorkHours] = useState({ start: '', end: '' });
  const [error, setError] = useState<string | null>(null);

  // Default work configurations based on sprint type
  const getDefaultWorkConfig = (type: 'PROJECT' | 'CASUAL') => {
    if (type === 'PROJECT') {
      return {
        workDays: [1, 2, 3, 4, 5], // Mon-Fri
        workHours: { start: '08:30', end: '17:30' }
      };
    } else {
      return {
        workDays: [1, 2, 3, 4, 5, 6, 7], // All days
        workHours: { start: '00:00', end: '23:59' }
      };
    }
  };

  const currentWorkConfig = getDefaultWorkConfig(sprintType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Disable creation when not authenticated
    if (!session) {
      console.log('Not authenticated, sprint creation disabled');
      return;
    }
    
    if (!name.trim()) {
      setError("Sprint name is required");
      return;
    }
    
    if (!startDate || !endDate) {
      setError("Both start date and end date are required");
      return;
    }
    
    if (startDate >= endDate) {
      setError("End date must be after start date");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const workDays = customWorkDays.length > 0 ? customWorkDays : currentWorkConfig.workDays;
      const workHours = (customWorkHours.start && customWorkHours.end) ? customWorkHours : currentWorkConfig.workHours;
      
      console.log('Creating sprint:', {
        name: name.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: sprintType,
        defaultWorkDays: workDays,
        defaultWorkHours: workHours,
      });
      
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: sprintType,
          defaultWorkDays: workDays,
          defaultWorkHours: workHours,
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create sprint');
      }
      
      // Reset form and close dialog
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
      setSprintType('PROJECT');
      setCustomWorkDays([]);
      setCustomWorkHours({ start: '', end: '' });
      setOpen(false);
      
      // Trigger callback to refresh sprints
      if (onSprintCreated) {
        onSprintCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Sprint</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new sprint</DialogTitle>
            <DialogDescription>
              Enter the details of the new sprint.
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
                    You're viewing the sprint creation form. Sign in to create actual sprints.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sprint Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sprint 1, Development Sprint"
                disabled={isLoading || !session}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker 
                  date={startDate}
                  onDateChange={session ? setStartDate : () => {}}
                  placeholder="Select start date"
                  disabled={!session}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <DatePicker 
                  date={endDate}
                  onDateChange={session ? setEndDate : () => {}}
                  placeholder="Select end date"
                  disabled={!session}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sprintType">Sprint Type</Label>
                <Select value={sprintType} onValueChange={session ? (value: 'PROJECT' | 'CASUAL') => setSprintType(value) : () => {}} disabled={!session}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sprint type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROJECT">Project Management</SelectItem>
                    <SelectItem value="CASUAL">Casual Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Work Schedule Preview</CardTitle>
                  <CardDescription className="text-xs">
                    Default schedule for {sprintType === 'PROJECT' ? 'project management' : 'casual management'} sprints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Work Days:</span>{' '}
                    {sprintType === 'PROJECT' ? 'Monday - Friday' : 'All Days (Monday - Sunday)'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Work Hours:</span>{' '}
                    {sprintType === 'PROJECT' ? '08:30 - 17:30' : '24/7 (All Hours)'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !session}>
              {!session ? "Preview Mode" : isLoading ? "Creating..." : "Create Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
