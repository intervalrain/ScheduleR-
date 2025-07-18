"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTaskRefresh } from "@/context/TaskContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  status: string;
}

export default function Sidebar() {
  const { data: session, status } = useSession();
  const { refreshTrigger } = useTaskRefresh();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_PROGRESS');

  useEffect(() => {
    // Only fetch if user is authenticated
    if (status === "loading") return; // Still loading
    if (!session) {
      // Not authenticated, use mock data
      const allMockTasks: Task[] = [
        { id: "task1", title: "Implement Login", status: "IN_PROGRESS" },
        { id: "task2", title: "Design Database", status: "IN_PROGRESS" },
        { id: "task3", title: "Setup CI/CD", status: "TODO" },
        { id: "task4", title: "Write Tests", status: "REVIEW" },
        { id: "task5", title: "Deploy to Production", status: "DONE" },
      ];
      const filteredMockTasks = allMockTasks.filter(task => task.status === selectedStatus);
      setTasks(filteredMockTasks);
      return;
    }

    // Fetch tasks by status from API
    const fetchTasksByStatus = async (status: string) => {
      try {
        const response = await fetch(`/api/tasks?status=${status}`);
        if (response.ok) {
          const fetchedTasks = await response.json();
          setTasks(fetchedTasks);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch tasks:', response.status, errorText);
          // Fallback to mock data
          const mockTasks: Task[] = [
            { id: "task1", title: "Implement Login", status },
            { id: "task2", title: "Design Database", status },
            { id: "task3", title: "Setup CI/CD", status },
          ];
          setTasks(mockTasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback to mock data
        const mockTasks: Task[] = [
          { id: "task1", title: "Implement Login", status },
          { id: "task2", title: "Design Database", status },
          { id: "task3", title: "Setup CI/CD", status },
        ];
        setTasks(mockTasks);
      }
    };

    fetchTasksByStatus(selectedStatus);
  }, [session, status, refreshTrigger, selectedStatus]);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
  };

  const onDragEnd = async (result: {
    destination?: { droppableId: string; index: number } | null;
    source: { droppableId: string; index: number };
    draggableId: string;
  }) => {
    const { destination, source } = result;

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
    const [reorderedItem] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, reorderedItem);

    // Optimistically update the UI
    setTasks(newTasks);

    // Update task order via API
    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: newTasks.map(task => task.id) }),
      });

      if (!response.ok) {
        console.error('Failed to reorder tasks');
        // Revert the optimistic update on failure
        // In a real app, you might want to show a toast notification
        window.location.reload(); // Simple revert for now
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert the optimistic update on failure
      window.location.reload(); // Simple revert for now
    }
  };

  return (
    <aside className="w-64 p-6 bg-sidebar border-r border-sidebar-border">
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
            <SelectItem value="TODO">📋 Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">⚡ Ongoing</SelectItem>
            <SelectItem value="REVIEW">👀 Review</SelectItem>
            <SelectItem value="DONE">✅ Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sidebar-tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {tasks.map((task, index) => (
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
    </aside>
  );
}