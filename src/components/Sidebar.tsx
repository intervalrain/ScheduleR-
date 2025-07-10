"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Task {
  id: string;
  title: string;
  status: string;
}

export default function Sidebar() {
  const [ongoingTasks, setOngoingTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Placeholder for fetching ongoing tasks from API
    // In a real application, you would fetch tasks for the current sprint with status "Ongoing"
    const fetchedTasks: Task[] = [
      { id: "task1", title: "Implement Login", status: "Ongoing" },
      { id: "task2", title: "Design Database", status: "Ongoing" },
      { id: "task3", title: "Setup CI/CD", status: "Ongoing" },
    ];
    setOngoingTasks(fetchedTasks);
  }, []);

  const onDragEnd = (result: any) => {
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

    const newTasks = Array.from(ongoingTasks);
    const [reorderedItem] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, reorderedItem);

    setOngoingTasks(newTasks);

    // Placeholder for updating task order via API
    // fetch("/api/tasks/reorder", {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ tasks: newTasks.map(task => task.id) }),
    // });
  };

  return (
    <aside className="w-64 p-6 bg-sidebar border-r border-sidebar-border">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-sidebar-foreground uppercase tracking-wider">
          Ongoing Tasks
        </h2>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="ongoing-tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {ongoingTasks.map((task, index) => (
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
                          <div className="w-2 h-2 bg-primary rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
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