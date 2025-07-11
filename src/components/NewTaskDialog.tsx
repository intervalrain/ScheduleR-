import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface NewTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedSprintId?: string;
}

export function NewTaskDialog({ isOpen, setIsOpen, selectedSprintId }: NewTaskDialogProps) {
  const { data: session } = useSession();
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [tags, setTags] = useState("");
  const [labels, setLabels] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      fetchTeamMembers();
      if (session.user?.id) {
        setAssigneeId(session.user.id);
      } else {
        setAssigneeId("unassigned");
      }
    }
  }, [isOpen, session]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const members = await response.json();
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          description,
          estimate: estimate ? parseInt(estimate) : null,
          assigneeId: assigneeId && assigneeId !== "unassigned" ? assigneeId : null,
          priority,
          status,
          sprintId: selectedSprintId || null,
          tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          labels: labels ? labels.split(',').map(label => label.trim()).filter(label => label) : [],
        }),
      });

      if (response.ok) {
        setTaskName("");
        setDescription("");
        setEstimate("");
        setAssigneeId(session?.user?.id || "unassigned");
        setPriority("MEDIUM");
        setStatus("TODO");
        setTags("");
        setLabels("");
        setIsOpen(false);
        window.location.reload();
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
          <DialogDescription>
            Enter the details of the new task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <Input 
              id="name" 
              className="col-span-3" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right">
              Description
            </label>
            <Textarea 
              id="description" 
              className="col-span-3" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="estimate" className="text-right">
              Estimate (hours)
            </label>
            <Input 
              id="estimate" 
              type="number" 
              className="col-span-3" 
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="Enter estimated hours"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="priority" className="text-right">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">🔴 High</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="LOW">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="status" className="text-right">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">📋 To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">⚡ In Progress</SelectItem>
                <SelectItem value="REVIEW">👀 Review</SelectItem>
                <SelectItem value="DONE">✅ Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="tags" className="text-right">
              Tags
            </label>
            <Input 
              id="tags" 
              className="col-span-3" 
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="frontend, backend, bug (comma separated)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="labels" className="text-right">
              Labels
            </label>
            <Input 
              id="labels" 
              className="col-span-3" 
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="urgent, feature, enhancement (comma separated)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="assignee" className="text-right">
              Assignee
            </label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Unassigned</span>
                  </div>
                </SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={member.image || ''} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name?.charAt(0) || member.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name || member.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedSprintId && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Sprint</label>
              <div className="col-span-3 text-sm text-muted-foreground">
                Task will be added to the selected sprint
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleCreateTask}
            disabled={loading || !taskName.trim()}
          >
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}