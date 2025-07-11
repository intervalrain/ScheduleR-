
"use client";

import { useState, useEffect } from "react";
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
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  HomeIcon, 
  Columns3Icon, 
  CalendarIcon, 
  BarChart3Icon, 
  LayoutDashboardIcon,
  UserIcon,
  LogOutIcon 
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
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarIcon },
  { id: "gantt", label: "Gantt", href: "/gantt", icon: BarChart3Icon },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
];

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export default function Header() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const { openNewTaskDialog } = useNewTaskDialog();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fetch sprints when user is authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setSprints([]);
      return;
    }

    const fetchSprints = async () => {
      setSprintsLoading(true);
      try {
        const response = await fetch('/api/sprints');
        if (response.ok) {
          const data = await response.json();
          setSprints(data);
          // Auto-select the first sprint if none selected
          if (data.length > 0 && !selectedSprintId) {
            setSelectedSprintId(data[0].id);
          }
        } else {
          console.error('Failed to fetch sprints');
        }
      } catch (error) {
        console.error('Error fetching sprints:', error);
      } finally {
        setSprintsLoading(false);
      }
    };

    fetchSprints();
  }, [session, status, selectedSprintId]);

  const refreshSprints = async () => {
    if (!session) return;
    setSprintsLoading(true);
    try {
      const response = await fetch('/api/sprints');
      if (response.ok) {
        const data = await response.json();
        setSprints(data);
        // Auto-select the newly created sprint (first one)
        if (data.length > 0) {
          setSelectedSprintId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error refreshing sprints:', error);
    } finally {
      setSprintsLoading(false);
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
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">ScheduleR</h1>
            <div className="h-6 w-px bg-border"></div>
          </div>
          <Select 
            value={selectedSprintId || undefined} 
            onValueChange={setSelectedSprintId}
            disabled={sprintsLoading || !session}
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
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewSprintDialog onSprintCreated={refreshSprints} />
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <Button 
              onClick={openNewTaskDialog} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium"
            >
              New Task
            </Button>
          )}
          
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
