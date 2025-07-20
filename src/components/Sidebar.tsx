"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTaskRefresh } from "@/context/TaskContext";
import { useSprint } from "@/context/SprintContext";
import { useSidebar } from "@/context/SidebarContext";
import { getMockTasksByStatus } from "@/lib/mockData";
import { sortByPriorityDescending, calculateDragPriority, needsRebalancing, rebalancePriorities, INITIAL_PRIORITY } from "@/lib/priorityUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: number;
}

export default function Sidebar() {
  const { data: session, status } = useSession();
  const { refreshTrigger, deletedTaskIds } = useTaskRefresh();
  const { selectedSprintId } = useSprint();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_PROGRESS');

  // Status color mapping
  const statusColors = {
    'DONE': 'bg-green-500',
    'REVIEW': 'bg-yellow-500', 
    'IN_PROGRESS': 'bg-blue-500',
    'TODO': 'bg-gray-400'
  };

  const statusLabels = {
    'DONE': '✅ Done',
    'REVIEW': '👀 Reviewing',
    'IN_PROGRESS': '⚡ In Progress',
    'TODO': '📋 To Do'
  };

  // Filter out deleted tasks from the current task list
  const filteredTasks = tasks.filter(task => !deletedTaskIds.includes(task.id));

  useEffect(() => {
    // Only fetch if user is authenticated and sprint is selected
    if (status === "loading") return; // Still loading
    
    const fetchTasks = async () => {
      if (!session) {
        // Not authenticated, use mock data
        const mockTasks = getMockTasksByStatus(selectedStatus, selectedSprintId || undefined);
        setTasks(mockTasks);
        return;
      }

      // Fetch tasks by status from API
      if (!selectedSprintId) return;
      
      try {
        console.log('Sidebar: Fetching tasks for status:', selectedStatus, 'sprint:', selectedSprintId, 'trigger:', refreshTrigger);
        const response = await fetch(`/api/tasks?status=${selectedStatus}&sprintId=${selectedSprintId}`, {
          // Add cache busting to ensure fresh data
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (response.ok) {
          const fetchedTasks: Task[] = await response.json();
          console.log('Sidebar: Fetched tasks:', fetchedTasks.length);
          // Sort tasks by priority in descending order
          const sortedTasks = sortByPriorityDescending(fetchedTasks);
          setTasks(sortedTasks);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch tasks:', response.status, errorText);
          // Fallback to mock data
          const mockTasks: Task[] = [
            { id: "task1", title: "Implement Login", status: selectedStatus },
            { id: "task2", title: "Design Database", status: selectedStatus },
            { id: "task3", title: "Setup CI/CD", status: selectedStatus },
          ];
          setTasks(mockTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback to mock data
        const mockTasks: Task[] = [
          { id: "task1", title: "Implement Login", status: selectedStatus },
          { id: "task2", title: "Design Database", status: selectedStatus },
          { id: "task3", title: "Setup CI/CD", status: selectedStatus },
        ];
        setTasks(mockTasks);
      }
    };

    fetchTasks();
  }, [session, status, selectedSprintId, refreshTrigger, selectedStatus]);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
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

    // Find the task being dragged
    const draggedTask = tasks.find(t => t.id === draggableId);
    if (!draggedTask) return;

    // Get current priorities
    const priorities = tasks.map(t => t.priority ?? INITIAL_PRIORITY);
    
    // Calculate new priority based on destination
    const newPriority = calculateDragPriority(priorities, source.index, destination.index);
    
    // Update the dragged task with new priority
    const updatedTask = { ...draggedTask, priority: newPriority };
    
    // Create new array with updated task
    const newTasks = tasks.filter(t => t.id !== draggableId);
    newTasks.splice(destination.index, 0, updatedTask);
    
    // Sort by priority to ensure correct order
    const sortedTasks = sortByPriorityDescending(newTasks);
    setTasks(sortedTasks);

    // Update task priority via API
    try {
      const response = await fetch(`/api/tasks/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        console.error('Failed to update task priority');
        window.location.reload();
      } else {
        // Check if we need to rebalance
        const newPriorities = sortedTasks.map(t => t.priority ?? INITIAL_PRIORITY);
        if (needsRebalancing(newPriorities)) {
          console.log('Priority collision detected, triggering rebalance');
          await rebalanceAllTasks(sortedTasks);
        }
      }
    } catch (error) {
      console.error('Error updating task priority:', error);
      window.location.reload();
    }
  };

  // Function to rebalance all tasks when priorities collide
  const rebalanceAllTasks = async (tasksToRebalance: Task[]) => {
    const newPriorities = rebalancePriorities(tasksToRebalance.length);
    
    // Update all tasks with new priorities
    const rebalancedTasks = tasksToRebalance.map((task, index) => ({
      ...task,
      priority: newPriorities[index]
    }));
    
    setTasks(rebalancedTasks);
    
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
      console.log('Successfully rebalanced all task priorities');
    } catch (error) {
      console.error('Error rebalancing tasks:', error);
      window.location.reload();
    }
  };

  return (
    <aside className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Collapse/Expand Button */}
      <div className="flex justify-end p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
          title={isCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar Content */}
      <div className={`px-6 pb-6 ${isCollapsed ? 'hidden' : 'block'}`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-sidebar-foreground uppercase tracking-wider">
              Tasks
            </h2>
          </div>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DONE">✅ Done</SelectItem>
              <SelectItem value="REVIEW">👀 Reviewing</SelectItem>
              <SelectItem value="IN_PROGRESS">⚡ In Progress</SelectItem>
              <SelectItem value="TODO">📋 To Do</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="sidebar-tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {filteredTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <Link href={`/workspace/${task.id}`}>
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="group bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 border border-border/40 hover:border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity ${
                              task.status === 'DONE' ? 'bg-green-500' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                              task.status === 'REVIEW' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="px-2 space-y-3">
          {/* Color Status Selector */}
          <div className="space-y-1">
            {Object.entries(statusColors).map(([status, colorClass]) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedStatus(status)}
                    className={`w-8 h-3 rounded-full transition-all duration-200 ${colorClass} ${
                      selectedStatus === status 
                        ? 'ring-2 ring-primary ring-offset-1 scale-110' 
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    title={statusLabels[status as keyof typeof statusLabels]}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{statusLabels[status as keyof typeof statusLabels]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Task Icons with Tooltips */}
          <div className="border-t border-border/40 pt-2 space-y-2">
            {filteredTasks.slice(0, 3).map((task) => (
              <Tooltip key={task.id}>
                <TooltipTrigger asChild>
                  <Link href={`/workspace/${task.id}`}>
                    <div className="w-8 h-8 rounded-md bg-white border border-border/40 hover:border-primary/20 transition-colors flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${statusColors[task.status as keyof typeof statusColors] || 'bg-gray-400'}`}></div>
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {statusLabels[task.status as keyof typeof statusLabels] || task.status}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view details</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {filteredTasks.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-md bg-muted border border-border/40 flex items-center justify-center cursor-pointer">
                    <span className="text-xs text-muted-foreground">+{filteredTasks.length - 3}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{filteredTasks.length - 3} more tasks</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}