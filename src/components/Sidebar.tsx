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
    <aside className="w-64 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Ongoing Tasks</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="ongoing-tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {ongoingTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <Link href={`/workspace/${task.id}`}>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-3 mb-2 rounded shadow cursor-pointer hover:bg-gray-50"
                      >
                        {task.title}
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