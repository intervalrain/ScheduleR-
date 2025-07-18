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
  createdAt?: string;
  estimatedHours?: number;
  progress?: number;
  dependsOn?: { id: string }[];
  priority?: string;
  subtasks?: { id: string; isCompleted: boolean }[];
  // Generated fields for Gantt visualization
  startDate?: string;
  endDate?: string;
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
        
        // Process tasks with subtasks and generate Gantt dates
        const tasksWithSubtasks = await Promise.all(
          taskData.map(async (task: Task, index: number) => {
            try {
              const subtasksResponse = await fetch(`/api/tasks/${task.id}/subtasks`);
              let subtasks = [];
              let calculatedProgress = 0;
              
              if (subtasksResponse.ok) {
                subtasks = await subtasksResponse.json();
                const completedSubtasks = subtasks.filter((st: any) => st.isCompleted).length;
                const totalSubtasks = subtasks.length;
                calculatedProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
              }
              
              // Generate start and end dates for Gantt visualization
              const baseDate = new Date();
              const estimatedDays = Math.max(1, Math.ceil((task.estimatedHours || 8) / 8)); // Convert hours to days
              
              // Stagger tasks based on status and priority
              let startOffset = 0;
              if (task.status === 'DONE') {
                startOffset = -7; // Completed tasks start a week ago
              } else if (task.status === 'IN_PROGRESS') {
                startOffset = -2; // In progress tasks started 2 days ago
              } else if (task.status === 'REVIEW') {
                startOffset = Math.floor(estimatedDays / 2); // Review tasks start mid-way
              } else {
                startOffset = index * 2; // TODO tasks start with 2-day intervals
              }
              
              const startDate = new Date(baseDate.getTime() + startOffset * 24 * 60 * 60 * 1000);
              const endDate = new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
              
              return {
                ...task,
                subtasks,
                progress: calculatedProgress,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
              };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.id}:`, error);
              
              // Fallback date generation
              const baseDate = new Date();
              const estimatedDays = Math.max(1, Math.ceil((task.estimatedHours || 8) / 8));
              const startDate = new Date(baseDate.getTime() + index * 2 * 24 * 60 * 60 * 1000);
              const endDate = new Date(startDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
              
              return { 
                ...task, 
                subtasks: [], 
                progress: 0,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
              };
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
          estimatedHours: 40,
          priority: "500000"
        },
        {
          id: "task2", 
          title: "Develop backend API",
          status: "IN_PROGRESS",
          startDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000)),
          progress: 30,
          estimatedHours: 60,
          priority: "600000"
        },
        {
          id: "task3",
          title: "Deploy to production", 
          status: "TODO",
          startDate: formatDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000)),
          progress: 0,
          estimatedHours: 20,
          priority: "700000"
        },
        {
          id: "task4",
          title: "Testing & QA",
          status: "TODO",
          startDate: formatDate(new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
          progress: 0,
          estimatedHours: 25,
          priority: "800000"
        },
        {
          id: "task5",
          title: "User Documentation",
          status: "DONE",
          startDate: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
          endDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
          progress: 100,
          estimatedHours: 15,
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
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        headers.push(`${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        current.setDate(current.getDate() + 7);
      } else { // Month
        headers.push(current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
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
                  {tasks.filter(t => t.status === 'DONE').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div className="flex-1 relative min-w-[800px] bg-gray-50">
                    <div className="flex h-12 items-center">
                      {timeHeaders.map((header, index) => (
                        <div 
                          key={index} 
                          className="flex-1 text-center text-xs font-medium border-r px-1"
                          style={{ minWidth: `${800 / timeHeaders.length}px` }}
                        >
                          {header}
                        </div>
                      ))}
                    </div>
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
                          <div className="font-medium text-sm truncate" title={task.title}>
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.progress || 0}% complete • {task.estimatedHours || 0}h
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex-1 relative min-w-[800px] h-16">
                          {/* Background grid lines */}
                          {timeHeaders.map((_, index) => (
                            <div 
                              key={index}
                              className="absolute top-0 bottom-0 border-r border-gray-100"
                              style={{ left: `${(index / timeHeaders.length) * 100}%` }}
                            />
                          ))}
                          
                          {/* Task bar */}
                          <div 
                            className={`absolute top-4 h-8 ${statusColor} rounded shadow-sm flex items-center text-white text-xs font-medium cursor-pointer hover:shadow-md transition-all`}
                            style={{
                              left: `${position.left}px`,
                              width: `${Math.max(position.width, 60)}px`
                            }}
                            onClick={() => window.location.href = `/workspace/${task.id}`}
                            title={`${task.title}\nStart: ${startDate.toLocaleDateString()}\nEnd: ${endDate.toLocaleDateString()}\nProgress: ${task.progress || 0}%`}
                          >
                            {/* Progress overlay */}
                            {(task.progress || 0) > 0 && (
                              <div 
                                className="absolute left-0 top-0 h-full bg-green-600 rounded-l opacity-80"
                                style={{ width: `${task.progress || 0}%` }}
                              />
                            )}
                            
                            {/* Task text */}
                            <span className="relative z-10 px-2 truncate flex-1">
                              {position.width > 100 ? task.title : task.title.substring(0, 8) + '...'}
                            </span>
                            
                            {/* Progress percentage */}
                            {position.width > 60 && (
                              <span className="relative z-10 px-2 text-xs">
                                {task.progress || 0}%
                              </span>
                            )}
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
    </div>
  );
}