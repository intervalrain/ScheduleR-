"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTaskRefresh } from "@/context/TaskContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon, UserIcon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  estimatedHours?: number;
  assignee?: User;
  createdBy?: User;
  subtasks?: { id: string; isCompleted: boolean }[];
  completionPercentage?: number;
}

export default function KanbanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { refreshTrigger, triggerRefresh } = useTaskRefresh();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session, refreshTrigger]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
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

  const onDragEnd = async (result: {
    destination?: { droppableId: string; index: number } | null;
    source: { droppableId: string; index: number };
    draggableId: string;
  }) => {
    const { destination, source, draggableId } = result;

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
    
    // Get tasks in the destination column, sorted by priority (excluding the dragged task)
    const destTasks = tasks
      .filter(task => task.status === destStatus && task.id !== draggableId)
      .sort((a, b) => parseInt(a.priority || "1000000") - parseInt(b.priority || "1000000"));
    
    console.log('Destination tasks:', destTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority })));

    let newPriority: string;
    let targetIndex = destination.index;
    
    // Adjust index if we're moving within the same column
    if (sourceStatus === destStatus) {
      const draggedTaskIndex = tasks
        .filter(task => task.status === destStatus)
        .sort((a, b) => parseInt(a.priority || "1000000") - parseInt(b.priority || "1000000"))
        .findIndex(task => task.id === draggableId);
      
      if (draggedTaskIndex !== -1 && draggedTaskIndex < destination.index) {
        targetIndex = destination.index - 1;
      }
    }
    
    console.log('Target index adjusted to:', targetIndex);
    
    if (destTasks.length === 0) {
      // First task in empty column
      newPriority = "1000000";
      console.log('Empty column, using default priority:', newPriority);
    } else if (targetIndex === 0) {
      // Moving to top of column
      const firstTaskPriority = parseInt(destTasks[0].priority || "1000000");
      newPriority = Math.max(100000, firstTaskPriority - 100000).toString();
      console.log('Moving to top, new priority:', newPriority, 'first task priority:', firstTaskPriority);
    } else if (targetIndex >= destTasks.length) {
      // Moving to bottom of column
      const lastTaskPriority = parseInt(destTasks[destTasks.length - 1].priority || "1000000");
      newPriority = (lastTaskPriority + 100000).toString();
      console.log('Moving to bottom, new priority:', newPriority, 'last task priority:', lastTaskPriority);
    } else {
      // Moving between two tasks
      const prevTaskPriority = parseInt(destTasks[targetIndex - 1].priority || "1000000");
      const nextTaskPriority = parseInt(destTasks[targetIndex].priority || "1000000");
      newPriority = Math.floor((prevTaskPriority + nextTaskPriority) / 2).toString();
      
      console.log('Moving between tasks:', {
        prevPriority: prevTaskPriority,
        nextPriority: nextTaskPriority,
        calculatedPriority: newPriority
      });
      
      // Ensure we don't get the same priority as existing tasks
      if (newPriority === prevTaskPriority.toString() || newPriority === nextTaskPriority.toString()) {
        newPriority = (prevTaskPriority + Math.floor((nextTaskPriority - prevTaskPriority) / 3)).toString();
        console.log('Adjusted priority to avoid conflict:', newPriority);
      }
    }

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
    return tasks
      .filter((task) => task.status === status)
      .sort((a, b) => parseInt(a.priority || "1000000") - parseInt(b.priority || "1000000"));
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'outline';
    const priorityNum = parseInt(priority);
    if (priorityNum < 600000) return 'destructive'; // High priority
    if (priorityNum < 800000) return 'default';     // Medium priority
    return 'secondary'; // Low priority
  };

  const handleTaskClick = (taskId: string) => {
    console.log('Kanban: Task clicked:', taskId, 'Type:', typeof taskId);
    router.push(`/workspace/${taskId}`);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to view your kanban board.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
        <div className="text-sm text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => {
            const statusTasks = getTasksByStatus(status);
            const statusLabels = {
              "TODO": "To Do",
              "IN_PROGRESS": "In Progress", 
              "REVIEW": "Review",
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
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-shadow hover:shadow-md cursor-pointer ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                              onClick={() => {
                                // Only navigate if not dragging
                                if (!snapshot.isDragging) {
                                  handleTaskClick(task.id);
                                }
                              }}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-medium leading-tight">{task.title}</h3>
                                  {task.priority && parseInt(task.priority) < 700000 && (
                                    <Badge 
                                      variant={getPriorityColor(task.priority) as 'default' | 'destructive' | 'secondary' | 'outline'}
                                      className="text-xs shrink-0"
                                    >
                                      High Priority
                                    </Badge>
                                  )}
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
                                  
                                  {task.estimatedHours && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <ClockIcon className="w-3 h-3" />
                                      <span className="text-xs">{task.estimatedHours}h</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Progress bar for subtasks completion */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-muted-foreground">
                                        Progress ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length})
                                      </span>
                                      <span className="text-xs font-medium">
                                        {task.completionPercentage}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                          task.completionPercentage === 100 ? 'bg-green-500' : 
                                          task.completionPercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${task.completionPercentage}%` }}
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
    </div>
  );
}