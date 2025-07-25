'use client';

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, X, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSprint } from '@/context/SprintContext';
import { useTaskRefresh } from '@/context/TaskContext';
import { useNewTaskDialog } from '@/components/NewTaskDialogProvider';

// Match the Prisma model and API response structure
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface Sprint {
  id: string;
  name: string;
}

interface Task {
  id: string;
  sprintId: string | null;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  priority: number | null;
  tags: string[];
  labels: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  closeTime: string | null;
  assigneeId: string | null;
  createdById: string | null;
  assignee?: User | null;
  createdBy?: User | null;
  sprint?: Sprint | null;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
}

export default function ListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    estimatedHours: 0,
    priority: 1000000000,
    status: 'TODO' as string,
    assigneeId: '',
    labels: '',
    tags: ''
  });

  const { toast } = useToast();
  const { selectedSprint } = useSprint();
  const { triggerRefresh, refreshTrigger } = useTaskRefresh();

  useEffect(() => {
    if (selectedSprint) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [selectedSprint, refreshTrigger]);

  const fetchTasks = async () => {
    if (!selectedSprint) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?sprintId=${selectedSprint.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Fetch all users instead of just team members
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      estimatedHours: task.estimatedHours || 0,
      priority: task.priority || 1000000000,
      status: task.status,
      assigneeId: task.assigneeId || 'unassigned',
      labels: task.labels.join(', '),
      tags: task.tags.join(', ')
    });
    // Always ensure drawer is open, don't toggle if already open
    if (!drawerOpen) {
      setDrawerOpen(true);
    }
  };

  const handleSave = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          estimatedHours: editForm.estimatedHours,
          priority: editForm.priority,
          status: editForm.status,
          assigneeId: editForm.assigneeId === 'unassigned' ? null : editForm.assigneeId || null,
          labels: editForm.labels.split(',').map(l => l.trim()).filter(l => l),
          tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
        await fetchTasks();
        triggerRefresh();
        
        // Update selected task with new data
        const updatedTask = await response.json();
        setSelectedTask(updatedTask);
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        });
        setDrawerOpen(false);
        await fetchTasks();
        triggerRefresh();
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    if (priority >= 1500000000) return 'bg-red-100 text-red-800';
    if (priority >= 1200000000) return 'bg-orange-100 text-orange-800';
    if (priority >= 800000000) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: number | null) => {
    return priority;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWING': return 'bg-blue-100 text-blue-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO': return 'Todo';
      case 'IN_PROGRESS': return 'On Progress';
      case 'REVIEWING': return 'Reviewing';
      case 'DONE': return 'Done';
      default: return status;
    }
  };


  if (!selectedSprint) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Sprint Selected</h2>
          <p className="text-gray-500">Please select a sprint from the header to view tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Task List</h1>
          <p className="text-gray-600 mt-1">
            {selectedSprint.name} - {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks found in this sprint. Create your first task to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleTaskClick(task)}
                >
                  <TableCell className="font-medium">
                    <div className="truncate" title={task.title}>
                      {task.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="text-sm">
                        <div className="font-medium">{task.assignee.name || task.assignee.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Task Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-w-2xl ml-auto h-full">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Edit Task</DrawerTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </DrawerHeader>

          {selectedTask && (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">Todo</SelectItem>
                          <SelectItem value="IN_PROGRESS">On Progress</SelectItem>
                          <SelectItem value="REVIEWING">Reviewing</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={editForm.priority}
                        onChange={(e) => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                        placeholder="Enter priority number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignee">Assignee</Label>
                      <Select value={editForm.assigneeId} onValueChange={(value) => setEditForm(prev => ({ ...prev, assigneeId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        value={editForm.estimatedHours}
                        onChange={(e) => setEditForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="labels">Labels (comma-separated)</Label>
                    <Input
                      id="labels"
                      value={editForm.labels}
                      onChange={(e) => setEditForm(prev => ({ ...prev, labels: e.target.value }))}
                      placeholder="Feature, Bug, Enhancement"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={editForm.tags}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="frontend, api, urgent"
                    />
                  </div>
                </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}