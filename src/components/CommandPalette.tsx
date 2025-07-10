
"use client";

import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { useNewTaskDialog } from "./NewTaskDialogProvider";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { openNewTaskDialog } = useNewTaskDialog();

  useHotkeys("mod+k", () => setOpen((open) => !open));

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 shadow-lg max-w-[480px]">
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(openNewTaskDialog)}>
                New Task
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => console.log("New Sprint"))}>
                New Sprint
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push("/kanban"))}>
                Go to Kanban Board
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
                Go to Calendar
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/gantt"))}>
                Go to Gantt Chart
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                Go to Dashboard
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
                Go to Profile
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
