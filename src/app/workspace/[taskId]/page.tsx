"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteTaskDialog } from "@/components/DeleteTaskDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { 
  PlusIcon, 
  CheckIcon, 
  ClockIcon, 
  TagIcon, 
  EditIcon, 
  SaveIcon, 
  XIcon,
  UserIcon,
  CalendarIcon,
  AlertCircleIcon,
  HistoryIcon,
  LinkIcon,
  Trash2Icon,
  MaximizeIcon,
  MinimizeIcon,
  EyeIcon,
  FileTextIcon
} from "lucide-react";

// CSS for syntax highlighting
import "highlight.js/styles/github.css";

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
  estimatedHours?: number;
  priority?: number;
  tags?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  createdBy?: User;
  subTasks?: SubTask[];
  notes?: Note[];
  dependsOn?: Array<{ task: { id: string; title: string; status: string } }>;
  dependencyOf?: Array<{ dependsOn: { id: string; title: string; status: string } }>;
}

interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.taskId as string;
  
  // Task state
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: 0,
    estimatedHours: 0,
    assigneeId: ''
  });
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // Sub-task state
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [editingSubTask, setEditingSubTask] = useState<string | null>(null);
  const [editSubTaskTitle, setEditSubTaskTitle] = useState("");
  
  // Note state
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [notePreviewMode, setNotePreviewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  
  // Activity tracking
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Delete task state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (taskId && session) {
      fetchTask();
    }
  }, [taskId, session]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || '',
        priority: task.priority || 0,
        estimatedHours: task.estimatedHours || 0,
        assigneeId: task.assignee?.id || ''
      });
    }
  }, [task]);

  useEffect(() => {
    if (session) {
      fetchAvailableUsers();
    }
  }, [session]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Workspace: Fetching task with ID:', taskId, 'Type:', typeof taskId, 'Length:', taskId?.length);
      
      const url = `/api/workspace/task/${taskId}`;
      console.log('Fetch URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', response.status, errorText);
        throw new Error(`Failed to fetch task: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Task data received:', data);
      setTask(data);
    } catch (err) {
      console.error('Fetch task error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveTask = async () => {
    if (!task) return;
    
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        priority: editForm.priority,
        estimatedHours: editForm.estimatedHours,
        assigneeId: editForm.assigneeId || null
      };

      const response = await fetch(`/api/workspace/task/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const updatedTask = await response.json();
      
      // Update the task with the new assignee information
      const assignee = updateData.assigneeId ? availableUsers.find(u => u.id === updateData.assigneeId) : null;
      
      setTask({ 
        ...task, 
        ...updatedTask,
        assignee: assignee || null
      });
      setIsEditing(false);
      showSaveMessage('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err);
      showSaveMessage('Failed to update task');
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim() || !task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubTaskTitle }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subtask');
      }
      
      const newSubTask = await response.json();
      
      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          subTasks: [...(prevTask.subTasks || []), newSubTask],
        };
      });
      setNewSubTaskTitle("");
      showSaveMessage('Subtask added successfully!');
    } catch (err) {
      console.error('Error creating subtask:', err);
      showSaveMessage('Failed to create subtask');
    }
  };

  const handleToggleSubTask = async (subTaskId: string) => {
    if (!task) return;

    const subTask = task.subTasks?.find(st => st.id === subTaskId);
    if (!subTask) return;

    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !subTask.isCompleted }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subtask');
      }

      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          subTasks: prevTask.subTasks?.map((st) =>
            st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
          ),
        };
      });
      showSaveMessage(`Subtask ${subTask.isCompleted ? 'unchecked' : 'completed'}!`);
    } catch (err) {
      console.error('Error updating subtask:', err);
      showSaveMessage('Failed to update subtask');
    }
  };

  const handleEditSubTask = async (subTaskId: string) => {
    if (!editSubTaskTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editSubTaskTitle }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subtask');
      }

      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          subTasks: prevTask.subTasks?.map((st) =>
            st.id === subTaskId ? { ...st, title: editSubTaskTitle } : st
          ),
        };
      });
      setEditingSubTask(null);
      setEditSubTaskTitle("");
      showSaveMessage('Subtask updated successfully!');
    } catch (err) {
      console.error('Error updating subtask:', err);
      showSaveMessage('Failed to update subtask');
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return;
    
    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subtask');
      }

      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          subTasks: prevTask.subTasks?.filter((st) => st.id !== subTaskId),
        };
      });
      showSaveMessage('Subtask deleted successfully!');
    } catch (err) {
      console.error('Error deleting subtask:', err);
      showSaveMessage('Failed to delete subtask');
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create note');
      }
      
      const newNote = await response.json();
      
      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          notes: [newNote, ...(prevTask.notes || [])],
        };
      });
      setNewNoteContent("");
      showSaveMessage('Note added successfully!');
    } catch (err) {
      console.error('Error creating note:', err);
      showSaveMessage('Failed to create note');
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editNoteContent }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          notes: prevTask.notes?.map((note) =>
            note.id === noteId ? { ...note, content: editNoteContent } : note
          ),
        };
      });
      setEditingNote(null);
      setEditNoteContent("");
      showSaveMessage('Note updated successfully!');
    } catch (err) {
      console.error('Error updating note:', err);
      showSaveMessage('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setTask((prevTask) => {
        if (!prevTask) return null;
        return {
          ...prevTask,
          notes: prevTask.notes?.filter((note) => note.id !== noteId),
        };
      });
      showSaveMessage('Note deleted successfully!');
    } catch (err) {
      console.error('Error deleting note:', err);
      showSaveMessage('Failed to delete note');
    }
  };

  const handleDeleteTask = () => {
    setDeleteDialogOpen(true);
  };

  const handleTaskDeleted = () => {
    console.log('Task deleted, redirecting to kanban');
    router.push('/kanban');
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view task details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Task not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "default";
      case "IN_PROGRESS": return "secondary";
      case "DONE": return "outline";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority < 300000) return "destructive"; // High priority
    if (priority < 600000) return "default";     // Medium priority
    return "secondary";                          // Low priority
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (!task.subTasks || task.subTasks.length === 0) return 0;
    const completed = task.subTasks.filter(st => st.isCompleted).length;
    return Math.round((completed / task.subTasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {saveMessage}
        </div>
      )}
            
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="text-2xl font-bold"
                    placeholder="Task title"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <Select value={editForm.priority.toString()} onValueChange={(value) => setEditForm({...editForm, priority: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Estimated Hours</label>
                    <Input
                      type="number"
                      value={editForm.estimatedHours}
                      onChange={(e) => setEditForm({...editForm, estimatedHours: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Assignee</label>
                    <Select value={editForm.assigneeId || "unassigned"} onValueChange={(value) => setEditForm({...editForm, assigneeId: value === "unassigned" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={user.image || ''} alt={user.name} />
                                <AvatarFallback className="text-xs">
                                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.name || user.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-foreground flex-1">{task.title}</h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteTask}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2Icon className="w-4 h-4 mr-2" />
                    Delete Task
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(task.status) as any}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {task.priority && (
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority < 300000 ? 'High' : task.priority < 600000 ? 'Medium' : 'Low'} Priority
                    </Badge>
                  )}
                  {task.estimatedHours && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {task.estimatedHours}h
                    </Badge>
                  )}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckIcon className="w-3 h-3" />
                      {getProgressPercentage()}% Complete
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveTask} size="sm">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <XIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <EditIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        {/* Task Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <div className="flex items-center gap-2">
                    {task.createdBy && (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={task.createdBy.image || ''} alt={task.createdBy.name} />
                          <AvatarFallback className="text-xs">
                            {task.createdBy.name?.charAt(0) || task.createdBy.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.createdBy.name || task.createdBy.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={task.assignee.image || ''} alt={task.assignee.name} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.charAt(0) || task.assignee.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name || task.assignee.email}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(task.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm">{formatDate(task.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Task description... (Markdown supported)"
                className="min-h-[100px]"
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                {task.description ? (
                  <div className="text-foreground leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    >
                      {task.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dependencies Section */}
        {(task.dependsOn?.length || task.dependencyOf?.length) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.dependsOn?.length && (
                <div>
                  <p className="text-sm font-medium mb-2">Depends on:</p>
                  <div className="space-y-2">
                    {task.dependsOn.map((dep, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <Badge variant={getStatusColor(dep.task.status) as any} className="text-xs">
                          {dep.task.status}
                        </Badge>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm"
                          onClick={() => router.push(`/workspace/${dep.task.id}`)}
                        >
                          {dep.task.title}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {task.dependencyOf?.length && (
                <div>
                  <p className="text-sm font-medium mb-2">Blocking:</p>
                  <div className="space-y-2">
                    {task.dependencyOf.map((dep, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <Badge variant={getStatusColor(dep.dependsOn.status) as any} className="text-xs">
                          {dep.dependsOn.status}
                        </Badge>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm"
                          onClick={() => router.push(`/workspace/${dep.dependsOn.id}`)}
                        >
                          {dep.dependsOn.title}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags Section */}
        {task.tags?.length && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sub-tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Sub-tasks</span>
            {task.subTasks && task.subTasks.length > 0 && (
              <Badge variant="outline">
                {task.subTasks.filter(st => st.isCompleted).length} of {task.subTasks.length} completed
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {task.subTasks?.map((subTask) => (
              <div key={subTask.id} className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox
                  checked={subTask.isCompleted}
                  onCheckedChange={() => handleToggleSubTask(subTask.id)}
                />
                {editingSubTask === subTask.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editSubTaskTitle}
                      onChange={(e) => setEditSubTaskTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleEditSubTask(subTask.id);
                        if (e.key === 'Escape') {
                          setEditingSubTask(null);
                          setEditSubTaskTitle("");
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={() => handleEditSubTask(subTask.id)} size="sm">
                      <SaveIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => {
                        setEditingSubTask(null);
                        setEditSubTaskTitle("");
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className={`block ${subTask.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {subTask.title}
                      </span>
                      {subTask.createdBy && (
                        <div className="flex items-center gap-1 mt-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={subTask.createdBy.image || ''} alt={subTask.createdBy.name} />
                            <AvatarFallback className="text-xs">
                              {subTask.createdBy.name?.charAt(0) || subTask.createdBy.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {subTask.createdBy.name || subTask.createdBy.email} • {formatDate(subTask.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button 
                        onClick={() => {
                          setEditingSubTask(subTask.id);
                          setEditSubTaskTitle(subTask.title);
                        }} 
                        variant="ghost" 
                        size="sm"
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteSubTask(subTask.id)} 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {subTask.isCompleted && (
                      <CheckIcon className="w-4 h-4 text-green-600" />
                    )}
                  </>
                )}
              </div>
            ))}
            
            {(!task.subTasks || task.subTasks.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No sub-tasks yet. Add one below!</p>
            )}
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
            <Button onClick={handleAddSubTask} size="sm" disabled={!newSubTaskTitle.trim()}>
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Notes</span>
            <div className="flex items-center gap-2">
              {task.notes && task.notes.length > 0 && (
                <Badge variant="outline">
                  {task.notes.length} note{task.notes.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MaximizeIcon className="w-4 h-4 mr-2" />
                    Full Screen
                  </Button>
                </DialogTrigger>
                      <DialogContent className="max-w-6xl h-[90vh] p-0">
                        <DialogHeader className="p-6 pb-0">
                          <DialogTitle className="text-2xl font-bold">Notes - Full Screen Mode</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 p-6 pt-4 overflow-hidden">
                          <div className="h-full flex flex-col">
                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-4">
                              <Button
                                variant={notePreviewMode === 'edit' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setNotePreviewMode('edit')}
                              >
                                <EditIcon className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant={notePreviewMode === 'preview' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setNotePreviewMode('preview')}
                              >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                variant={notePreviewMode === 'split' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setNotePreviewMode('split')}
                              >
                                <MinimizeIcon className="w-4 h-4 mr-2" />
                                Split
                              </Button>
                            </div>
                            
                            {/* Full Screen Content */}
                            <div className="flex-1 min-h-0">
                              {notePreviewMode === 'edit' && (
                                <div className="h-full flex flex-col">
                                  <Textarea
                                    placeholder="Write your notes here... (Markdown supported)"
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    className="flex-1 min-h-0 text-base leading-relaxed resize-none font-mono"
                                  />
                                  <div className="flex gap-2 mt-4">
                                    <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                                      <SaveIcon className="w-4 h-4 mr-2" />
                                      Save Note
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {notePreviewMode === 'preview' && (
                                <div className="h-full overflow-auto bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
                                  <div className="prose prose-lg max-w-none dark:prose-invert">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                    >
                                      {newNoteContent || '# Preview\n\nStart typing to see your markdown preview...'}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              
                              {notePreviewMode === 'split' && (
                                <div className="h-full flex gap-4">
                                  <div className="flex-1 flex flex-col">
                                    <h3 className="text-lg font-semibold mb-2">Editor</h3>
                                    <Textarea
                                      placeholder="Write your notes here... (Markdown supported)"
                                      value={newNoteContent}
                                      onChange={(e) => setNewNoteContent(e.target.value)}
                                      className="flex-1 min-h-0 text-base leading-relaxed resize-none font-mono"
                                    />
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <h3 className="text-lg font-semibold mb-2">Preview</h3>
                                    <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                      <div className="prose prose-lg max-w-none dark:prose-invert">
                                        <ReactMarkdown 
                                          remarkPlugins={[remarkGfm]}
                                          rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                        >
                                          {newNoteContent || '# Preview\n\nStart typing to see your markdown preview...'}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {notePreviewMode !== 'edit' && (
                              <div className="flex gap-2 mt-4">
                                <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                                  <SaveIcon className="w-4 h-4 mr-2" />
                                  Save Note
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  {task.notes?.map((note) => (
                    <div key={note.id} className="group p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 hover:shadow-lg transition-all duration-200">
                      {editingNote === note.id ? (
                        <div className="space-y-4">
                          <div className="flex gap-2 mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotePreviewMode('edit')}
                            >
                              <EditIcon className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotePreviewMode('preview')}
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                          
                          {notePreviewMode === 'edit' ? (
                            <Textarea
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              className="min-h-[150px] text-base leading-relaxed font-mono"
                              placeholder="Edit your note... (Markdown supported)"
                              autoFocus
                            />
                          ) : (
                            <div className="min-h-[150px] p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <div className="prose prose-lg max-w-none dark:prose-invert">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                >
                                  {editNoteContent}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-3">
                            <Button onClick={() => handleEditNote(note.id)} className="px-6">
                              <SaveIcon className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button 
                              onClick={() => {
                                setEditingNote(null);
                                setEditNoteContent("");
                              }} 
                              variant="outline"
                              className="px-6"
                            >
                              <XIcon className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="prose prose-lg max-w-none dark:prose-invert">
                                <div className="text-slate-700 dark:text-slate-300">
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                  >
                                    {note.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                {note.createdBy && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6 ring-2 ring-emerald-200 dark:ring-emerald-800">
                                      <AvatarImage src={note.createdBy.image || ''} alt={note.createdBy.name} />
                                      <AvatarFallback className="text-xs font-medium">
                                        {note.createdBy.name?.charAt(0) || note.createdBy.email?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{note.createdBy.name || note.createdBy.email}</span>
                                  </div>
                                )}
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(note.createdAt)}</span>
                                {note.updatedAt !== note.createdAt && (
                                  <>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">edited {formatDate(note.updatedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <Button 
                                onClick={() => {
                                  setEditingNote(note.id);
                                  setEditNoteContent(note.content);
                                  setNotePreviewMode('edit');
                                }} 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400"
                              >
                                <EditIcon className="w-4 h-4" />
                              </Button>
                              <Button 
                                onClick={() => handleDeleteNote(note.id)} 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400"
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {(!task.notes || task.notes.length === 0) && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center">
                        <FileTextIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No notes yet</h3>
                      <p className="text-slate-600 dark:text-slate-400">Add your first note below to get started!</p>
                    </div>
                  )}
                </div>
                
                <Separator className="my-8" />
                
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={notePreviewMode === 'edit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNotePreviewMode('edit')}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant={notePreviewMode === 'preview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNotePreviewMode('preview')}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant={notePreviewMode === 'split' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNotePreviewMode('split')}
                    >
                      <MinimizeIcon className="w-4 h-4 mr-1" />
                      Split
                    </Button>
                  </div>
                  
                  {notePreviewMode === 'edit' && (
                    <Textarea
                      placeholder="Add a note... (Markdown supported)\n\nExample:\n# Heading\n- List item\n**Bold text**\n`code`"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="min-h-[150px] text-base leading-relaxed font-mono"
                    />
                  )}
                  
                  {notePreviewMode === 'preview' && (
                    <div className="min-h-[150px] p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                      <div className="prose prose-lg max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        >
                          {newNoteContent || '# Preview\n\nStart typing to see your markdown preview...'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {notePreviewMode === 'split' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Editor</h3>
                        <Textarea
                          placeholder="Add a note... (Markdown supported)"
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="min-h-[150px] text-base leading-relaxed font-mono"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preview</h3>
                        <div className="min-h-[150px] p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-auto">
                          <div className="prose prose-base max-w-none dark:prose-invert">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight, rehypeRaw]}
                            >
                              {newNoteContent || '# Preview\n\nStart typing to see your markdown preview...'}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={handleAddNote} disabled={!newNoteContent.trim()} className="w-full h-12 text-base">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        task={task ? { id: task.id, title: task.title } : null}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}