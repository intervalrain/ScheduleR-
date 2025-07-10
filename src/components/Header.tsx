
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
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Select>
          <SelectTrigger className="w-[180px]">
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
        <Button onClick={openNewTaskDialog}>New Task</Button>
      </div>
    </header>
  );
}
