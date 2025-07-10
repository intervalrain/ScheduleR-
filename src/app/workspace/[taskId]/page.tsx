"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, CheckIcon, ClockIcon, TagIcon } from "lucide-react";

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
  createdAt?: string;
  updatedAt?: string;
}

interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Note {
  id: string;
  content: string;
  createdAt?: string;
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Ongoing": return "bg-blue-100 text-blue-800";
      case "Done": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-orange-100 text-orange-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{task.name}</h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              {task.priority && (
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
              )}
              {task.estimateHours && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {task.estimateHours}h
                </Badge>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{task.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags and Labels */}
        {(task.tags?.length || task.labels?.length) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags & Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.tags?.length && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {task.labels?.length && (
                <div>
                  <p className="text-sm font-medium mb-2">Labels:</p>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((label, index) => (
                      <Badge key={index} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sub-tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sub-tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {task.subTasks?.map((subTask) => (
              <div key={subTask.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  checked={subTask.isCompleted}
                  onCheckedChange={() => handleToggleSubTask(subTask.id)}
                />
                <span className={`flex-1 ${subTask.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {subTask.title}
                </span>
                {subTask.isCompleted && (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                )}
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="flex gap-2">
            <Input
              placeholder="Add a new sub-task..."
              value={newSubTaskTitle}
              onChange={(e) => setNewSubTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubTask()}
              className="flex-1"
            />
            <Button onClick={handleAddSubTask} size="sm">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {task.notes?.map((note) => (
              <div key={note.id} className="p-4 rounded-lg border bg-muted/30">
                <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                {note.createdAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleAddNote} size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}