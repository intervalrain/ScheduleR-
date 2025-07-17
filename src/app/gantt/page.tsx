"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  priority?: string;
  subtasks?: { id: string; isCompleted: boolean }[];
}

// Helper function to calculate position and width
const getTaskPosition = (startDate: Date, endDate: Date, chartStartDate: Date, chartEndDate: Date, chartWidth: number) => {
  const totalDays = Math.ceil((chartEndDate.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const startDays = Math.ceil((startDate.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const left = (startDays / totalDays) * chartWidth;
  const width = (duration / totalDays) * chartWidth;
  
  return { left: Math.max(0, left), width: Math.max(10, width) };
};

export default function GanttPage() {
  const { refreshTrigger } = useTaskRefresh();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('Month');

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, fetch all tasks with any status
      // In a real app, you might want to filter by sprint
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const taskData = await response.json();
        
        // Fetch subtasks for each task to calculate completion
        const tasksWithSubtasks = await Promise.all(
          taskData.map(async (task: Task) => {
            try {
              const subtasksResponse = await fetch(`/api/tasks/${task.id}/subtasks`);
              if (subtasksResponse.ok) {
                const subtasks = await subtasksResponse.json();
                const completedSubtasks = subtasks.filter((st: any) => st.isCompleted).length;
                const totalSubtasks = subtasks.length;
                const calculatedProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                
                return {
                  ...task,
                  subtasks,
                  progress: calculatedProgress
                };
              }
              return { ...task, subtasks: [], progress: 0 };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.id}:`, error);
              return { ...task, subtasks: [], progress: 0 };
            }
          })
        );
        
        setTasks(tasksWithSubtasks);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      // Fallback to mock data with current dates
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      setTasks([
        {
          id: "task1",
          title: "Redesign website",
          status: "IN_PROGRESS",
          startDate: formatDate(today),
          endDate: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)),
          progress: 50,
          estimateHours: 40,
          priority: "500000"
        },
        {
          id: "task2", 
          title: "Develop backend API",
          status: "IN_PROGRESS",
          startDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000)),
          progress: 30,
          estimateHours: 60,
          priority: "600000"
        },
        {
          id: "task3",
          title: "Deploy to production", 
          status: "TODO",
          startDate: formatDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000)),
          progress: 0,
          estimateHours: 20,
          priority: "700000"
        },
        {
          id: "task4",
          title: "Testing & QA",
          status: "TODO",
          startDate: formatDate(new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
          progress: 0,
          estimateHours: 25,
          priority: "800000"
        },
        {
          id: "task5",
          title: "User Documentation",
          status: "DONE",
          startDate: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
          progress: 100,
          estimateHours: 15,
          priority: "400000"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  // Calculate chart date range
  const getChartDateRange = () => {
    if (tasks.length === 0) return { start: new Date(), end: new Date() };
    
    const dates = tasks.flatMap(task => [
      task.startDate ? new Date(task.startDate) : new Date(),
      task.endDate ? new Date(task.endDate) : new Date()
    ]);
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add some padding
    const paddingDays = 7;
    minDate.setDate(minDate.getDate() - paddingDays);
    maxDate.setDate(maxDate.getDate() + paddingDays);
    
    return { start: minDate, end: maxDate };
  };

  // Generate time headers based on view mode
  const generateTimeHeaders = (startDate: Date, endDate: Date) => {
    const headers: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (viewMode === 'Day') {
        headers.push(current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'Week') {
        headers.push(`Week ${Math.ceil(current.getDate() / 7)}`);
        current.setDate(current.getDate() + 7);
      } else { // Month
        headers.push(current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return headers;
  };

  // Sort tasks by status and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusPriority = { 'DONE': 1, 'IN_PROGRESS': 2, 'REVIEW': 3, 'TODO': 4 };
    const aStatusPriority = statusPriority[a.status as keyof typeof statusPriority] || 5;
    const bStatusPriority = statusPriority[b.status as keyof typeof statusPriority] || 5;
    
    if (aStatusPriority !== bStatusPriority) {
      return aStatusPriority - bStatusPriority;
    }
    
    const aPriority = parseInt(a.priority || '1000000');
    const bPriority = parseInt(b.priority || '1000000');
    return aPriority - bPriority;
  });

  const chartDateRange = getChartDateRange();
  const timeHeaders = generateTimeHeaders(chartDateRange.start, chartDateRange.end);

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
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Week">Week</SelectItem>
                  <SelectItem value="Month">Month</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchTasks} variant="outline" size="sm">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
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
              <div className="min-w-full">
                {/* Gantt Chart Header */}
                <div className="flex border-b">
                  <div className="w-64 p-3 border-r bg-gray-50 font-semibold">
                    Task Name
                  </div>
                  <div className="flex-1 grid grid-cols-12 min-w-[800px]">
                    {timeHeaders.map((header, index) => (
                      <div key={index} className="p-2 text-center text-sm font-medium border-r bg-gray-50">
                        {header}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Gantt Chart Body */}
                <div className="min-h-[400px]">
                  {sortedTasks.map((task, taskIndex) => {
                    const startDate = task.startDate ? new Date(task.startDate) : new Date();
                    const endDate = task.endDate ? new Date(task.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                    const position = getTaskPosition(startDate, endDate, chartDateRange.start, chartDateRange.end, 800);
                    
                    const statusColor = 
                      task.status === 'DONE' ? 'bg-green-500' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      task.status === 'REVIEW' ? 'bg-yellow-500' :
                      'bg-gray-400';
                    
                    return (
                      <div key={task.id} className={`flex border-b ${taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <div className="w-64 p-3 border-r">
                          <div className="font-medium text-sm truncate">{task.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.progress}% complete
                          </div>
                        </div>
                        <div className="flex-1 relative min-w-[800px] h-12">
                          <div 
                            className={`absolute top-2 h-8 ${statusColor} rounded flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                            style={{
                              left: `${position.left}px`,
                              width: `${position.width}px`
                            }}
                            onClick={() => window.location.href = `/workspace/${task.id}`}
                            title={`${task.title} (${task.progress}%)`}
                          >
                            {task.progress > 0 && (
                              <div 
                                className="absolute left-0 top-0 h-full bg-green-600 rounded-l"
                                style={{ width: `${task.progress}%` }}
                              />
                            )}
                            <span className="relative z-10 px-2 truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.reduce((sum, task) => sum + (task.estimateHours || 0), 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'Done').length / tasks.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}