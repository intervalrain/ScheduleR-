"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTaskRefresh } from "@/context/TaskContext";
import { useSprint } from "@/context/SprintContext";
import { useMultiSelect } from "@/context/MultiSelectContext";
import { getMockTasksBySprintId, getMockSubTasksByTaskId } from "@/lib/mockData";
import { sortByPriorityDescending, calculateDragPriority, needsRebalancing, rebalancePriorities, INITIAL_PRIORITY } from "@/lib/priorityUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import { BulkMoveToolbar } from "@/components/BulkMoveToolbar";
import { ClockIcon, UserIcon, Trash2Icon, MoreVerticalIcon, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: number;
  estimatedHours?: number;
  assignee?: User;
  createdBy?: User;
  subtasks?: { id: string; isCompleted: boolean }[];
  completionPercentage?: number;
}

export default function KanbanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { refreshTrigger, triggerRefresh, deletedTaskIds } = useTaskRefresh();
  const { selectedSprintId } = useSprint();
  const { 
    isMultiSelectMode, 
    setMultiSelectMode, 
    toggleTaskSelection, 
    isTaskSelected 
  } = useMultiSelect();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: string, title: string} | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Filter out deleted tasks
  const filteredTasks = tasks.filter(task => !deletedTaskIds.includes(task.id));

  useEffect(() => {
    if (selectedSprintId) {
      fetchTasks();
    }
    fetchSprints();
  }, [session, selectedSprintId, refreshTrigger]);

  const fetchTasks = async () => {
    if (!selectedSprintId) return;
    
    try {
      if (!session) {
        // Use mock data when not authenticated
        const mockTasks = getMockTasksBySprintId(selectedSprintId);
        
        // Add completion percentage for mock tasks
        const tasksWithCompletion = await Promise.all(
          mockTasks.map(async (task) => {
            const subtasks = getMockSubTasksByTaskId(task.id);
            const completedSubtasks = subtasks.filter(st => st.isCompleted).length;
            const totalSubtasks = subtasks.length;
            const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
            
            return {
              ...task,
              subtasks,
              completionPercentage
            };
          })
        );
        
        setTasks(tasksWithCompletion);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/tasks?sprintId=${selectedSprintId}`);
      if (response.ok) {
        const fetchedTasks = await response.json();
        
        // Fetch subtasks for each task to calculate completion
        const tasksWithCompletion = await Promise.all(
          fetchedTasks.map(async (task: Task) => {
            try {
              const subtasksResponse = await fetch(`/api/tasks/${task.id}/subtasks`);
              if (subtasksResponse.ok) {
                const subtasks = await subtasksResponse.json();
                const completedSubtasks = subtasks.filter((st: any) => st.isCompleted).length;
                const totalSubtasks = subtasks.length;
                const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                
                return {
                  ...task,
                  subtasks,
                  completionPercentage
                };
              }
              return { ...task, subtasks: [], completionPercentage: 0 };
            } catch (error) {
              console.error(`Error fetching subtasks for task ${task.id}:`, error);
              return { ...task, subtasks: [], completionPercentage: 0 };
            }
          })
        );
        
        setTasks(tasksWithCompletion);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async () => {
    try {
      if (!session) {
        // Use mock sprints when not authenticated
        setSprints([
          { id: 'sprint-1', name: 'Sprint 1' },
          { id: 'sprint-2', name: 'Sprint 2' },
          { id: 'sprint-3', name: 'Sprint 3' }
        ]);
        return;
      }

      const response = await fetch('/api/sprints');
      if (response.ok) {
        const fetchedSprints = await response.json();
        setSprints(fetchedSprints);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const onDragEnd = async (result: {
    destination?: { droppableId: string; index: number } | null;
    source: { droppableId: string; index: number };
    draggableId: string;
  }) => {
    const { destination, source, draggableId } = result;

    // Disable drag operations when not authenticated or in multi-select mode
    if (!session || isMultiSelectMode) {
      console.log('Not authenticated or in multi-select mode, canceling drag operation');
      return;
    }

    console.log('Drag result:', { destination, source, draggableId });

    if (!destination) {
      console.log('No destination, canceling drag');
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Same position, no change needed');
      return;
    }

    const draggedTask = tasks.find((task) => task.id === draggableId);
    if (!draggedTask) {
      console.log('Dragged task not found:', draggableId);
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    
    console.log('Task move:', {
      taskId: draggableId,
      from: { status: sourceStatus, index: source.index },
      to: { status: destStatus, index: destination.index }
    });
    
    // Get tasks in the destination column, sorted by priority in descending order
    const destTasks = sortByPriorityDescending(
      tasks.filter(task => task.status === destStatus && task.id !== draggableId)
    );
    
    console.log('Destination tasks:', destTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority })));

    // Calculate priorities for all tasks in destination column
    const destPriorities = destTasks.map(t => t.priority ?? INITIAL_PRIORITY);
    
    // Find source index for priority calculation
    const sourceIndex = tasks
      .filter(task => task.status === sourceStatus)
      .findIndex(task => task.id === draggableId);
    
    // Calculate new priority using sparse sorting algorithm
    const newPriority = calculateDragPriority(destPriorities, sourceIndex, destination.index);
    
    console.log('Calculated new priority:', newPriority, 'for position:', destination.index);

    // Update task locally
    const newTasks = tasks.map(task => 
      task.id === draggableId 
        ? { ...task, status: destStatus, priority: newPriority }
        : task
    );
    setTasks(newTasks);

    // Update task via API
    try {
      const updateData: any = { priority: newPriority };
      if (sourceStatus !== destStatus) {
        updateData.status = destStatus;
      }

      console.log('Updating task via API:', { taskId: draggableId, updateData });

      const response = await fetch(`/api/tasks/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API update failed:', response.status, errorText);
        // Revert the change if API call fails
        setTasks(tasks);
      } else {
        const result = await response.json();
        console.log('Task updated successfully:', result);
        
        // Check if we need to rebalance priorities in this column
        const columnTasks = newTasks.filter(t => t.status === destStatus);
        const priorities = sortByPriorityDescending(columnTasks).map(t => t.priority ?? INITIAL_PRIORITY);
        
        if (needsRebalancing(priorities)) {
          console.log('Priority collision detected in column', destStatus, ', triggering rebalance');
          await rebalanceColumnTasks(destStatus, columnTasks);
        }
        
        // Trigger refresh for sidebar and other components
        triggerRefresh();
      }
    } catch (error) {
      // Revert the change if API call fails
      setTasks(tasks);
      console.error('Error updating task:', error);
    }
  };

  const getTasksByStatus = (status: string) => {
    const statusTasks = filteredTasks.filter((task) => task.status === status);
    // Use descending order for display (higher priority value = higher position)
    return sortByPriorityDescending(statusTasks);
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'outline';
    if (priority < 600000) return 'destructive'; // High priority
    if (priority < 800000) return 'default';     // Medium priority
    return 'secondary'; // Low priority
  };

  const handleTaskClick = (taskId: string, event?: React.MouseEvent) => {
    // Handle multi-select mode
    if (isMultiSelectMode) {
      event?.stopPropagation();
      toggleTaskSelection(taskId);
      return;
    }

    // Disable task navigation when not authenticated
    if (!session) {
      console.log('Not authenticated, task click disabled');
      return;
    }
    
    console.log('Kanban: Task clicked:', taskId, 'Type:', typeof taskId);
    router.push(`/workspace/${taskId}`);
  };

  const handleLongPress = (taskId: string) => {
    if (!session) return;
    
    // Enter multi-select mode and select the task
    setMultiSelectMode(true);
    toggleTaskSelection(taskId);
  };

  const handleMouseDown = (taskId: string) => {
    if (!session || isMultiSelectMode) return;
    
    const timer = setTimeout(() => {
      handleLongPress(taskId);
    }, 800); // 800ms for long press
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete({ id: task.id, title: task.title });
    setDeleteDialogOpen(true);
  };

  const handleTaskDeleted = () => {
    console.log('Task deleted, refreshing task list');
    triggerRefresh();
    fetchTasks();
  };

  // Function to rebalance all tasks in a column when priorities collide
  const rebalanceColumnTasks = async (status: string, columnTasks: Task[]) => {
    const sortedTasks = sortByPriorityDescending(columnTasks);
    const newPriorities = rebalancePriorities(sortedTasks.length);
    
    // Update all tasks with new priorities
    const rebalancedTasks = sortedTasks.map((task, index) => ({
      ...task,
      priority: newPriorities[index]
    }));
    
    // Update local state
    setTasks(prevTasks => {
      const otherTasks = prevTasks.filter(t => t.status !== status);
      return [...otherTasks, ...rebalancedTasks];
    });
    
    // Update all tasks in the backend
    try {
      const updatePromises = rebalancedTasks.map(task =>
        fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority: task.priority }),
        })
      );
      
      await Promise.all(updatePromises);
      console.log('Successfully rebalanced priorities for column:', status);
      triggerRefresh();
    } catch (error) {
      console.error('Error rebalancing tasks:', error);
      // Refresh to get correct state from server
      fetchTasks();
    }
  };

  // Remove early return for !session to allow demo mode

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!session && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800">Demo Mode</h3>
              <p className="text-xs text-amber-700">
                You're viewing demo data. Sign in to create and manage your own tasks. 
                <span className="font-medium"> Drag & drop and task clicks are disabled in demo mode.</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
        <div className="flex items-center gap-4">
          {session && (
            <Button
              variant={isMultiSelectMode ? "default" : "outline"}
              size="sm"
              onClick={() => setMultiSelectMode(!isMultiSelectMode)}
            >
              {isMultiSelectMode ? "取消選擇" : "選擇"}
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} total
          </div>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => {
            const statusTasks = getTasksByStatus(status);
            const statusLabels = {
              "TODO": "To Do",
              "IN_PROGRESS": "In Progress", 
              "REVIEW": "Reviewing",
              "DONE": "Done"
            };
            
            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{statusLabels[status as keyof typeof statusLabels]}</h2>
                  <Badge variant="outline">{statusTasks.length}</Badge>
                </div>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-3 p-4 rounded-lg border-2 border-dashed min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                      }`}
                    >
                      {statusTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                          isDragDisabled={!session || isMultiSelectMode}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-all ${
                                !session 
                                  ? 'opacity-75 cursor-not-allowed hover:shadow-none' 
                                  : 'hover:shadow-md cursor-pointer'
                              } ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              } ${
                                isMultiSelectMode && isTaskSelected(task.id) 
                                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                                  : ''
                              }`}
                              onClick={(event) => {
                                // Only navigate if not dragging
                                if (!snapshot.isDragging) {
                                  handleTaskClick(task.id, event);
                                }
                              }}
                              onMouseDown={() => handleMouseDown(task.id)}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1">
                                    {isMultiSelectMode && (
                                      <Checkbox
                                        checked={isTaskSelected(task.id)}
                                        onCheckedChange={() => toggleTaskSelection(task.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-1"
                                      />
                                    )}
                                    <h3 className="font-medium leading-tight flex-1">{task.title}</h3>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {session && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0 hover:bg-muted"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreVerticalIcon className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                          <DropdownMenuItem 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteTask(task);
                                            }}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash2Icon className="h-3 w-3 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                                
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-2">
                                    {task.assignee ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                                          <AvatarFallback className="text-xs">
                                            {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground truncate max-w-20">
                                          {task.assignee.name || task.assignee.email}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <UserIcon className="w-4 h-4" />
                                        <span className="text-xs">Unassigned</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <ClockIcon className="w-3 h-3" />
                                    <span className="text-xs">{task.estimatedHours || 0}h</span>
                                  </div>
                                </div>
                                
                                {/* Progress bar for subtasks completion */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-muted-foreground">
                                        Progress ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length})
                                      </span>
                                      <span className="text-xs font-medium">
                                        {task.completionPercentage || 0}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                          (task.completionPercentage || 0) === 100 ? 'bg-green-500' : 
                                          (task.completionPercentage || 0) >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${task.completionPercentage || 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        task={taskToDelete}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Bulk Move Toolbar */}
      <BulkMoveToolbar sprints={sprints} />
    </div>
  );
}