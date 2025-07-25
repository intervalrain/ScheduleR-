"use client";

import { useEffect, useState } from "react";
import { useSprint } from "@/context/SprintContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCwIcon } from "lucide-react";
import { useTaskRefresh } from "@/context/TaskContext";
import { Chart } from "react-google-charts";
import { getMockTasksBySprintId, getMockSubTasksByTaskId, mockBusyHours } from "@/lib/mockData";
import { useSession } from "next-auth/react";
import { addDays, differenceInDays, format } from "date-fns";
import { useSidebar } from "@/context/SidebarContext";

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  estimatedHours?: number;
  progress?: number;
  dependsOn?: { id: string }[];
  priority?: number;
  subtasks?: { id: string; isCompleted: boolean }[];
  startDate?: string;
  endDate?: string;
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  taskId: string;
}

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type?: 'PROJECT' | 'CASUAL';
  defaultWorkDays?: number[];
  defaultWorkHours?: { start: string; end: string };
}

export default function GanttPage() {
  const { refreshTrigger } = useTaskRefresh();
  const { selectedSprint, selectedSprintId } = useSprint();
  const { data: session } = useSession();
  const { isCollapsed } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('Month');
  const [userSettings, setUserSettings] = useState<{
    workHours: { start: string; end: string };
    workDays: number[];
  }>({ workHours: { start: '09:00', end: '17:00' }, workDays: [1, 2, 3, 4, 5] });
  const [busyHours, setBusyHours] = useState<Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>>([]);

  // Update work settings when selected sprint changes
  useEffect(() => {
    if (selectedSprint?.defaultWorkDays && selectedSprint?.defaultWorkHours) {
      // Use Sprint's work configuration based on Sprint type
      console.log(`Using Sprint work configuration: ${selectedSprint.type || 'PROJECT'} type`);
      setUserSettings({
        workDays: selectedSprint.defaultWorkDays,
        workHours: selectedSprint.defaultWorkHours
      });
    } else {
      // Fall back to user settings if Sprint doesn't have settings
      console.log('Falling back to user work settings');
      fetchUserSettings();
    }
  }, [selectedSprint]);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};
        setUserSettings({
          workHours: settings.workHours || { start: '09:00', end: '17:00' },
          workDays: settings.workDays || [1, 2, 3, 4, 5]
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const fetchTasks = async () => {
    if (!selectedSprintId) return;
    
    setLoading(true);
    setError(null);
    try {
      if (!session) {
        // Use mock data when not authenticated
        const mockTasks = getMockTasksBySprintId(selectedSprintId);
        
        const tasksWithSubtasks = await Promise.all(
          mockTasks.map(async (task) => {
            const subtasks = getMockSubTasksByTaskId(task.id);
            const completedSubtasks = subtasks.filter((st) => st.isCompleted).length;
            const totalSubtasks = subtasks.length;
            const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
            
            return {
              ...task,
              subtasks,
              progress,
              estimatedHours: task.estimatedHours || 8
            };
          })
        );
        
        setTasks(tasksWithSubtasks);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/tasks?sprintId=${selectedSprintId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Fetch subtasks for each task
        const tasksWithSubtasks = await Promise.all(
          data.map(async (task: Task) => {
            try {
              const subtasksResponse = await fetch(`/api/tasks/${task.id}/subtasks`);
              const subtasksData = subtasksResponse.ok ? await subtasksResponse.json() : [];
              
              const completedSubtasks = subtasksData.filter((st: Subtask) => st.isCompleted).length;
              const totalSubtasks = subtasksData.length;
              
              // Calculate progress based on subtasks
              const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
              
              return { 
                ...task, 
                subtasks: subtasksData, 
                progress,
                estimatedHours: task.estimatedHours || 8
              };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.id}:`, error);
              return { 
                ...task, 
                subtasks: [], 
                progress: 0,
                estimatedHours: task.estimatedHours || 8
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
      setTasks([
        {
          id: "task1",
          title: "Redesign website",
          status: "DONE",
          progress: 100,
          estimatedHours: 40,
          priority: 500000
        },
        {
          id: "task2", 
          title: "Develop backend API",
          status: "REVIEW",
          progress: 30,
          estimatedHours: 60,
          priority: 400000
        },
        {
          id: "task3",
          title: "Deploy to production", 
          status: "IN_PROGRESS",
          progress: 0,
          estimatedHours: 20,
          priority: 300000
        },
        {
          id: "task4",
          title: "Testing & QA",
          status: "TODO",
          progress: 0,
          estimatedHours: 25,
          priority: 200000
        },
        {
          id: "task5",
          title: "User Documentation",
          status: "TODO",
          progress: 0,
          estimatedHours: 15,
          priority: 100000
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusyHours = async () => {
    try {
      if (!session) {
        // Use mock data when not authenticated
        setBusyHours(mockBusyHours);
        return;
      }
      
      const response = await fetch("/api/user/busy-hours");
      if (response.ok) {
        const data = await response.json();
        setBusyHours(data);
      }
    } catch (error) {
      console.error("Failed to fetch busy hours:", error);
    }
  };

  useEffect(() => {
    if (selectedSprintId) {
      fetchTasks();
      fetchBusyHours();
    }
  }, [selectedSprintId, refreshTrigger]);
  
  // Refresh chart when view mode changes
  useEffect(() => {
    if (selectedSprint && tasks.length > 0) {
      // Force chart re-render by updating a state or key
      console.log(`View mode changed to: ${viewMode}`);
    }
  }, [viewMode, selectedSprint, tasks]);

  // Calculate task scheduling using double pointer approach
  const calculateTaskSchedule = () => {
    if (!selectedSprint) return [];
    
    const sprintStartDate = new Date(selectedSprint.startDate);
    const sprintEndDate = new Date(selectedSprint.endDate);
    
    console.log(`\n=== Gantt Auto Scheduling for ${selectedSprint.type || 'PROJECT'} Sprint ===`);
    console.log(`Sprint: ${selectedSprint.name} (${format(sprintStartDate, 'yyyy-MM-dd')} to ${format(sprintEndDate, 'yyyy-MM-dd')})`);
    console.log(`Work configuration - Days: [${userSettings.workDays.join(',')}], Hours: ${userSettings.workHours.start}-${userSettings.workHours.end}`);
    
    // Sort tasks by status priority (DONE > REVIEW > IN_PROGRESS > TODO) then by priority (high to low)
    const sortedTasks = [...tasks].sort((a, b) => {
      const statusOrder = { 'DONE': 1, 'REVIEW': 2, 'IN_PROGRESS': 3, 'TODO': 4 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 5;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 5;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same status, sort by priority (higher number = higher priority, matches Dashboard)
      return (b.priority || 0) - (a.priority || 0);
    });

    // Helper functions
    const parseTimeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const isWorkDay = (date: Date): boolean => {
      const dayOfWeek = date.getDay();
      return userSettings.workDays.includes(dayOfWeek);
    };

    // Create work hour blocks for the entire sprint
    interface WorkBlock {
      date: Date;
      startMinutes: number;
      endMinutes: number;
      availableHours: number;
    }

    const generateWorkBlocks = (extendBeyondSprint: boolean = false): WorkBlock[] => {
      const workBlocks: WorkBlock[] = [];
      let currentDate = new Date(sprintStartDate);
      
      const workStartMinutes = parseTimeToMinutes(userSettings.workHours.start);
      const workEndMinutes = parseTimeToMinutes(userSettings.workHours.end);
      const hoursPerDay = (workEndMinutes - workStartMinutes) / 60;
      
      // Generate work blocks within Sprint period (with busy hours consideration)
      while (currentDate <= sprintEndDate) {
        if (isWorkDay(currentDate)) {
          // Calculate busy hours for this specific date
          const dayStart = new Date(currentDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(currentDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayBusyHours = busyHours.filter(bh => {
            const busyStart = new Date(bh.startTime);
            const busyEnd = new Date(bh.endTime);
            return busyStart >= dayStart && busyEnd <= dayEnd;
          });
          
          // Calculate total busy time in hours for this day
          const totalBusyHours = dayBusyHours.reduce((total, bh) => {
            const busyStart = new Date(bh.startTime);
            const busyEnd = new Date(bh.endTime);
            const busyDurationHours = (busyEnd.getTime() - busyStart.getTime()) / (1000 * 60 * 60);
            return total + busyDurationHours;
          }, 0);
          
          // Available hours = regular work hours - busy hours
          const availableHours = Math.max(0, hoursPerDay - totalBusyHours);
          
          workBlocks.push({
            date: new Date(currentDate),
            startMinutes: workStartMinutes,
            endMinutes: workEndMinutes,
            availableHours: availableHours
          });
        }
        currentDate = addDays(currentDate, 1);
      }
      
      // If extending beyond Sprint, add work blocks with regular work hours (but no busy hours)
      if (extendBeyondSprint) {
        // Add up to 365 additional days (1 year) for post-sprint work
        const maxExtensionDays = 365;
        let extensionDays = 0;
        
        while (extensionDays < maxExtensionDays) {
          // Beyond Sprint period, maintain work day/hour restrictions but ignore busy hours
          if (isWorkDay(currentDate)) {
            workBlocks.push({
              date: new Date(currentDate),
              startMinutes: workStartMinutes,  // Use regular work start time
              endMinutes: workEndMinutes,      // Use regular work end time
              availableHours: hoursPerDay      // Regular daily work hours
            });
          }
          
          currentDate = addDays(currentDate, 1);
          extensionDays++;
        }
      }
      
      return workBlocks;
    };

    let workBlocks = generateWorkBlocks();
    
    // Debug logging
    console.log(`Generated ${workBlocks.length} work blocks for ${selectedSprint.type || 'PROJECT'} Sprint:`);
    console.log('Work blocks:', workBlocks.slice(0, 5).map(b => ({
      date: format(b.date, 'yyyy-MM-dd'),
      start: `${Math.floor(b.startMinutes / 60)}:${String(b.startMinutes % 60).padStart(2, '0')}`,
      end: `${Math.floor(b.endMinutes / 60)}:${String(b.endMinutes % 60).padStart(2, '0')}`,
      hours: b.availableHours
    })), workBlocks.length > 5 ? `... and ${workBlocks.length - 5} more` : '');

    const scheduledTasks = [];

    // Double pointer approach
    let taskPointer = 0;      // Points to current task
    let workBlockPointer = 0; // Points to current work block
    let currentBlockHoursUsed = 0; // Hours already used in current block

    while (taskPointer < sortedTasks.length) {
      const currentTask = sortedTasks[taskPointer];
      const needHours = currentTask.estimatedHours || 8;
      
      console.log(`\n=== Processing Task ${taskPointer + 1}: ${currentTask.title} (${needHours}h) ===`);
      console.log(`Starting at block ${workBlockPointer}, hours used: ${currentBlockHoursUsed}`);
      
      // Find task start position
      const taskStartBlock = workBlockPointer;
      const taskStartDate = workBlocks[taskStartBlock].date;
      const taskStartMinutes = workBlocks[taskStartBlock].startMinutes + (currentBlockHoursUsed * 60);
      
      // Set task start time
      const taskStartDateTime = new Date(taskStartDate);
      taskStartDateTime.setHours(Math.floor(taskStartMinutes / 60), taskStartMinutes % 60, 0, 0);
      
      console.log(`Task starts at: ${format(taskStartDateTime, 'yyyy-MM-dd HH:mm')}`);
      
      let remainingHours = needHours;
      let tempWorkBlockPointer = workBlockPointer;
      let tempBlockHoursUsed = currentBlockHoursUsed;
      
      // Find where task ends by consuming work hours
      while (remainingHours > 0) {
        // If we've run out of work blocks, extend them beyond Sprint period
        if (tempWorkBlockPointer >= workBlocks.length) {
          console.log(`Task extends beyond Sprint period, generating extended work blocks...`);
          const extendedBlocks = generateWorkBlocks(true);
          // Only take the blocks that are beyond the current blocks
          const newBlocks = extendedBlocks.slice(workBlocks.length);
          workBlocks = [...workBlocks, ...newBlocks];
          console.log(`Extended work blocks from ${workBlocks.length - newBlocks.length} to ${workBlocks.length} blocks`);
        }
        
        const currentBlock = workBlocks[tempWorkBlockPointer];
        const availableHoursInBlock = currentBlock.availableHours - tempBlockHoursUsed;
        
        console.log(`Block ${tempWorkBlockPointer}: Available ${availableHoursInBlock}h, Need ${remainingHours}h`);
        
        if (availableHoursInBlock > 0) {
          const hoursToConsume = Math.min(remainingHours, availableHoursInBlock);
          tempBlockHoursUsed += hoursToConsume;
          remainingHours -= hoursToConsume;
          
          console.log(`Consuming ${hoursToConsume}h, remaining ${remainingHours}h`);
          
          // If block is full, move to next block
          if (tempBlockHoursUsed >= currentBlock.availableHours) {
            console.log(`Block ${tempWorkBlockPointer} full, moving to next block`);
            tempWorkBlockPointer++;
            tempBlockHoursUsed = 0;
          }
        } else {
          // Current block is full, move to next block
          console.log(`Block ${tempWorkBlockPointer} has no available hours, moving to next block`);
          tempWorkBlockPointer++;
          tempBlockHoursUsed = 0;
        }
      }
      
      // Calculate task end time (task is guaranteed to be completed)
      let taskEndDateTime: Date;
      if (tempBlockHoursUsed > 0 && tempWorkBlockPointer < workBlocks.length) {
        // Task ends within current block
        const endBlock = workBlocks[tempWorkBlockPointer];
        const endMinutes = endBlock.startMinutes + (tempBlockHoursUsed * 60);
        taskEndDateTime = new Date(endBlock.date);
        taskEndDateTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
      } else if (tempWorkBlockPointer > 0) {
        // Task ended exactly at the end of previous block
        const lastBlock = workBlocks[tempWorkBlockPointer - 1];
        taskEndDateTime = new Date(lastBlock.date);
        taskEndDateTime.setHours(Math.floor(lastBlock.endMinutes / 60), lastBlock.endMinutes % 60, 0, 0);
      } else {
        // Fallback (shouldn't happen with proper logic)
        taskEndDateTime = new Date(taskStartDateTime);
      }
      
      console.log(`Task ends at: ${format(taskEndDateTime, 'yyyy-MM-dd HH:mm')}`);
      
      scheduledTasks.push({
        ...currentTask,
        startDate: taskStartDateTime,
        endDate: taskEndDateTime,
        estimatedDays: Math.ceil(needHours / 8)
      });
      
      // Update pointers for next task (task is guaranteed to be completed)
      if (tempBlockHoursUsed > 0 && tempWorkBlockPointer < workBlocks.length) {
        // Task ends within current block, continue from current position
        workBlockPointer = tempWorkBlockPointer;
        currentBlockHoursUsed = tempBlockHoursUsed;
      } else {
        // Task ended exactly at block boundary, move to next block
        workBlockPointer = tempWorkBlockPointer;
        currentBlockHoursUsed = 0;
      }
      
      console.log(`Next task will start at block ${workBlockPointer}, hours used: ${currentBlockHoursUsed}`);
      
      taskPointer++;
    }
    
    return scheduledTasks;
  };

  const scheduledTasks = calculateTaskSchedule();

  // Get chart date range based on view mode
  const getChartDateRange = () => {
    if (!selectedSprint) return { start: new Date(), end: new Date() };
    
    const sprintStart = new Date(selectedSprint.startDate);
    const sprintEnd = new Date(selectedSprint.endDate);
    
    // Find the latest task end date to extend chart range if needed
    let latestEndDate = sprintEnd;
    if (scheduledTasks.length > 0) {
      const taskEndDates = scheduledTasks.map(task => task.endDate);
      const maxTaskEndDate = new Date(Math.max(...taskEndDates.map(date => date.getTime())));
      if (maxTaskEndDate > latestEndDate) {
        latestEndDate = maxTaskEndDate;
      }
    }
    
    return { start: sprintStart, end: latestEndDate };
  };

  // Prepare data for Google Charts Gantt
  const getGanttData = () => {
    const columns = [
      { type: 'string', label: 'Task ID' },
      { type: 'string', label: 'Task Name' },
      { type: 'string', label: 'Resource' },
      { type: 'date', label: 'Start Date' },
      { type: 'date', label: 'End Date' },
      { type: 'number', label: 'Duration' },
      { type: 'number', label: 'Percent Complete' },
      { type: 'string', label: 'Dependencies' },
    ];

    // Separate tasks based on Sprint End boundary
    const sprintEndDate = selectedSprint ? new Date(selectedSprint.endDate) : null;
    const tasksBeforeSprintEnd: typeof scheduledTasks = [];
    const tasksAfterSprintEnd: typeof scheduledTasks = [];
    
    // Find the correct position to insert Sprint End marker
    let sprintEndInsertIndex = 0;
    
    scheduledTasks.forEach((task, index) => {
      if (!sprintEndDate) {
        tasksBeforeSprintEnd.push(task);
        return;
      }
      
      // Check if task crosses Sprint boundary
      const taskStartsBeforeSprintEnd = task.startDate <= sprintEndDate;
      const taskEndsAfterSprintEnd = task.endDate > sprintEndDate;
      
      if (taskStartsBeforeSprintEnd) {
        tasksBeforeSprintEnd.push(task);
        // If this task crosses Sprint end, Sprint End should come after it
        if (taskEndsAfterSprintEnd) {
          sprintEndInsertIndex = tasksBeforeSprintEnd.length;
        }
      } else {
        tasksAfterSprintEnd.push(task);
      }
    });

    const createTaskRow = (task: typeof scheduledTasks[0]) => {
      const startDate = task.startDate;
      const endDate = task.endDate;
      const duration = endDate.getTime() - startDate.getTime();
      const percentComplete = task.status === 'DONE' || task.status === 'REVIES' 
        ? 100
        : task.status === 'TODO'
        ? 0
        : (!task.subtasks || task.subtasks.length === 0) 
        ? 0
        : Math.round((task.subtasks.filter(t => t.isCompleted).length / task.subtasks.length) * 100);
      
      // Status as resource for color coding
      const resource = task.status || 'TODO';
      
      // Dependencies (if any)
      const dependencies = task.dependsOn?.map(dep => dep.id).join(',') || null;

      return [
        task.id,
        task.title,
        resource,
        startDate,
        endDate,
        duration,
        percentComplete,
        dependencies
      ];
    };

    const rows = [];
    
    // Add all tasks before Sprint End marker
    tasksBeforeSprintEnd.forEach(task => {
      rows.push(createTaskRow(task));
    });

    // Add Sprint End marker as a thin line at the correct position
    if (selectedSprint && sprintEndDate) {
      // Use the actual Sprint end date from selectedSprint
      const actualSprintEndDate = new Date(selectedSprint.endDate);
      
      // Create a very thin marker at the end of Sprint end date
      const sprintEndDateTime = new Date(selectedSprint.endDate);
      sprintEndDateTime.setHours(23, 59, 59, 0); // End of day
      
      // Make it 30 minutes duration for a thicker line effect
      const sprintEndStartTime = new Date(sprintEndDateTime.getTime() - 1800000); // 30 minutes before
      
      rows.push([
        'sprint-end',
        `🔴 SPRINT DEADLINE (${actualSprintEndDate.toLocaleDateString()}) 🔴`,
        'SPRINT_END',
        sprintEndStartTime,
        sprintEndDateTime,
        1800000, // 30 minutes duration = thicker line
        100,
        null
      ]);
    }

    // Add tasks that start after Sprint End
    tasksAfterSprintEnd.forEach(task => {
      rows.push(createTaskRow(task));
    });

    return [columns, ...rows];
  };

  const chartDateRange = getChartDateRange();
  
  // Calculate proper chart width based on time range and view mode
  const getChartWidth = () => {
    const daysDiff = differenceInDays(chartDateRange.end, chartDateRange.start);
    switch (viewMode) {
      case 'Day':
        const totalHours = daysDiff * 24; // Total hours in sprint
        return Math.max(1200, totalHours * 40); // 40px per hour grid
      case 'Week':
        return Math.max(1200, Math.ceil(daysDiff / 7) * 120); // 120px per week grid
      case 'Month':
        return Math.max(1200, Math.ceil(daysDiff / 30) * 150); // 150px per month grid
      case 'Full':
        return '100%'; // Fill the entire card width
      default:
        return Math.max(1200, Math.ceil(daysDiff / 30) * 150);
    }
  };
  
  const chartWidth = getChartWidth();
  
  const ganttOptions = {
    height: Math.max(400, scheduledTasks.length * 50 + 100),
    // width is handled by Chart component props only
    gantt: {
      trackHeight: 30,
      criticalPathEnabled: false,
      innerGridHorizLine: {
        stroke: '#e0e0e0',
        strokeWidth: 1
      },
      innerGridTrack: { fill: '#fafafa' },
      innerGridDarkTrack: { fill: '#f5f5f5' },
      labelStyle: {
        fontName: 'Arial',
        fontSize: 12,
        color: '#333'
      },
      percentEnabled: true,
      sortTasks: false,
      defaultStartDate: chartDateRange.start,
      arrow: {
        angle: 100,
        length: 8,
        spaceAfter: 4
      }
    },
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#dc2626'],
    colorByRowLabel: true,
    backgroundColor: '#fff',
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true,
      maxZoomIn: 8.0,
      maxZoomOut: 0.1
    },
    hAxis: {
      format: getTimeAxisFormat(),
      minValue: chartDateRange.start,
      maxValue: chartDateRange.end,
      gridlines: {
        color: '#e0e0e0',
        count: getGridlineCount()
      },
      minorGridlines: {
        color: '#f0f0f0',
        count: getMinorGridlineCount()
      },
      textStyle: {
        fontSize: 10,
        color: '#666'
      }
    }
  };
  
  function getTimeAxisFormat() {
    const daysDiff = differenceInDays(chartDateRange.end, chartDateRange.start);
    switch (viewMode) {
      case 'Day':
        return 'MMM dd'; // Show date and hour
      case 'Week':
        return 'MMM dd'; // Show week start date
      case 'Month':
        return 'MMM yyyy'; // Show month and year
      case 'Full':
        // Adaptive format based on sprint length
        if (daysDiff <= 14) {
          return 'MMM dd'; // Daily format for short sprints
        } else if (daysDiff <= 60) {
          return 'MMM dd'; // Weekly format for medium sprints
        } else {
          return 'MMM yyyy'; // Monthly format for long sprints
        }
      default:
        return 'MMM yyyy';
    }
  }
  
  function getGridlineCount() {
    const daysDiff = differenceInDays(chartDateRange.end, chartDateRange.start);
    switch (viewMode) {
      case 'Day':
        const totalHours = daysDiff * 24;
        return Math.ceil(totalHours / 8); // Major grid every 8 hours
      case 'Week':
        return Math.ceil(daysDiff / 14); // Major grid every 14 days (2 weeks)
      case 'Month':
        return Math.ceil(daysDiff / 60); // Major grid every 2 months (60 days)
      case 'Full':
        return Math.min(10, Math.ceil(daysDiff / 7)); // Adaptive gridlines, max 10
      default:
        return Math.ceil(daysDiff / 60);
    }
  }
  
  function getMinorGridlineCount() {
    switch (viewMode) {
      case 'Day':
        return 7; // 7 minor gridlines per major grid (1 hour between 8-hour major grids)
      case 'Week':
        return 1; // 1 minor gridline per major grid (7 days between 14-day major grids)
      case 'Month':
        return 1; // 1 minor gridline per major grid (1 month between 2-month major grids)
      case 'Full':
        return 2; // 2 minor gridlines per major grid
      default:
        return 1;
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Gantt Chart
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Gantt Chart
          </h1>
          <Button onClick={fetchTasks} variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {!session && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Demo Mode - Gantt Chart</h3>
              <p className="text-xs text-blue-700">
                You're viewing demo data with automatic scheduling. Sign in to create your own projects and see real-time task scheduling.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          Gantt Chart
        </h1>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Week">Week</SelectItem>
              <SelectItem value="Month">Month</SelectItem>
              <SelectItem value="Full">Full</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTasks} variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sprint Information */}
      {selectedSprint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Current Sprint: {selectedSprint.name} ({selectedSprint.type || 'PROJECT'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Start: {format(new Date(selectedSprint.startDate), 'MMM dd, yyyy')}</span>
              <span>End: {format(new Date(selectedSprint.endDate), 'MMM dd, yyyy')}</span>
              <span>Duration: {differenceInDays(new Date(selectedSprint.endDate), new Date(selectedSprint.startDate)) + 1} days</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Work Hours:</span> {userSettings.workHours.start} - {userSettings.workHours.end}
                <span className="ml-4 font-medium">Work Days:</span> {userSettings.workDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
              </div>
              <div className="mt-1">
                <span className="font-medium">View Range:</span> {format(chartDateRange.start, 'MMM dd, yyyy')} - {format(chartDateRange.end, 'MMM dd, yyyy')} 
                <span className="ml-2">({differenceInDays(chartDateRange.end, chartDateRange.start) + 1} days)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="w-full" style={{ maxWidth: isCollapsed ? 'calc(100vw - 4rem)' : 'calc(100vw - 20rem)' }}>
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {scheduledTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground px-6">
                {!selectedSprint ? 'No active sprint found' : 'No tasks available for Gantt chart'}
              </div>
            ) : (
              <div className="w-full">
                <div 
                  className="overflow-x-auto overflow-y-hidden border-t border-gray-200"
                  style={{ 
                    maxHeight: '600px',
                    width: '100%'
                  }}
                >
                  <div style={{ 
                    width: viewMode === 'Full' ? '100%' : `${chartWidth}px`, 
                    minWidth: viewMode === 'Full' ? '100%' : '800px' 
                  }}>
                    <Chart
                      key={`gantt-${viewMode}-${selectedSprint?.id || 'no-sprint'}-${tasks.length}`}
                      chartType="Gantt"
                      width={viewMode === 'Full' ? '100%' : chartWidth}
                      height={ganttOptions.height}
                      data={getGanttData()}
                      options={ganttOptions}
                      loader={
                        <div className="flex items-center justify-center h-96">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading Gantt Chart...</p>
                          </div>
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}