
"use client";

import * as React from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "cmdk";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";
import { useNewTaskDialog } from "./NewTaskDialogProvider";
import { useSession, signOut } from "next-auth/react";
import {
  PlusIcon,
  HomeIcon,
  Columns3Icon,
  CalendarIcon,
  BarChart3Icon,
  LayoutDashboardIcon,
  UserIcon,
  LogOutIcon,
  SearchIcon,
  CommandIcon,
  ZapIcon
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  icon: React.ReactNode;
  keywords?: string[];
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { openNewTaskDialog } = useNewTaskDialog();
  const { data: session } = useSession();

  useHotkeys("mod+k", () => setOpen((open) => !open));
  useHotkeys("mod+shift+p", () => setOpen((open) => !open));

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const commands: CommandItem[] = React.useMemo(() => [
    // Quick Actions
    {
      id: "new-task",
      label: "New Task",
      description: "Create a new task",
      action: openNewTaskDialog,
      icon: <PlusIcon className="w-4 h-4" />,
      keywords: ["create", "add", "task"],
      group: "Actions"
    },
    {
      id: "new-sprint",
      label: "New Sprint",
      description: "Create a new sprint",
      action: () => console.log("New Sprint"), // Replace with actual sprint dialog
      icon: <ZapIcon className="w-4 h-4" />,
      keywords: ["create", "add", "sprint"],
      group: "Actions"
    },

    // Navigation
    {
      id: "nav-home",
      label: "Home",
      description: "Go to homepage",
      action: () => router.push("/"),
      icon: <HomeIcon className="w-4 h-4" />,
      keywords: ["home", "dashboard", "overview"],
      group: "Navigation"
    },
    {
      id: "nav-kanban",
      label: "Kanban Board",
      description: "View tasks in kanban format",
      action: () => router.push("/kanban"),
      icon: <Columns3Icon className="w-4 h-4" />,
      keywords: ["kanban", "board", "tasks", "columns"],
      group: "Navigation"
    },
    {
      id: "nav-calendar",
      label: "Calendar",
      description: "View calendar and events",
      action: () => router.push("/calendar"),
      icon: <CalendarIcon className="w-4 h-4" />,
      keywords: ["calendar", "events", "schedule"],
      group: "Navigation"
    },
    {
      id: "nav-gantt",
      label: "Gantt Chart",
      description: "View project timeline",
      action: () => router.push("/gantt"),
      icon: <BarChart3Icon className="w-4 h-4" />,
      keywords: ["gantt", "timeline", "chart", "project"],
      group: "Navigation"
    },
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "View analytics and metrics",
      action: () => router.push("/dashboard"),
      icon: <LayoutDashboardIcon className="w-4 h-4" />,
      keywords: ["dashboard", "analytics", "metrics", "stats"],
      group: "Navigation"
    },

    // User actions
    ...(session ? [
      {
        id: "profile",
        label: "Profile",
        description: "View and edit your profile",
        action: () => router.push("/profile"),
        icon: <UserIcon className="w-4 h-4" />,
        keywords: ["profile", "settings", "account"],
        group: "Account"
      },
      {
        id: "sign-out",
        label: "Sign Out",
        description: "Sign out of your account",
        action: () => signOut({ callbackUrl: "/" }),
        icon: <LogOutIcon className="w-4 h-4" />,
        keywords: ["logout", "signout", "exit"],
        group: "Account"
      }
    ] : [])
  ], [session, router, openNewTaskDialog]);

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    commands.forEach(command => {
      if (!groups[command.group]) {
        groups[command.group] = [];
      }
      groups[command.group].push(command);
    });
    return groups;
  }, [commands]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 shadow-2xl max-w-[540px] border-border/50">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <Command className="rounded-lg border-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
              <SearchIcon className="w-4 h-4 text-muted-foreground" />
              <CommandInput 
                placeholder="Type a command or search..." 
                className="border-0 outline-0 focus:ring-0 text-sm placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <CommandIcon className="w-3 h-3" />
                  K
                </kbd>
              </div>
            </div>
            <CommandList className="max-h-[400px] overflow-y-auto">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </CommandEmpty>
              
              {Object.entries(groupedCommands).map(([groupName, groupCommands], index) => (
                <React.Fragment key={groupName}>
                  {index > 0 && <CommandSeparator />}
                  <CommandGroup 
                    heading={groupName}
                    className="text-xs font-medium text-muted-foreground px-2 py-1.5"
                  >
                    {groupCommands.map((command) => (
                      <CommandItem
                        key={command.id}
                        onSelect={() => runCommand(command.action)}
                        className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer hover:bg-accent rounded-md mx-1"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                          {command.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {command.label}
                          </div>
                          {command.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Keyboard shortcut hint */}
      {!open && (
        <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <CommandIcon className="w-3 h-3" />
            K
          </kbd>{" "}
          for quick actions
        </div>
      )}
    </>
  );
}
