
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewSprintDialog } from "./NewSprintDialog";
import { useNewTaskDialog } from "./NewTaskDialogProvider";

export default function Header() {
  // Placeholder for fetching sprints
  const sprints = [{ id: "1", name: "Sprint 1" }];
  const { openNewTaskDialog } = useNewTaskDialog();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border/60 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">ScheduleR</h1>
          <div className="h-6 w-px bg-border"></div>
        </div>
        <Select>
          <SelectTrigger className="w-[180px] border-border/60 bg-white hover:bg-muted/50 transition-colors">
            <SelectValue placeholder="Select a sprint" />
          </SelectTrigger>
          <SelectContent>
            {sprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NewSprintDialog />
      </div>
      <div>
        <Button 
          onClick={openNewTaskDialog} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium"
        >
          New Task
        </Button>
      </div>
    </header>
  );
}
