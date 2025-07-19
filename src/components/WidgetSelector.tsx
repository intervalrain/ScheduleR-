"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUpIcon, CheckCircleIcon, ClockIcon, BarChart3Icon, 
  HeartIcon, UsersIcon, ZapIcon, AlertTriangleIcon, 
  GitBranchIcon, CalendarIcon, TargetIcon, TrendingDownIcon,
  LockIcon, BeakerIcon
} from "lucide-react";

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'available' | 'preview' | 'future';
  category: 'basic' | 'advanced' | 'external';
}

const availableWidgets: Widget[] = [
  // Completed widgets
  {
    id: 'completion-rate',
    name: 'Sprint Completion',
    description: 'Track sprint time progress',
    icon: <TrendingUpIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'task-summary',
    name: 'Task Progress',
    description: 'View task completion status',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'hours-summary',
    name: 'Total Hours',
    description: 'Sum of estimated work hours',
    icon: <ClockIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'work-hours',
    name: 'Available Hours',
    description: 'Sprint hours minus busy hours',
    icon: <ClockIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'progress-chart',
    name: 'Progress Overview',
    description: 'Task status breakdown',
    icon: <BarChart3Icon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'task-distribution',
    name: 'Task Distribution',
    description: 'Task completion percentage',
    icon: <TargetIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Track activity metrics',
    icon: <GitBranchIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'calendar-overview',
    name: 'Calendar Overview',
    description: 'Time blocked in sprint',
    icon: <CalendarIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  {
    id: 'sprint-progress',
    name: 'Sprint Progress',
    description: 'Days elapsed and remaining',
    icon: <TrendingUpIcon className="w-4 h-4" />,
    status: 'completed',
    category: 'basic'
  },
  
  // Preview-only widgets (need more work)
  {
    id: 'sprint-health',
    name: 'Sprint Health',
    description: 'Overall sprint status indicator',
    icon: <HeartIcon className="w-4 h-4" />,
    status: 'preview',
    category: 'advanced'
  },
  {
    id: 'team-workload',
    name: 'Team Workload',
    description: 'Team member task distribution',
    icon: <UsersIcon className="w-4 h-4" />,
    status: 'preview',
    category: 'advanced'
  },
  {
    id: 'velocity',
    name: 'Velocity',
    description: 'Sprint completion velocity',
    icon: <ZapIcon className="w-4 h-4" />,
    status: 'preview',
    category: 'advanced'
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Sprint risk analysis',
    icon: <AlertTriangleIcon className="w-4 h-4" />,
    status: 'preview',
    category: 'advanced'
  },
  {
    id: 'burndown-chart',
    name: 'Burndown Chart',
    description: 'Work remaining over time',
    icon: <TrendingDownIcon className="w-4 h-4" />,
    status: 'preview',
    category: 'advanced'
  },
  
  // Future widgets (need external integration)
  {
    id: 'code-commits',
    name: 'Code Commits',
    description: 'GitHub/GitLab integration',
    icon: <GitBranchIcon className="w-4 h-4" />,
    status: 'future',
    category: 'external'
  },
  {
    id: 'team-communication',
    name: 'Team Communication',
    description: 'Chat and comments system',
    icon: <UsersIcon className="w-4 h-4" />,
    status: 'future',
    category: 'external'
  }
];

interface WidgetSelectorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  enabledWidgets: string[];
  onSave: (widgets: string[]) => void;
}

export function WidgetSelector({ isOpen, setIsOpen, enabledWidgets, onSave }: WidgetSelectorProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(enabledWidgets);

  const handleToggle = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget || widget.status !== 'completed') return;

    setSelectedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onSave(selectedWidgets);
    setIsOpen(false);
  };

  const getStatusBadge = (status: Widget['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">Available</Badge>;
      case 'preview':
        return <Badge variant="secondary" className="text-xs"><BeakerIcon className="w-3 h-3 mr-1" />Preview Only</Badge>;
      case 'future':
        return <Badge variant="outline" className="text-xs"><LockIcon className="w-3 h-3 mr-1" />Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const categories = [
    { id: 'basic', name: 'Basic Widgets', widgets: availableWidgets.filter(w => w.category === 'basic') },
    { id: 'advanced', name: 'Advanced Analytics', widgets: availableWidgets.filter(w => w.category === 'advanced') },
    { id: 'external', name: 'External Integrations', widgets: availableWidgets.filter(w => w.category === 'external') }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard Widgets</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {categories.map(category => (
            <div key={category.id} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{category.name}</h3>
              <div className="space-y-2">
                {category.widgets.map(widget => (
                  <div
                    key={widget.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      widget.status === 'completed' 
                        ? 'hover:bg-muted/50 cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed bg-muted/20'
                    }`}
                    onClick={() => widget.status === 'completed' && handleToggle(widget.id)}
                  >
                    <Checkbox
                      checked={selectedWidgets.includes(widget.id)}
                      disabled={widget.status !== 'completed'}
                      onCheckedChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={widget.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}>
                          {widget.icon}
                        </div>
                        <span className="font-medium text-sm">{widget.name}</span>
                        {getStatusBadge(widget.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{widget.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}