"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Task {
  id: string;
  title: string;
  status: string;
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Placeholder for fetching tasks from API
    // In a real application, you would fetch tasks for the current sprint
    const fetchedTasks: Task[] = [
      { id: "1", title: "Task 1", status: "Pending" },
      { id: "2", title: "Task 2", status: "Queueing" },
      { id: "3", title: "Task 3", status: "Done" },
      { id: "4", title: "Task 4", status: "Pending" },
    ];
    setTasks(fetchedTasks);
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

    const newTasks = Array.from(tasks);
    const draggedTask = newTasks.find((task) => task.id === draggableId);

    if (draggedTask) {
      draggedTask.status = destination.droppableId;
      setTasks(newTasks);

      // Placeholder for updating task status via API
      // fetch(`/api/tasks/${draggableId}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ status: destination.droppableId }),
      // });
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4">
          {["Pending", "Queueing", "Done"].map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 bg-gray-100 p-4 rounded-lg min-h-[200px]"
                >
                  <h2 className="text-xl font-semibold mb-2">{status}</h2>
                  {getTasksByStatus(status).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-3 mb-2 rounded shadow"
                        >
                          {task.title}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}