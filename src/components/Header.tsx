
"use client";

import { useState, useEffect } from "react";
import { useSprint } from "@/context/SprintContext";
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
import { CSVImportDialog } from "./CSVImportDialog";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  HomeIcon, 
  Columns3Icon, 
  CalendarIcon, 
  BarChart3Icon, 
  LayoutDashboardIcon,
  TrendingDownIcon,
  UserIcon,
  LogOutIcon,
  TrashIcon,
  ListIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationTabs = [
  { id: "home", label: "Home", href: "/", icon: HomeIcon },
  { id: "kanban", label: "Kanban", href: "/kanban", icon: Columns3Icon },
  { id: "list", label: "List", href: "/list", icon: ListIcon },
  { id: "burndown", label: "Burndown", href: "/burndown", icon: TrendingDownIcon },
  { id: "gantt", label: "Gantt", href: "/gantt", icon: BarChart3Icon },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarIcon },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
];

export default function Header() {
  const { sprints, selectedSprintId, setSelectedSprintId, refreshSprints, loading: sprintsLoading } = useSprint();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { openNewTaskDialog } = useNewTaskDialog();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // Update current time every second
  useEffect(() => {
    if (!isClient) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isClient]);

  // Sprint management is now handled by SprintContext

  const deleteSprint = async (sprintId: string, sprintName: string) => {
    if (!confirm(`Are you sure you want to delete "${sprintName}"?`)) return;
    
    try {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh sprints list
        await refreshSprints();
        // If the deleted sprint was selected, clear selection
        if (selectedSprintId === sprintId) {
          setSelectedSprintId(null);
        }
      } else {
        console.error('Failed to delete sprint');
        alert('Failed to delete sprint');
      }
    } catch (error) {
      console.error('Error deleting sprint:', error);
      alert('Error deleting sprint');
    }
  };

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
      <div className="grid grid-cols-3 items-center px-6 py-4">
        {/* Left section */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">ScheduleR</h1>
            <div className="h-6 w-px bg-border"></div>
          </div>
          <Select 
            value={selectedSprintId || undefined} 
            onValueChange={setSelectedSprintId}
            disabled={sprintsLoading}
          >
            <SelectTrigger className="w-[180px] border-border/60 bg-white hover:bg-muted/50 transition-colors">
              <SelectValue placeholder={sprintsLoading ? "Loading..." : "Select a sprint"} />
            </SelectTrigger>
            <SelectContent>
              {sprints.length === 0 && !sprintsLoading && (
                <SelectItem value="no-sprints" disabled>
                  No sprints available
                </SelectItem>
              )}
              {sprints.map((sprint) => (
                <div key={sprint.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent group">
                  <SelectItem 
                    value={sprint.id} 
                    className="flex-1 border-0 p-0 focus:bg-transparent data-[highlighted]:bg-transparent"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{sprint.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {sprint.type === 'PROJECT' ? 'Project Management' : 'Casual Management'}
                      </span>
                    </div>
                  </SelectItem>
                  <button
                    className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteSprint(sprint.id, sprint.name);
                    }}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </SelectContent>
          </Select>
          <NewSprintDialog onSprintCreated={refreshSprints} />
        </div>
        
        {/* Center section - Current Time */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-semibold text-foreground tabular-nums">
            {isClient && currentTime ? currentTime.toLocaleTimeString('zh-TW', { 
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }) : '--:--:--'}
          </div>
          <div className="text-sm text-muted-foreground">
            {isClient && currentTime ? currentTime.toLocaleDateString('zh-TW', { 
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              weekday: 'short'
            }) : 'Loading...'}
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-3 justify-end">
          <CSVImportDialog />
          <Button 
            onClick={() => openNewTaskDialog(selectedSprintId || undefined)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium"
          >
            New Task
          </Button>
          
          {/* User Menu */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user?.name && (
                      <p className="font-medium">{session.user.name}</p>
                    )}
                    {session.user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => signIn("google")}
              variant="outline"
              className="font-medium"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="px-6 pb-3">
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
