"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";
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
}

export default function KanbanPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const fetchedTasks = await response.json();
        setTasks(fetchedTasks);
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

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newTasks = Array.from(tasks);
    const draggedTask = newTasks.find((task) => task.id === draggableId);

    if (draggedTask) {
      const oldStatus = draggedTask.status;
      draggedTask.status = destination.droppableId;
      setTasks(newTasks);

      // Update task status via API
      try {
        const response = await fetch(`/api/tasks/${draggableId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: destination.droppableId }),
        });
        
        if (!response.ok) {
          // Revert the change if API call fails
          draggedTask.status = oldStatus;
          setTasks([...newTasks]);
          console.error('Failed to update task status');
        }
      } catch (error) {
        // Revert the change if API call fails
        draggedTask.status = oldStatus;
        setTasks([...newTasks]);
        console.error('Error updating task status:', error);
      }
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["TODO", "IN_PROGRESS", "DONE"].map((status) => {
            const statusTasks = getTasksByStatus(status);
            const statusLabels = {
              "TODO": "To Do",
              "IN_PROGRESS": "In Progress", 
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
                              className={`transition-shadow hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-medium leading-tight">{task.title}</h3>
                                  {task.priority && (
                                    <Badge 
                                      variant={getPriorityColor(task.priority) as 'default' | 'destructive' | 'secondary' | 'outline'}
                                      className="text-xs shrink-0"
                                    >
                                      {task.priority}
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