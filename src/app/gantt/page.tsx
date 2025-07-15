"use client";

import { useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCwIcon } from "lucide-react";
import { useTaskRefresh } from "@/context/TaskContext";

interface Task {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
  estimateHours?: number;
  progress?: number;
  dependsOn?: { id: string }[];
}

export default function GanttPage() {
  const ganttRef = useRef<HTMLDivElement>(null);
  const { refreshTrigger } = useTaskRefresh();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, fetch all tasks with any status
      // In a real app, you might want to filter by sprint
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const taskData = await response.json();
        setTasks(taskData);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      // Fallback to mock data
      setTasks([
        {
          id: "task1",
          title: "Redesign website",
          status: "Ongoing",
          startDate: "2024-07-01",
          endDate: "2024-07-15",
          progress: 50,
          estimateHours: 40,
        },
        {
          id: "task2", 
          title: "Develop backend API",
          status: "Ongoing",
          startDate: "2024-07-05",
          endDate: "2024-07-25",
          progress: 30,
          estimateHours: 60,
        },
        {
          id: "task3",
          title: "Deploy to production", 
          status: "Pending",
          startDate: "2024-07-20",
          endDate: "2024-07-30",
          progress: 0,
          estimateHours: 20,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  useEffect(() => {
    if (ganttRef.current && tasks.length > 0) {
      // Clear previous gantt instance
      ganttRef.current.innerHTML = '';
      
      // Convert tasks to Gantt format
      const ganttTasks = tasks.map(task => {
        const today = new Date();
        const startDate = task.startDate ? new Date(task.startDate) : today;
        const endDate = task.endDate ? new Date(task.endDate) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          id: task.id,
          name: task.title,
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          progress: task.progress || 0,
          dependencies: task.dependsOn?.map(dep => dep.id).join(',') || '',
        };
      });

      try {
        new Gantt(ganttRef.current, ganttTasks, {
          header_height: 50,
          column_width: 30,
          step: 24,
          // @ts-expect-error - frappe-gantt types are not compatible with string array
          view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
          bar_height: 20,
          bar_corner_radius: 3,
          arrow_curve: 5,
          padding: 18,
          date_format: "YYYY-MM-DD",
          language: "en",
          custom_popup_html: function(task: any) {
            return `
              <div class="bg-white p-3 rounded shadow-lg border">
                <h4 class="font-semibold">${task.name}</h4>
                <p class="text-sm text-gray-600">Progress: ${task.progress}%</p>
                <p class="text-sm text-gray-600">Duration: ${task.start} → ${task.end}</p>
              </div>
            `;
          },
          on_click: function (task: any) {
            console.log('Task clicked:', task);
            // Could navigate to workspace page
            // window.location.href = `/workspace/${task.id}`;
          },
          on_date_change: function (task: any, start: any, end: any) {
            console.log('Date changed:', task, start, end);
            // Could update task dates via API
          },
          on_progress_change: function (task: any, progress: any) {
            console.log('Progress changed:', task, progress);
            // Could update task progress via API
          },
          on_view_change: function (mode: any) {
            console.log('View changed to:', mode);
          },
        });
      } catch (error) {
        console.error('Error creating Gantt chart:', error);
      }
    }
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Gantt Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Gantt Chart
            </CardTitle>
            <Button onClick={fetchTasks} variant="outline" size="sm">
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground">Create some tasks to see them in the Gantt chart.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div ref={ganttRef} className="min-w-full"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Summary */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'Done').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'Ongoing').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}