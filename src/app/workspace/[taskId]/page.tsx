"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  name: string;
  description?: string;
  estimateHours?: number;
  priority?: string;
  tags?: string[];
  labels?: string[];
  status: string;
  subTasks?: SubTask[];
  notes?: Note[];
}

interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Note {
  id: string;
  content: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    if (taskId) {
      fetch(`/api/workspace/task/${taskId}`)
        .then((res) => res.json())
        .then((data) => setTask(data));
    }
  }, [taskId]);

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim() || !task) return;

    // Placeholder for API call to add sub-task
    // const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ title: newSubTaskTitle }),
    // });
    // const newSubTask = await response.json();

    // Mock update
    const newSubTask: SubTask = {
      id: String(task.subTasks?.length || 0) + Date.now(),
      title: newSubTaskTitle,
      isCompleted: false,
    };

    setTask((prevTask) => {
      if (!prevTask) return null;
      return {
        ...prevTask,
        subTasks: [...(prevTask.subTasks || []), newSubTask],
      };
    });
    setNewSubTaskTitle("");
  };

  const handleToggleSubTask = async (subTaskId: string) => {
    if (!task) return;

    // Placeholder for API call to update sub-task status
    // const response = await fetch(`/api/tasks/${task.id}/subtasks/${subTaskId}`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ isCompleted: !subTask.isCompleted }),
    // });
    // const updatedSubTask = await response.json();

    setTask((prevTask) => {
      if (!prevTask) return null;
      return {
        ...prevTask,
        subTasks: prevTask.subTasks?.map((st) =>
          st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
        ),
      };
    });
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !task) return;

    // Placeholder for API call to add note
    // const response = await fetch(`/api/tasks/${task.id}/notes`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ content: newNoteContent }),
    // });
    // const newNote = await response.json();

    // Mock update
    const newNote: Note = {
      id: String(task.notes?.length || 0) + Date.now(),
      content: newNoteContent,
    };

    setTask((prevTask) => {
      if (!prevTask) return null;
      return {
        ...prevTask,
        notes: [...(prevTask.notes || []), newNote],
      };
    });
    setNewNoteContent("");
  };

  if (!task) {
    return <div className="p-6">Loading task...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{task.name}</h1>
      <p className="text-gray-600 mb-4">Status: {task.status}</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p>{task.description}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Details</h2>
        <ul>
          <li>Estimate: {task.estimateHours} hours</li>
          <li>Priority: {task.priority}</li>
          <li>Tags: {task.tags?.join(", ")}</li>
          <li>Labels: {task.labels?.join(", ")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Sub-tasks</h2>
        <ul>
          {task.subTasks?.map((subTask) => (
            <li key={subTask.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={subTask.isCompleted}
                onChange={() => handleToggleSubTask(subTask.id)}
              />
              <span>{subTask.title}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="New sub-task title"
            value={newSubTaskTitle}
            onChange={(e) => setNewSubTaskTitle(e.target.value)}
          />
          <Button onClick={handleAddSubTask}>Add Sub-task</Button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Notes</h2>
        <div>
          {task.notes?.map((note) => (
            <div key={note.id} className="border p-3 mb-2 rounded">
              {note.content}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <Textarea
            placeholder="New note content"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <Button onClick={handleAddNote}>Add Note</Button>
        </div>
      </div>
    </div>
  );
}