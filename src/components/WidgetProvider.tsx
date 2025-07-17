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
  SettingsIcon
} from "lucide-react";

type WidgetSize = 'small' | 'medium' | 'large';

interface WidgetItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  enabled: boolean;
  availableSizes: WidgetSize[];
  defaultSize: WidgetSize;
}

interface WidgetConfig {
  id: string;
  size: WidgetSize;
}

interface WidgetProviderProps {
  enabledWidgets: WidgetConfig[];
  onWidgetToggle: (widgetId: string, enabled: boolean, size?: WidgetSize) => void;
}

const availableWidgets: WidgetItem[] = [
  {
    id: "completion-rate",
    title: "Sprint Completion Rate",
    description: "Shows the overall completion percentage of current sprint",
    icon: <TrendingUpIcon className="w-4 h-4" />,
    category: "Progress",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "task-summary",
    title: "Task Summary",
    description: "Overview of total, completed, and in-progress tasks",
    icon: <CheckCircleIcon className="w-4 h-4" />,
    category: "Tasks",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "hours-summary",
    title: "Work Hours",
    description: "Total estimated work hours for all tasks",
    icon: <ClockIcon className="w-4 h-4" />,
    category: "Time",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "sprint-health",
    title: "Sprint Health",
    description: "Health indicator based on completed vs consumed hours",
    icon: <HeartIcon className="w-4 h-4" />,
    category: "Health",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "progress-chart",
    title: "Progress Overview",
    description: "Visual representation of task completion progress",
    icon: <BarChart3Icon className="w-4 h-4" />,
    category: "Progress",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "team-workload",
    title: "Team Workload",
    description: "Shows individual team member workload vs capacity",
    icon: <UsersIcon className="w-4 h-4" />,
    category: "Team",
    enabled: true,
    availableSizes: ['medium', 'large'],
    defaultSize: 'medium'
  },
  {
    id: "velocity",
    title: "Sprint Velocity",
    description: "Current and historical sprint velocity metrics",
    icon: <ZapIcon className="w-4 h-4" />,
    category: "Metrics",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Project risk level and contributing factors",
    icon: <AlertTriangleIcon className="w-4 h-4" />,
    category: "Risk",
    enabled: true,
    availableSizes: ['small', 'medium'],
    defaultSize: 'small'
  },
  {
    id: "burndown",
    title: "Burndown Chart",
    description: "Shows remaining work over time",
    icon: <TrendingUpIcon className="w-4 h-4" />,
    category: "Progress",
    enabled: true,
    availableSizes: ['medium', 'large'],
    defaultSize: 'medium'
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest task updates and activities",
    icon: <CheckCircleIcon className="w-4 h-4" />,
    category: "Activity",
    enabled: true,
    availableSizes: ['medium', 'large'],
    defaultSize: 'medium'
  }
];

export default function WidgetProvider({ enabledWidgets, onWidgetToggle }: WidgetProviderProps) {
  const [open, setOpen] = useState(false);
  
  const categories = [...new Set(availableWidgets.map(w => w.category))];
  
  const isEnabled = (widgetId: string) => enabledWidgets.some(w => w.id === widgetId);
  
  const getWidgetSize = (widgetId: string) => {
    const widget = enabledWidgets.find(w => w.id === widgetId);
    return widget?.size || availableWidgets.find(w => w.id === widgetId)?.defaultSize || 'small';
  };
  
  const handleToggle = (widgetId: string) => {
    const enabled = isEnabled(widgetId);
    if (enabled) {
      onWidgetToggle(widgetId, false);
    } else {
      const widget = availableWidgets.find(w => w.id === widgetId);
      onWidgetToggle(widgetId, true, widget?.defaultSize);
    }
  };
  
  const handleSizeChange = (widgetId: string, size: WidgetSize) => {
    onWidgetToggle(widgetId, true, size);
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
                                  <div className="flex items-center gap-1">
                                    {widget.availableSizes.map((size) => (
                                      <Button
                                        key={size}
                                        variant={getWidgetSize(widget.id) === size ? "default" : "outline"}
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSizeChange(widget.id, size);
                                        }}
                                      >
                                        {size}
                                      </Button>
                                    ))}
                                  </div>
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