"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, isPast, eachDayOfInterval, isWeekend } from "date-fns";
import { useSession } from "next-auth/react";
import { getMockTasksBySprintId, mockBusyHours } from "@/lib/mockData";
import { sortByPriorityDescending } from "@/lib/priorityUtils";
import { useSprint } from "@/context/SprintContext";
import { WidgetSelector } from "@/components/WidgetSelector";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import WidgetProvider from "@/components/WidgetProvider";
import {
  TaskSummaryWidget,
  TaskDistributionWidget,
  RecentActivityWidget,
  SprintCompletionWidget,
  SprintProgressWidget,
  WorkHoursWidget,
  HoursSummaryWidget,
  CalendarOverviewWidget,
  ProgressChartWidget,
  SprintHealthWidget,
  VelocityWidget,
  RiskAssessmentWidget,
  BurndownChartWidget,
  TeamWorkloadWidget,
  CodeCommitsWidget,
  TeamCommunicationWidget
} from "@/components/widgets";
import { LayoutDashboardIcon } from "lucide-react";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  iterations?: number;
  defaultWorkHours?: { start: string; end: string };
  defaultWorkDays?: number[];
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


interface WidgetConfig {
  id: string;
}

export default function DashboardPage() {
  const { selectedSprint, loading: sprintLoading, refreshSprints } = useSprint();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetConfig[]>([]);
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
  

  useEffect(() => {
    if (selectedSprint) {
      fetchTasksForSprint(selectedSprint.id);
    }
    fetchBusyHours();
  }, [selectedSprint, fetchTasksForSprint, fetchBusyHours]);

  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    setEnabledWidgets((prev) => {
      const newWidgets = enabled
        ? [...prev.filter((w) => w.id !== widgetId), { id: widgetId }]
        : prev.filter((w) => w.id !== widgetId);

      if (typeof window !== "undefined") {
        localStorage.setItem("enabledWidgets", JSON.stringify(newWidgets));
      }
      return newWidgets;
    });
  };

  // Calculate available hours within sprint
  const calculateAvailableHours = useCallback(() => {
    if (!selectedSprint) return { totalSprintHours: 0, busyHours: 0, availableHours: 0 };
    
    const sprintStart = new Date(selectedSprint.startDate);
    const sprintEnd = new Date(selectedSprint.endDate);
    
    // Get all days in sprint
    const sprintDays = eachDayOfInterval({ start: sprintStart, end: sprintEnd });
    
    // Calculate daily work hours from sprint configuration
    const dailyWorkHours = (() => {
      const workHours = selectedSprint.defaultWorkHours;
      if (!workHours || !workHours.start || !workHours.end) {
        return 8; // Fallback to 8 hours if not configured
      }
      
      const [startHour, startMinute] = workHours.start.split(':').map(Number);
      const [endHour, endMinute] = workHours.end.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return (endTimeInMinutes - startTimeInMinutes) / 60; // Convert to hours
    })();
    
    // Calculate total available hours in sprint
    const defaultWorkDays = selectedSprint.defaultWorkDays || [1, 2, 3, 4, 5]; // Default to Mon-Fri
    const workDays = sprintDays.filter(day => {
      const dayOfWeek = day.getDay();
      // Convert Sunday (0) to 7 to match defaultWorkDays format (1=Mon, 7=Sun)
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
      return defaultWorkDays.includes(dayNumber);
    });
    const totalSprintHours = workDays.length * dailyWorkHours;
    
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

  // Render widget components based on enabled widgets
  const renderWidget = (widgetId: string, index: number) => {
    const { totalSprintHours, busyHours: totalBusyHours, availableHours } = calculateAvailableHours();
    
    switch (widgetId) {
      case 'task-summary':
        return <TaskSummaryWidget key={widgetId} tasks={tasks} />;
      
      case 'task-distribution':
        return <TaskDistributionWidget key={widgetId} tasks={tasks} />;
      
      case 'recent-activity':
        return <RecentActivityWidget key={widgetId} tasks={tasks} />;
      
      case 'completion-rate':
        return selectedSprint ? (
          <SprintCompletionWidget 
            key={widgetId} 
            sprintStartDate={selectedSprint.startDate}
            sprintEndDate={selectedSprint.endDate}
          />
        ) : null;
      
      case 'sprint-progress':
        return selectedSprint ? (
          <SprintProgressWidget 
            key={widgetId} 
            sprintStartDate={selectedSprint.startDate}
            sprintEndDate={selectedSprint.endDate}
          />
        ) : null;
      
      case 'work-hours':
        return (
          <WorkHoursWidget 
            key={widgetId} 
            totalSprintHours={totalSprintHours}
            busyHours={totalBusyHours}
          />
        );
      
      case 'hours-summary':
        return <HoursSummaryWidget key={widgetId} tasks={tasks} />;
      
      case 'calendar-overview':
        return <CalendarOverviewWidget key={widgetId} busyHours={busyHours} />;
      
      case 'progress-chart':
        return <ProgressChartWidget key={widgetId} tasks={tasks} />;
      
      case 'sprint-health':
        return selectedSprint ? (
          <SprintHealthWidget 
            key={widgetId} 
            sprintStartDate={selectedSprint.startDate}
            sprintEndDate={selectedSprint.endDate}
            tasks={tasks}
          />
        ) : null;
      
      case 'velocity':
        return <VelocityWidget key={widgetId} taskProgressPercentage={taskProgressPercentage} />;
      
      case 'risk-assessment':
        return <RiskAssessmentWidget key={widgetId} progressPercentage={progressPercentage} />;
      
      case 'burndown':
        return selectedSprint ? (
          <BurndownChartWidget 
            key={widgetId} 
            sprintId={selectedSprint.id}
            sprintName={selectedSprint.name}
            sprintStartDate={selectedSprint.startDate}
            sprintEndDate={selectedSprint.endDate}
          />
        ) : null;
      
      case 'team-workload':
        return <TeamWorkloadWidget key={widgetId} tasks={tasks} />;
      
      case 'code-commits':
        return <CodeCommitsWidget key={widgetId} />;
      
      case 'team-communication':
        return <TeamCommunicationWidget key={widgetId} />;
      
      default:
        return null;
    }
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
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">📊</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-indigo-800">Demo Mode - Dashboard</h3>
              <p className="text-xs text-indigo-700">
                You're viewing demo analytics and widgets. Sign in to connect your real project data and customize your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboardIcon className="w-6 h-6" />
          Dashboard
        </h1>
        <WidgetProvider
          enabledWidgets={enabledWidgets}
          onWidgetToggle={handleWidgetToggle}
        />
      </div>

      {/* Draggable Widget Grid */}
      {enabledWidgets.length > 0 && (
        <DragDropContext onDragEnd={handleWidgetDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {enabledWidgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging ? "scale-105 rotate-2 shadow-lg z-50" : ""
                        }`}
                      >
                        {renderWidget(widget.id, index)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Widget Selector Dialog */}
      <WidgetSelector
        isOpen={widgetSelectorOpen}
        setIsOpen={setWidgetSelectorOpen}
        enabledWidgets={enabledWidgets.map(w => w.id)}
        onSave={handleSaveWidgets}
      />
    </div>
  );
}