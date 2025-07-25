"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, differenceInDays, isPast, eachDayOfInterval, isWeekend } from "date-fns";
import { useSession } from "next-auth/react";
import { getMockTasksBySprintId, mockBusyHours } from "@/lib/mockData";
import { useSprint } from "@/context/SprintContext";
import { EditSprintDialog } from "@/components/EditSprintDialog";
import { WidgetSelector } from "@/components/WidgetSelector";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { CalendarIcon, EditIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, ClockIcon, CheckCircleIcon, BarChart3Icon, HeartIcon, UsersIcon, ZapIcon, AlertTriangleIcon, GitBranchIcon, MessageSquareIcon, FileTextIcon, TargetIcon, TrendingDownIcon, SettingsIcon } from "lucide-react";
import { TaskSummaryWidget } from "@/components/widgets/tasks/TaskSummaryWidget";
import { SprintCompletionWidget } from "@/components/widgets/progress/SprintCompletionWidget";
import { SprintProgressWidget } from "@/components/widgets/progress/SprintProgressWidget";
import { WorkHoursWidget } from "@/components/widgets/time/WorkHoursWidget";
import { HoursSummaryWidget } from "@/components/widgets/time/HoursSummaryWidget";
import { TaskDistributionWidget } from "@/components/widgets/tasks/TaskDistributionWidget";
import { ProgressChartWidget } from "@/components/widgets/analytics/ProgressChartWidget";
import { SprintHealthWidget } from "@/components/widgets/analytics/SprintHealthWidget";
import { BurndownChartWidget } from "@/components/widgets/analytics/BurndownChartWidget";
import { VelocityWidget } from "@/components/widgets/analytics/VelocityWidget";
import { RiskAssessmentWidget } from "@/components/widgets/analytics/RiskAssessmentWidget";
import { TeamWorkloadWidget } from "@/components/widgets/team/TeamWorkloadWidget";
import { RecentActivityWidget } from "@/components/widgets/tasks/RecentActivityWidget";
import { CalendarOverviewWidget } from "@/components/widgets/time/CalendarOverviewWidget";

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


export default function Home() {
  const { selectedSprint, loading: sprintLoading, refreshSprints } = useSprint();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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
    }
    fetchBusyHours();
  }, [selectedSprint, fetchTasksForSprint, fetchBusyHours]);

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

  // Render widget components (same as dashboard)
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
        return selectedSprint ? (
          <WorkHoursWidget 
            key={widgetId} 
            totalSprintHours={totalSprintHours}
            busyHours={totalBusyHours}
          />
        ) : null;
        
      case 'hours-summary':
        return <HoursSummaryWidget key={widgetId} tasks={tasks} />;
        
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
        
      case 'velocity':
        return <VelocityWidget key={widgetId} taskProgressPercentage={taskProgressPercentage} />;
        
      case 'risk-assessment':
        return <RiskAssessmentWidget key={widgetId} progressPercentage={progressPercentage} />;
        
      case 'team-workload':
        return <TeamWorkloadWidget key={widgetId} tasks={tasks} />;
        
      case 'calendar-overview':
        return <CalendarOverviewWidget key={widgetId} busyHours={busyHours} />;
        
      default:
        return (
          <div key={widgetId} className="h-48 flex items-center justify-center text-gray-500">
            Widget not found: {widgetId}
          </div>
        );
    }
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
          {enabledWidgets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Quick Overview</CardTitle>
                  <div className="flex items-center gap-2">
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
                      disabled={enabledWidgets.length <= 4}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNextWidget}
                      disabled={enabledWidgets.length <= 4}
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Carousel Display - Show 4 widgets at a time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {enabledWidgets.slice(currentWidgetIndex * 4, currentWidgetIndex * 4 + 4).map((widgetConfig, index) => 
                    renderWidget(widgetConfig.id, index)
                  )}
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