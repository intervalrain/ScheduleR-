"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isPast, eachDayOfInterval, isWeekend } from "date-fns";
import { useSession } from "next-auth/react";
import { getMockTasksBySprintId, mockBusyHours } from "@/lib/mockData";
import { sortByPriorityDescending } from "@/lib/priorityUtils";
import { useSprint } from "@/context/SprintContext";
import { EditSprintDialog } from "@/components/EditSprintDialog";
import { WidgetSelector } from "@/components/WidgetSelector";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { CalendarIcon, EditIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, ClockIcon, CheckCircleIcon, BarChart3Icon, HeartIcon, UsersIcon, ZapIcon, AlertTriangleIcon, GitBranchIcon, MessageSquareIcon, FileTextIcon, TargetIcon, TrendingDownIcon, SettingsIcon } from "lucide-react";
import { Chart } from "react-google-charts";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  iterations?: number;
}

interface Task {
  id: string;
  status: string;
  estimatedHours?: number;
}

interface BusyHour {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  userId: string;
  categoryId: string;
}

interface WidgetItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  value: string | number;
  description: string;
  color: string;
}

interface WidgetConfig {
  id: string;
}

interface BurndownDataPoint {
  date: string;
  idealLine: number;
  remainLine: number;
}

interface BurndownData {
  sprintId: string;
  sprintName: string;
  sprintStart: string;
  sprintEnd: string;
  totalHours: number;
  data: BurndownDataPoint[];
}

