
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
import { usePathname, useRouter } from "next/navigation";
import { 
  HomeIcon, 
  Columns3Icon, 
  CalendarIcon, 
  BarChart3Icon, 
  LayoutDashboardIcon 
} from "lucide-react";

const navigationTabs = [
  { id: "home", label: "Home", href: "/", icon: HomeIcon },
  { id: "kanban", label: "Kanban", href: "/kanban", icon: Columns3Icon },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarIcon },
  { id: "gantt", label: "Gantt", href: "/gantt", icon: BarChart3Icon },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
];

export default function Header() {
  // Placeholder for fetching sprints
  const sprints = [{ id: "1", name: "Sprint 1" }];
  const { openNewTaskDialog } = useNewTaskDialog();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleTabClick = (href: string) => {
    router.push(href);
  };

  return (
    <header className="bg-white border-b border-border/60 backdrop-blur-sm">
      {/* Top section with brand and actions */}
      <div className="flex items-center justify-between px-6 py-4">
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
      </div>

      {/* Navigation tabs */}
      <div className="px-6">
        <nav className="flex space-x-1" role="tablist">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.href)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${active 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
                role="tab"
                aria-selected={active}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
