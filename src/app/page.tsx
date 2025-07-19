"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isPast } from "date-fns";
import { useSession } from "next-auth/react";
import { mockSprints, mockTasks, getMockTasksBySprintId } from "@/lib/mockData";
import { EditSprintDialog } from "@/components/EditSprintDialog";
import { CalendarIcon, EditIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, ClockIcon, CheckCircleIcon, BarChart3Icon, HeartIcon, UsersIcon, ZapIcon, AlertTriangleIcon, GitBranchIcon, MessageSquareIcon, FileTextIcon, TargetIcon, TrendingDownIcon } from "lucide-react";

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

export default function Home() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetConfig[]>([]);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Always fetch sprints, regardless of session status
    fetchSprints();
    
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
        // Default enabled widgets
        const defaultWidgets = [
          { id: "completion-rate" },
          { id: "task-summary" },
          { id: "hours-summary" },
          { id: "sprint-health" },
          { id: "progress-chart" },
          { id: "team-workload" }
        ];
        setEnabledWidgets(defaultWidgets);
      }
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
  }, [selectedSprint, session]);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      
      if (!session) {
        // Use mock data when not authenticated
        setSprints(mockSprints);
        const now = new Date();
        const activeSprint = mockSprints.find((sprint) => {
          const start = new Date(sprint.startDate);
          const end = new Date(sprint.endDate);
          return now >= start && now <= end;
        });
        setSelectedSprint(activeSprint || mockSprints[0]);
        return;
      }
      
      const response = await fetch("/api/sprints");
      if (response.ok) {
        const data = await response.json();
        setSprints(data);
        if (data.length > 0) {
          // Find current active sprint or use the first one
          const now = new Date();
          const activeSprint = data.find((sprint: Sprint) => {
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            return now >= start && now <= end;
          });
          setSelectedSprint(activeSprint || data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sprints:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForSprint = async (sprintId: string) => {
    try {
      if (!session) {
        // Use mock data when not authenticated
        const mockSprintTasks = getMockTasksBySprintId(sprintId);
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
  };

  const handleEditSprint = () => {
    if (selectedSprint) {
      setEditDialogOpen(true);
    }
  };


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
        case 'sprint-health':
          widgets.push({
            id: 'sprint-health',
            title: 'Sprint Health',
            icon: <HeartIcon className="w-4 h-4" />,
            value: progressPercentage > 80 ? 'Excellent' : progressPercentage > 60 ? 'Good' : progressPercentage > 40 ? 'Fair' : 'Poor',
            description: 'Sprint progress',
            color: progressPercentage > 60 ? 'text-green-600' : progressPercentage > 40 ? 'text-yellow-600' : 'text-red-600'
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

  if (loading) {
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
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sprint Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor and manage your current sprint progress
          </p>
        </div>
        
        {sprints.length > 1 && (
          <Select 
            value={selectedSprint?.id || ''} 
            onValueChange={(value) => {
              const sprint = sprints.find(s => s.id === value);
              if (sprint) {
                setSelectedSprint(sprint);
              }
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                <div className="relative overflow-hidden">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentWidgetIndex * 100}%)` }}
                  >
                    {Array.from({ length: Math.ceil(widgetData.length / 4) }, (_, pageIndex) => (
                      <div key={pageIndex} className="w-full flex-shrink-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {widgetData
                            .slice(pageIndex * 4, (pageIndex + 1) * 4)
                            .map((widget) => (
                              <Card key={widget.id} className="text-center">
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
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Page indicators */}
                {Math.ceil(widgetData.length / 4) > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.ceil(widgetData.length / 4) }, (_, pageIndex) => (
                      <button
                        key={pageIndex}
                        onClick={() => handleWidgetClick(pageIndex)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          pageIndex === currentWidgetIndex 
                            ? 'bg-primary' 
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                      />
                    ))}
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
                  <div className="text-2xl font-bold text-gray-500 mb-1">{todoTasks}</div>
                  <div className="text-sm text-muted-foreground">📋 Pending</div>
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
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{reviewTasks}</div>
                  <div className="text-sm text-muted-foreground">👀 Review</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{completedTasks}</div>
                  <div className="text-sm text-muted-foreground">✅ Done</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Sprint Dialog */}
          <EditSprintDialog
            sprint={selectedSprint}
            isOpen={editDialogOpen}
            setIsOpen={setEditDialogOpen}
            onSprintUpdated={fetchSprints}
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