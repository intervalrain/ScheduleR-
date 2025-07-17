"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { 
  TrendingUpIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  BarChart3Icon,
  HeartIcon,
  UsersIcon,
  ZapIcon,
  AlertTriangleIcon,
  SettingsIcon,
  CalendarIcon,
  GitBranchIcon,
  MessageSquareIcon,
  FileTextIcon,
  TargetIcon,
  TrendingDownIcon
} from "lucide-react";

interface WidgetItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  enabled: boolean;
}

interface WidgetConfig {
  id: string;
}

interface WidgetProviderProps {
  enabledWidgets: WidgetConfig[];
  onWidgetToggle: (widgetId: string, enabled: boolean) => void;
}

const availableWidgets: WidgetItem[] = [
  {
    id: "completion-rate",
    title: "Sprint Completion Rate",
    description: "Shows the overall completion percentage of current sprint",
    icon: <TrendingUpIcon className="w-4 h-4" />,
    category: "Progress",
    enabled: true
  },
  {
    id: "task-summary",
    title: "Task Summary",
    description: "Overview of total, completed, and in-progress tasks",
    icon: <CheckCircleIcon className="w-4 h-4" />,
    category: "Tasks",
    enabled: true
  },
  {
    id: "hours-summary",
    title: "Work Hours",
    description: "Total estimated work hours for all tasks",
    icon: <ClockIcon className="w-4 h-4" />,
    category: "Time",
    enabled: true
  },
  {
    id: "sprint-health",
    title: "Sprint Health",
    description: "Health indicator based on completed vs consumed hours",
    icon: <HeartIcon className="w-4 h-4" />,
    category: "Health",
    enabled: true
  },
  {
    id: "progress-chart",
    title: "Progress Overview",
    description: "Visual representation of task completion progress",
    icon: <BarChart3Icon className="w-4 h-4" />,
    category: "Progress",
    enabled: true
  },
  {
    id: "team-workload",
    title: "Team Workload",
    description: "Shows individual team member workload vs capacity",
    icon: <UsersIcon className="w-4 h-4" />,
    category: "Team",
    enabled: true
  },
  {
    id: "velocity",
    title: "Sprint Velocity",
    description: "Current and historical sprint velocity metrics",
    icon: <ZapIcon className="w-4 h-4" />,
    category: "Metrics",
    enabled: true
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Project risk level and contributing factors",
    icon: <AlertTriangleIcon className="w-4 h-4" />,
    category: "Risk",
    enabled: true
  },
  {
    id: "burndown",
    title: "Burndown Chart",
    description: "Shows remaining work over time",
    icon: <TrendingUpIcon className="w-4 h-4" />,
    category: "Progress",
    enabled: true
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest task updates and activities",
    icon: <CheckCircleIcon className="w-4 h-4" />,
    category: "Activity",
    enabled: true
  },
  {
    id: "calendar-overview",
    title: "Calendar Overview",
    description: "Upcoming deadlines and scheduled tasks",
    icon: <CalendarIcon className="w-4 h-4" />,
    category: "Planning",
    enabled: true
  },
  {
    id: "code-commits",
    title: "Code Commits",
    description: "Recent git commits and code changes",
    icon: <GitBranchIcon className="w-4 h-4" />,
    category: "Development",
    enabled: true
  },
  {
    id: "team-communication",
    title: "Team Communication",
    description: "Latest messages and notifications",
    icon: <MessageSquareIcon className="w-4 h-4" />,
    category: "Communication",
    enabled: true
  },
  {
    id: "project-documentation",
    title: "Project Documentation",
    description: "Important documents and resources",
    icon: <FileTextIcon className="w-4 h-4" />,
    category: "Documentation",
    enabled: true
  },
  {
    id: "performance-metrics",
    title: "Performance Metrics",
    description: "Application performance and monitoring",
    icon: <TargetIcon className="w-4 h-4" />,
    category: "Performance",
    enabled: true
  },
  {
    id: "resource-usage",
    title: "Resource Usage",
    description: "System resource consumption tracking",
    icon: <TrendingDownIcon className="w-4 h-4" />,
    category: "System",
    enabled: true
  }
];

export default function WidgetProvider({ enabledWidgets, onWidgetToggle }: WidgetProviderProps) {
  const [open, setOpen] = useState(false);
  
  const categories = [...new Set(availableWidgets.map(w => w.category))];
  
  const isEnabled = (widgetId: string) => enabledWidgets.some(w => w.id === widgetId);
  
  const handleToggle = (widgetId: string) => {
    const enabled = isEnabled(widgetId);
    onWidgetToggle(widgetId, !enabled);
  };
  

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Manage Widgets
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full h-full">
          <DrawerHeader>
            <DrawerTitle>Manage Dashboard Widgets</DrawerTitle>
            <DrawerDescription>
              Choose which widgets to display on your dashboard. You can enable or disable widgets and change their sizes.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 pb-6">
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3">{category}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {availableWidgets
                      .filter(widget => widget.category === category)
                      .map(widget => (
                        <Card 
                          key={widget.id} 
                          className={`transition-all cursor-pointer ${
                            isEnabled(widget.id) 
                              ? 'border-primary border-2 bg-primary/5' 
                              : 'border-muted hover:border-muted-foreground/50 hover:shadow-md'
                          }`}
                          onClick={() => handleToggle(widget.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {widget.icon}
                                <CardTitle className="text-sm">{widget.title}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                {isEnabled(widget.id) && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                              {widget.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {enabledWidgets.length} of {availableWidgets.length} widgets enabled
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    availableWidgets.forEach(widget => {
                      onWidgetToggle(widget.id, false);
                    });
                  }}
                >
                  Disable All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    availableWidgets.forEach(widget => {
                      onWidgetToggle(widget.id, true);
                    });
                  }}
                >
                  Enable All
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}