export default function Home() {
  const { selectedSprint, loading: sprintLoading, refreshSprints } = useSprint();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [burndownMode, setBurndownMode] = useState<'includeTodo' | 'excludeTodo'>('includeTodo');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetConfig[]>([]);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Load enabled widgets from localStorage
    if (typeof window !== "undefined") {
      const savedWidgets = localStorage.getItem("enabledWidgets");
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEnabledWidgets(parsed);
          }
        } catch (e) {
          console.error('Error parsing saved widgets:', e);
        }
      } else {
        // Default enabled widgets (ordered by priority)
        const defaultWidgets = [
          { id: "task-summary" },
          { id: "completion-rate" },
          { id: "work-hours" },
          { id: "progress-chart" },
          { id: "hours-summary" },
          { id: "sprint-health" },
          { id: "team-workload" }
        ];
        setEnabledWidgets(defaultWidgets);
      }
    }
  }, []);

  const fetchTasksForSprint = useCallback(async (sprintId: string) => {
    try {
      if (!session) {
        // Use mock data when not authenticated
        const mockSprintTasks = getMockTasksBySprintId(sprintId);
        console.log('Sprint switching: Loading', mockSprintTasks.length, 'tasks for sprint', sprintId);
        setTasks(mockSprintTasks);
        return;
      }
      
      const response = await fetch(`/api/tasks?sprintId=${sprintId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }, [session]);

  const fetchBusyHours = useCallback(async () => {
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
  }, [session]);

  const fetchBurndownData = useCallback(async (sprintId: string, mode: 'includeTodo' | 'excludeTodo' = 'includeTodo') => {
    try {
      if (!session) {
        // Generate mock burndown data for demo
        const mockData: BurndownData = {
          sprintId,
          sprintName: "Demo Sprint",
          sprintStart: "2025-07-15",
          sprintEnd: "2025-07-29",
          totalHours: mode === 'includeTodo' ? 120 : 90, // Less hours when excluding TODO
          data: [
            { date: "2025-07-15", idealLine: mode === 'includeTodo' ? 120 : 90, remainLine: mode === 'includeTodo' ? 120 : 90 },
            { date: "2025-07-16", idealLine: mode === 'includeTodo' ? 112 : 84, remainLine: mode === 'includeTodo' ? 112 : 84 },
            { date: "2025-07-17", idealLine: mode === 'includeTodo' ? 104 : 78, remainLine: mode === 'includeTodo' ? 96 : 72 },
            { date: "2025-07-18", idealLine: mode === 'includeTodo' ? 96 : 72, remainLine: mode === 'includeTodo' ? 88 : 64 },
            { date: "2025-07-19", idealLine: mode === 'includeTodo' ? 88 : 66, remainLine: mode === 'includeTodo' ? 72 : 54 },
            { date: "2025-07-20", idealLine: mode === 'includeTodo' ? 80 : 60, remainLine: mode === 'includeTodo' ? 64 : 48 },
            { date: "2025-07-21", idealLine: mode === 'includeTodo' ? 72 : 54, remainLine: mode === 'includeTodo' ? 56 : 42 },
            { date: "2025-07-22", idealLine: mode === 'includeTodo' ? 64 : 48, remainLine: mode === 'includeTodo' ? 44 : 32 },
            { date: "2025-07-23", idealLine: mode === 'includeTodo' ? 56 : 42, remainLine: mode === 'includeTodo' ? 36 : 24 },
            { date: "2025-07-24", idealLine: mode === 'includeTodo' ? 48 : 36, remainLine: mode === 'includeTodo' ? 28 : 16 },
            { date: "2025-07-25", idealLine: mode === 'includeTodo' ? 40 : 30, remainLine: mode === 'includeTodo' ? 20 : 12 },
            { date: "2025-07-26", idealLine: mode === 'includeTodo' ? 32 : 24, remainLine: mode === 'includeTodo' ? 16 : 8 },
            { date: "2025-07-27", idealLine: mode === 'includeTodo' ? 24 : 18, remainLine: mode === 'includeTodo' ? 8 : 4 },
            { date: "2025-07-28", idealLine: mode === 'includeTodo' ? 16 : 12, remainLine: mode === 'includeTodo' ? 4 : 0 },
            { date: "2025-07-29", idealLine: 0, remainLine: 0 },
          ]
        };
        setBurndownData(mockData);
        return;
      }
      
      const response = await fetch(`/api/dashboard/burndown?sprintId=${sprintId}&mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        setBurndownData(data);
      } else {
        // API failed, use mock data as fallback
        console.warn("Burndown API failed, using mock data");
        const mockData: BurndownData = {
          sprintId,
          sprintName: "Current Sprint",
          sprintStart: "2025-07-15",
          sprintEnd: "2025-07-29",
          totalHours: 120,
          data: [
            { date: "2025-07-15", idealLine: 120, remainLine: 120 },
            { date: "2025-07-16", idealLine: 112, remainLine: 112 },
            { date: "2025-07-17", idealLine: 104, remainLine: 96 },
            { date: "2025-07-18", idealLine: 96, remainLine: 88 },
            { date: "2025-07-19", idealLine: 88, remainLine: 72 },
            { date: "2025-07-20", idealLine: 80, remainLine: 64 },
            { date: "2025-07-21", idealLine: 72, remainLine: 56 },
            { date: "2025-07-22", idealLine: 64, remainLine: 44 },
            { date: "2025-07-23", idealLine: 56, remainLine: 36 },
            { date: "2025-07-24", idealLine: 48, remainLine: 28 },
            { date: "2025-07-25", idealLine: 40, remainLine: 20 },
            { date: "2025-07-26", idealLine: 32, remainLine: 16 },
            { date: "2025-07-27", idealLine: 24, remainLine: 8 },
            { date: "2025-07-28", idealLine: 16, remainLine: 4 },
            { date: "2025-07-29", idealLine: 0, remainLine: 0 },
          ]
        };
        setBurndownData(mockData);
      }
    } catch (error) {
      console.error("Failed to fetch burndown data:", error);
      // Use mock data on error
      const mockData: BurndownData = {
        sprintId,
        sprintName: "Current Sprint (Mock)",
        sprintStart: "2025-07-15",
        sprintEnd: "2025-07-29",
        totalHours: 120,
        data: [
          { date: "2025-07-15", idealLine: 120, remainLine: 120 },
          { date: "2025-07-16", idealLine: 112, remainLine: 112 },
          { date: "2025-07-17", idealLine: 104, remainLine: 96 },
          { date: "2025-07-18", idealLine: 96, remainLine: 88 },
          { date: "2025-07-19", idealLine: 88, remainLine: 72 },
          { date: "2025-07-20", idealLine: 80, remainLine: 64 },
          { date: "2025-07-21", idealLine: 72, remainLine: 56 },
          { date: "2025-07-22", idealLine: 64, remainLine: 44 },
          { date: "2025-07-23", idealLine: 56, remainLine: 36 },
          { date: "2025-07-24", idealLine: 48, remainLine: 28 },
          { date: "2025-07-25", idealLine: 40, remainLine: 20 },
          { date: "2025-07-26", idealLine: 32, remainLine: 16 },
          { date: "2025-07-27", idealLine: 24, remainLine: 8 },
          { date: "2025-07-28", idealLine: 16, remainLine: 4 },
          { date: "2025-07-29", idealLine: 0, remainLine: 0 },
        ]
      };
      setBurndownData(mockData);
    }
  }, [session]);
  
  // Auto-scroll widget bar (4 widgets at a time)
  useEffect(() => {
    const maxPages = Math.ceil(enabledWidgets.length / 4);
    if (isAutoScrolling && maxPages > 1) {
      scrollIntervalRef.current = setInterval(() => {
        setCurrentWidgetIndex(prev => (prev + 1) % maxPages);
      }, 5000);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, enabledWidgets.length]);

  useEffect(() => {
    if (selectedSprint) {
      fetchTasksForSprint(selectedSprint.id);
      fetchBurndownData(selectedSprint.id, burndownMode);
    }
    fetchBusyHours();
  }, [selectedSprint, burndownMode, fetchTasksForSprint, fetchBusyHours, fetchBurndownData]);

  const handleEditSprint = () => {
    if (selectedSprint) {
      setEditDialogOpen(true);
    }
  };

  // Calculate available hours within sprint
  const calculateAvailableHours = useCallback(() => {
    if (!selectedSprint) return { totalSprintHours: 0, busyHours: 0, availableHours: 0 };
    
    const sprintStart = new Date(selectedSprint.startDate);
    const sprintEnd = new Date(selectedSprint.endDate);
    
    // Get all days in sprint
    const sprintDays = eachDayOfInterval({ start: sprintStart, end: sprintEnd });
    
    // Calculate total available hours in sprint (assuming 8 hours per work day)
    const workDays = sprintDays.filter(day => !isWeekend(day));
    const totalSprintHours = workDays.length * 8; // 8 hours per work day
    
    // Calculate busy hours within sprint period
    const sprintBusyHours = busyHours.filter(bh => {
      const busyStart = new Date(bh.startTime);
      return busyStart >= sprintStart && busyStart <= sprintEnd;
    });
    
    const totalBusyHours = sprintBusyHours.reduce((total, bh) => {
      const start = new Date(bh.startTime);
      const end = new Date(bh.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert ms to hours
      return total + hours;
    }, 0);
    
    const availableHours = Math.max(0, totalSprintHours - totalBusyHours);
    
    return {
      totalSprintHours,
      busyHours: totalBusyHours,
      availableHours
    };
  }, [selectedSprint, busyHours]);


  const totalDays = selectedSprint
    ? differenceInDays(new Date(selectedSprint.endDate), new Date(selectedSprint.startDate)) + 1
    : 0;
  const remainingDays = selectedSprint
    ? Math.max(0, differenceInDays(new Date(selectedSprint.endDate), new Date()) + 1)
    : 0;
  const elapsedDays = selectedSprint
    ? Math.max(0, differenceInDays(new Date(), new Date(selectedSprint.startDate)) + 1)
    : 0;
  const progressPercentage = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;
  
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;
  const todoTasks = tasks.filter((task) => task.status === "TODO").length;
  const totalTasks = tasks.length;
  const taskProgressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Generate widget data based on current sprint and tasks
  const generateWidgetData = (): WidgetItem[] => {
    const widgets: WidgetItem[] = [];
    const { totalSprintHours, busyHours: totalBusyHours, availableHours } = calculateAvailableHours();

    enabledWidgets.forEach(config => {
      switch (config.id) {
        case 'completion-rate':
          widgets.push({
            id: 'completion-rate',
            title: 'Sprint Completion',
            icon: <TrendingUpIcon className="w-4 h-4" />,
            value: `${Math.round(progressPercentage)}%`,
            description: `Day ${elapsedDays} of ${totalDays}`,
            color: 'text-blue-600'
          });
          break;
        case 'task-summary':
          widgets.push({
            id: 'task-summary',
            title: 'Task Progress',
            icon: <CheckCircleIcon className="w-4 h-4" />,
            value: `${completedTasks}/${totalTasks}`,
            description: 'Tasks completed',
            color: 'text-green-600'
          });
          break;
        case 'hours-summary':
          widgets.push({
            id: 'hours-summary',
            title: 'Total Hours',
            icon: <ClockIcon className="w-4 h-4" />,
            value: `${tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h`,
            description: 'Estimated work',
            color: 'text-purple-600'
          });
          break;
        case 'work-hours':
          widgets.push({
            id: 'work-hours',
            title: 'Available Hours',
            icon: <ClockIcon className="w-4 h-4" />,
            value: `${Math.round(availableHours)}h`,
            description: `${Math.round(totalBusyHours)}h busy / ${Math.round(totalSprintHours)}h total`,
            color: availableHours > totalSprintHours * 0.7 ? 'text-green-600' : 
                   availableHours > totalSprintHours * 0.3 ? 'text-yellow-600' : 'text-red-600'
          });
          break;
        case 'progress-chart':
          widgets.push({
            id: 'progress-chart',
            title: 'Progress Overview',
            icon: <BarChart3Icon className="w-4 h-4" />,
            value: `${completedTasks}/${totalTasks}`,
            description: `${todoTasks} pending, ${inProgressTasks} active`,
            color: 'text-blue-600'
          });
          break;
        case 'task-distribution':
          widgets.push({
            id: 'task-distribution',
            title: 'Task Distribution',
            icon: <TargetIcon className="w-4 h-4" />,
            value: `${Math.round(taskProgressPercentage)}%`,
            description: `${reviewTasks} in review`,
            color: 'text-indigo-600'
          });
          break;
        case 'sprint-health':
          // Sprint Health calculation
          const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          const idealCompletionRate = (elapsedDays / totalDays) * 100;
          const schedulePerformance = 100 - Math.abs(idealCompletionRate - taskCompletionRate);
          const taskFlowRate = totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0;
          const taskFlowScore = taskFlowRate > 30 ? 70 : 100;
          const timeBufferScore = (remainingDays / totalDays) * 100;
          
          const overallHealth = 
            (taskCompletionRate * 0.4) + 
            (schedulePerformance * 0.3) + 
            (taskFlowScore * 0.2) + 
            (timeBufferScore * 0.1);
          
          const healthStatus = overallHealth >= 85 ? 'Excellent' : 
                              overallHealth >= 70 ? 'Good' : 
                              overallHealth >= 50 ? 'Fair' : 'Poor';
          const healthColor = overallHealth >= 70 ? 'text-green-600' : 
                             overallHealth >= 50 ? 'text-yellow-600' : 'text-red-600';
          
          widgets.push({
            id: 'sprint-health',
            title: 'Sprint Health',
            icon: <HeartIcon className="w-4 h-4" />,
            value: healthStatus,
            description: `${Math.round(overallHealth)}% overall health`,
            color: healthColor
          });
          break;
        case 'team-workload':
          widgets.push({
            id: 'team-workload',
            title: 'Team Status',
            icon: <UsersIcon className="w-4 h-4" />,
            value: `${inProgressTasks}`,
            description: 'Active tasks',
            color: 'text-indigo-600'
          });
          break;
        case 'velocity':
          widgets.push({
            id: 'velocity',
            title: 'Velocity',
            icon: <ZapIcon className="w-4 h-4" />,
            value: Math.round(taskProgressPercentage),
            description: 'Completion rate',
            color: 'text-orange-600'
          });
          break;
        case 'recent-activity':
          widgets.push({
            id: 'recent-activity',
            title: 'Recent Activity',
            icon: <GitBranchIcon className="w-4 h-4" />,
            value: `${totalTasks}`,
            description: 'Total tasks tracked',
            color: 'text-gray-600'
          });
          break;
        case 'calendar-overview':
          widgets.push({
            id: 'calendar-overview',
            title: 'Calendar Overview',
            icon: <CalendarIcon className="w-4 h-4" />,
            value: `${Math.round(totalBusyHours)}h`,
            description: 'Time blocked this sprint',
            color: 'text-pink-600'
          });
          break;
        case 'sprint-progress':
          widgets.push({
            id: 'sprint-progress',
            title: 'Sprint Progress',
            icon: <TrendingUpIcon className="w-4 h-4" />,
            value: `${elapsedDays}/${totalDays}`,
            description: `${remainingDays} days left`,
            color: remainingDays > 5 ? 'text-green-600' : remainingDays > 2 ? 'text-yellow-600' : 'text-red-600'
          });
          break;
        // Add more widgets as needed
        default:
          widgets.push({
            id: config.id,
            title: config.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            icon: <BarChart3Icon className="w-4 h-4" />,
            value: '0',
            description: 'No data',
            color: 'text-gray-600'
          });
      }
    });

    return widgets;
  };

  const widgetData = generateWidgetData();

  // Generate burndown chart data for Google Charts
  const getBurndownChartData = () => {
    if (!burndownData || !burndownData.data.length) {
      return [
        ['Date', 'Ideal Line', 'Remain Line'],
        ['No Data', 0, 0]
      ];
    }

    const chartData: (string | number)[][] = [
      ['Date', 'Ideal Line', 'Remain Line']
    ];

    burndownData.data.forEach(point => {
      chartData.push([
        point.date,
        point.idealLine,
        point.remainLine
      ]);
    });

    return chartData;
  };

  const burndownChartOptions = {
    title: `Sprint Burn-down Chart (${burndownMode === 'includeTodo' ? 'Including TODO' : 'Excluding TODO'})`,
    titleTextStyle: {
      fontSize: 16,
      bold: true
    },
    hAxis: {
      title: 'Date',
      titleTextStyle: { fontSize: 12 },
      textStyle: { fontSize: 10 }
    },
    vAxis: {
      title: 'Hours',
      titleTextStyle: { fontSize: 12 },
      textStyle: { fontSize: 10 },
      minValue: 0
    },
    series: {
      0: { 
        color: '#9ca3af', // Gray for ideal line
        lineWidth: 2,
        lineDashStyle: [5, 5] // Dashed line
      },
      1: { 
        color: '#ef4444', // Red for remaining line
        lineWidth: 3,
        areaOpacity: 0.3
      }
    },
    legend: {
      position: 'bottom',
      alignment: 'center',
      textStyle: { fontSize: 10 }
    },
    backgroundColor: '#ffffff',
    chartArea: {
      left: 60,
      top: 50,
      width: '80%',
      height: '70%'
    },
    height: 300,
    interpolateNulls: true
  };

  const handlePrevWidget = () => {
    setIsAutoScrolling(false);
    const maxPages = Math.ceil(enabledWidgets.length / 4);
    setCurrentWidgetIndex(prev => prev === 0 ? maxPages - 1 : prev - 1);
  };

  const handleNextWidget = () => {
    setIsAutoScrolling(false);
    const maxPages = Math.ceil(enabledWidgets.length / 4);
    setCurrentWidgetIndex(prev => (prev + 1) % maxPages);
  };

  const handleWidgetClick = (index: number) => {
    setIsAutoScrolling(false);
    setCurrentWidgetIndex(index);
  };

  const handleSaveWidgets = (selectedWidgetIds: string[]) => {
    const newWidgets = selectedWidgetIds.map(id => ({ id }));
    setEnabledWidgets(newWidgets);
    if (typeof window !== "undefined") {
      localStorage.setItem("enabledWidgets", JSON.stringify(newWidgets));
    }
  };

  const handleWidgetDragEnd = (result: any) => {
    console.log('Drag ended:', result);
    
    if (!result.destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    if (result.source.index === result.destination.index) {
      console.log('Same position, no change needed');
      return;
    }

    const items = Array.from(enabledWidgets);
    console.log('Before reorder:', items.map(w => w.id));
    
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    console.log('After reorder:', items.map(w => w.id));

    setEnabledWidgets(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("enabledWidgets", JSON.stringify(items));
      console.log('Saved to localStorage:', items.map(w => w.id));
    }
  };

  if (sprintLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sprint information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!session && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✨</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-800">Demo Mode - Dashboard</h3>
              <p className="text-xs text-purple-700">
                You're viewing demo sprint data and widgets. Sign in to access your personal dashboard with real project data.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sprint Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor and manage your current sprint progress
        </p>
      </div>

      {selectedSprint ? (
        <>
          {/* Sprint Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <CardTitle>{selectedSprint.name}</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditSprint}
                  className="flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Edit Sprint
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                  <p className="text-base font-semibold">{totalDays} days</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedSprint.startDate), "MMM d")} - {format(new Date(selectedSprint.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
                  <p className="text-base font-semibold">
                    Day {elapsedDays} of {totalDays}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-base font-semibold">
                    {isPast(new Date(selectedSprint.endDate)) ? '🔴 Ended' : 
                     remainingDays === 0 ? '🟡 Last Day' :
                     '🟢 Active'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {remainingDays > 0 ? `${remainingDays} days remaining` : 'Sprint completed'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Task Progress</h3>
                  <p className="text-base font-semibold">
                    {completedTasks} / {totalTasks} completed
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${taskProgressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget Bar */}
          {widgetData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Quick Overview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setWidgetSelectorOpen(true)}
                      className="text-sm"
                    >
                      <SettingsIcon className="w-4 h-4 mr-1" />
                      Customize
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                      className="text-sm"
                    >
                      {isAutoScrolling ? '⏸️ Pause' : '▶️ Play'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handlePrevWidget}
                      disabled={widgetData.length <= 4}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNextWidget}
                      disabled={widgetData.length <= 4}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Carousel Display - Show 4 widgets at a time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {widgetData.slice(currentWidgetIndex * 4, currentWidgetIndex * 4 + 4).map((widget, index) => (
                    <Card key={widget.id} className="text-center hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className={widget.color}>
                            {widget.icon}
                          </div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {widget.title}
                          </h3>
                        </div>
                        <div className={`text-2xl font-bold mb-1 ${widget.color}`}>
                          {widget.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Page indicators */}
                {Math.ceil(enabledWidgets.length / 4) > 1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    {Array.from({ length: Math.ceil(enabledWidgets.length / 4) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handleWidgetClick(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentWidgetIndex ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Hidden drag-drop context for reordering (can be accessed via customize button) */}
                <div className="hidden">
                  <DragDropContext onDragEnd={handleWidgetDragEnd}>
                    <Droppable droppableId="widgets">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {enabledWidgets.map((widgetConfig, index) => (
                            <Draggable key={widgetConfig.id} draggableId={widgetConfig.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Burn-down Chart */}
          {selectedSprint && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDownIcon className="w-5 h-5" />
                    Burn-down Chart
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={burndownMode === 'includeTodo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBurndownMode('includeTodo')}
                    >
                      Include TODO
                    </Button>
                    <Button
                      variant={burndownMode === 'excludeTodo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBurndownMode('excludeTodo')}
                    >
                      Exclude TODO
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!burndownData ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading Burn-down Chart...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Chart
                      chartType="AreaChart"
                      width="100%"
                      height="300px"
                      data={getBurndownChartData()}
                      options={burndownChartOptions}
                      loader={
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Rendering Chart...</p>
                          </div>
                        </div>
                      }
                    />
                  </div>
                )}
                {burndownData && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 opacity-60 border-dashed border-2"></div>
                        <span>Ideal Line: Linear burn-down target</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-400"></div>
                        <span>Not Yet Reviewing: Hours not yet entered review status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400"></div>
                        <span>Remaining: {burndownMode === 'includeTodo' ? 'All unfinished hours' : 'In-progress and review hours only'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Task Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{completedTasks}</div>
                  <div className="text-sm text-muted-foreground">✅ Done</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{reviewTasks}</div>
                  <div className="text-sm text-muted-foreground">👀 Review</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{inProgressTasks}</div>
                  <div className="text-sm text-muted-foreground">⚡ In Progress</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500 mb-1">{todoTasks}</div>
                  <div className="text-sm text-muted-foreground">📋 Pending</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Sprint Dialog */}
          <EditSprintDialog
            sprint={selectedSprint}
            isOpen={editDialogOpen}
            setIsOpen={setEditDialogOpen}
            onSprintUpdated={refreshSprints}
          />

          {/* Widget Selector Dialog */}
          <WidgetSelector
            isOpen={widgetSelectorOpen}
            setIsOpen={setWidgetSelectorOpen}
            enabledWidgets={enabledWidgets.map(w => w.id)}
            onSave={handleSaveWidgets}
          />
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Sprint</h3>
              <p className="text-muted-foreground mb-4">Create a new sprint to get started with project management.</p>
              <Button className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Create Sprint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}