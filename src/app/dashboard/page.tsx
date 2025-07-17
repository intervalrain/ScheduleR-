"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateSprintHealth } from "@/lib/utils";
import WidgetProvider from "@/components/WidgetProvider";
import { 
  TrendingUpIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  BarChart3Icon,
  RefreshCwIcon,
  LayoutDashboardIcon,
  HeartIcon,
  UsersIcon,
  ZapIcon,
  AlertTriangleIcon,
  CalendarIcon,
  GitBranchIcon,
  MessageSquareIcon,
  FileTextIcon,
  TargetIcon,
  TrendingDownIcon
} from "lucide-react";

interface DashboardData {
  totalTasks: number;
  completedTasks: number;
  ongoingTasks: number;
  totalHours: number;
  completionRate: number;
  burndownData?: number[];
  sprintHealth?: {
    totalHours: number;
    completedHours: number;
    consumedHours: number;
    healthPercentage: number;
  };
  teamWorkload?: {
    members: { name: string; workload: number; capacity: number }[];
  };
  velocity?: {
    currentSprint: number;
    previousSprint: number;
    average: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

interface WidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

interface WidgetContainerProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDraggedOver: boolean;
  isDragging: boolean;
}

const Widget: React.FC<WidgetContainerProps> = ({ 
  id, 
  title, 
  icon, 
  children, 
  onDragStart, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onDragEnd,
  isDraggedOver,
  isDragging
}) => (
  <div 
    key={id} 
    className={`h-full transition-all duration-200 ${
      isDraggedOver ? 'scale-105 ring-2 ring-blue-400' : ''
    } ${
      isDragging ? 'opacity-50' : ''
    }`}
    draggable
    onDragStart={(e) => onDragStart(e, id)}
    onDragOver={(e) => onDragOver(e, id)}
    onDragLeave={onDragLeave}
    onDrop={(e) => onDrop(e, id)}
    onDragEnd={onDragEnd}
  >
    <Card className="h-full cursor-move">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  </div>
);

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalTasks: 0,
    completedTasks: 0,
    ongoingTasks: 0,
    totalHours: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [enabledWidgets, setEnabledWidgets] = useState<{id: string}[]>([
    { id: "completion-rate" },
    { id: "task-summary" },
    { id: "hours-summary" },
    { id: "sprint-health" },
    { id: "progress-chart" },
    { id: "team-workload" },
    { id: "velocity" },
    { id: "risk-assessment" },
    { id: "burndown" },
    { id: "recent-activity" },
    { id: "calendar-overview" },
    { id: "code-commits" },
    { id: "team-communication" },
    { id: "project-documentation" },
    { id: "performance-metrics" },
    { id: "resource-usage" }
  ]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  
  // Load saved widgets from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidgets = localStorage.getItem("enabledWidgets");
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEnabledWidgets(parsed);
          }
        } catch (e) {
          console.error('Error parsing saved widgets:', e);
        }
      }
    }
  }, []);
  
  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    setEnabledWidgets(prev => {
      const newWidgets = enabled 
        ? [...prev.filter(w => w.id !== widgetId), { id: widgetId }]
        : prev.filter(w => w.id !== widgetId);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("enabledWidgets", JSON.stringify(newWidgets));
      }
      return newWidgets;
    });
  };

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedItem(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(widgetId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem !== targetWidgetId) {
      const newWidgets = [...enabledWidgets];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedItem);
      const targetIndex = newWidgets.findIndex(w => w.id === targetWidgetId);
      
      // Remove dragged item and insert at target position
      const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedWidget);
      
      setEnabledWidgets(newWidgets);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("enabledWidgets", JSON.stringify(newWidgets));
      }
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/summary');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Fallback to mock data
        setDashboardData({
          totalTasks: 15,
          completedTasks: 8,
          ongoingTasks: 5,
          totalHours: 120,
          completionRate: 53,
          burndownData: [100, 85, 70, 60, 45, 30, 15],
          sprintHealth: {
            totalHours: 80,
            completedHours: 32,
            consumedHours: 36,
            healthPercentage: calculateSprintHealth(32, 36)
          },
          teamWorkload: {
            members: [
              { name: "Alice", workload: 32, capacity: 40 },
              { name: "Bob", workload: 38, capacity: 40 },
              { name: "Charlie", workload: 28, capacity: 40 }
            ]
          },
          velocity: {
            currentSprint: 24,
            previousSprint: 20,
            average: 22
          },
          riskAssessment: {
            level: 'medium',
            factors: ['Resource constraints', 'Technical debt']
          }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      setDashboardData({
        totalTasks: 15,
        completedTasks: 8,
        ongoingTasks: 5,
        totalHours: 120,
        completionRate: 53,
        burndownData: [100, 85, 70, 60, 45, 30, 15],
        sprintHealth: {
          totalHours: 80,
          completedHours: 32,
          consumedHours: 36,
          healthPercentage: calculateSprintHealth(32, 36)
        },
        teamWorkload: {
          members: [
            { name: "Alice", workload: 32, capacity: 40 },
            { name: "Bob", workload: 38, capacity: 40 },
            { name: "Charlie", workload: 28, capacity: 40 }
          ]
        },
        velocity: {
          currentSprint: 24,
          previousSprint: 20,
          average: 22
        },
        riskAssessment: {
          level: 'medium',
          factors: ['Resource constraints', 'Technical debt']
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboardIcon className="w-6 h-6" />
            Dashboard
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboardIcon className="w-6 h-6" />
          Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <WidgetProvider 
            enabledWidgets={enabledWidgets}
            onWidgetToggle={handleWidgetToggle}
          />
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 auto-rows-fr">
        {enabledWidgets.map(widget => {
          switch (widget.id) {
            case "completion-rate":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Sprint Completion Rate"
                  icon={<TrendingUpIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {dashboardData.completionRate}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${dashboardData.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </Widget>
              );
              
            case "task-summary":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Task Summary"
                  icon={<CheckCircleIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">{dashboardData.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-medium text-green-600">{dashboardData.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">In Progress</span>
                      <span className="font-medium text-blue-600">{dashboardData.ongoingTasks}</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "hours-summary":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Work Hours"
                  icon={<ClockIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {dashboardData.totalHours}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Estimated
                    </div>
                  </div>
                </Widget>
              );
              
            case "sprint-health":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Sprint Health"
                  icon={<HeartIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2" style={{ 
                      color: dashboardData.sprintHealth ? 
                        dashboardData.sprintHealth.healthPercentage >= 90 ? '#10b981' : 
                        dashboardData.sprintHealth.healthPercentage >= 70 ? '#f59e0b' : '#ef4444' 
                        : '#6b7280' 
                    }}>
                      {dashboardData.sprintHealth?.healthPercentage || 0}%
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>{dashboardData.sprintHealth?.totalHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="text-green-600">{dashboardData.sprintHealth?.completedHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consumed:</span>
                        <span className="text-blue-600">{dashboardData.sprintHealth?.consumedHours || 0}h</span>
                      </div>
                    </div>
                  </div>
                </Widget>
              );
              
            case "progress-chart":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Progress Overview"
                  icon={<BarChart3Icon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Done</span>
                      <span>{Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(dashboardData.completedTasks / dashboardData.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>In Progress</span>
                      <span>{Math.round((dashboardData.ongoingTasks / dashboardData.totalTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(dashboardData.ongoingTasks / dashboardData.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </Widget>
              );
              
            case "team-workload":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Team Workload"
                  icon={<UsersIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2">
                    {dashboardData.teamWorkload?.members.map((member, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{member.name}</span>
                          <span>{member.workload}h/{member.capacity}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              member.workload > member.capacity ? 'bg-red-500' : 
                              member.workload > member.capacity * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (member.workload / member.capacity) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Widget>
              );
              
            case "velocity":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Sprint Velocity"
                  icon={<ZapIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {dashboardData.velocity?.currentSprint || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Story Points</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Previous:</span>
                        <span>{dashboardData.velocity?.previousSprint || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average:</span>
                        <span>{dashboardData.velocity?.average || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trend:</span>
                        <span className={
                          (dashboardData.velocity?.currentSprint || 0) > (dashboardData.velocity?.previousSprint || 0) 
                            ? 'text-green-600' : 'text-red-600'
                        }>
                          {(dashboardData.velocity?.currentSprint || 0) > (dashboardData.velocity?.previousSprint || 0) 
                            ? '↗' : '↘'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </Widget>
              );
              
            case "risk-assessment":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Risk Assessment"
                  icon={<AlertTriangleIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-2 ${
                      dashboardData.riskAssessment?.level === 'high' ? 'text-red-500' :
                      dashboardData.riskAssessment?.level === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {dashboardData.riskAssessment?.level?.toUpperCase() || 'LOW'}
                    </div>
                    <div className="text-xs space-y-1">
                      {dashboardData.riskAssessment?.factors.map((factor, index) => (
                        <div key={index} className="text-muted-foreground">
                          • {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                </Widget>
              );
              
            case "burndown":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Burn Down Chart"
                  icon={<TrendingUpIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="h-32 flex items-end space-x-1">
                    {dashboardData.burndownData?.map((value, index) => (
                      <div 
                        key={index}
                        className="flex-1 bg-primary rounded-t opacity-80 hover:opacity-100 transition-opacity"
                        style={{ height: `${(value / 100) * 100}%` }}
                        title={`Day ${index + 1}: ${value} tasks remaining`}
                      ></div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Tasks remaining over time
                  </div>
                </Widget>
              );
              
            case "recent-activity":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Recent Activity"
                  icon={<CheckCircleIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Task completed</div>
                        <div className="text-xs text-muted-foreground">Design Database Schema</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Task started</div>
                        <div className="text-xs text-muted-foreground">Implement Authentication</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Task created</div>
                        <div className="text-xs text-muted-foreground">Setup CI/CD Pipeline</div>
                      </div>
                    </div>
                  </div>
                </Widget>
              );
              
            case "calendar-overview":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Calendar Overview"
                  icon={<CalendarIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Sprint Demo - Tomorrow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Code Review - Today 3PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Team Meeting - Friday</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "code-commits":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Code Commits"
                  icon={<GitBranchIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Today</span>
                      <span className="font-bold text-green-600">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Week</span>
                      <span className="font-bold text-blue-600">47</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Commit</span>
                      <span className="text-muted-foreground">2h ago</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "team-communication":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Team Communication"
                  icon={<MessageSquareIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">A</div>
                      <span>New bug report filed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">B</div>
                      <span>PR approved & merged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">C</div>
                      <span>Design review complete</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "project-documentation":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Project Documentation"
                  icon={<FileTextIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>API Docs</span>
                      <span className="text-green-600">Updated</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Guide</span>
                      <span className="text-yellow-600">Review</span>
                    </div>
                    <div className="flex justify-between">
                      <span>README</span>
                      <span className="text-blue-600">Complete</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "performance-metrics":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Performance Metrics"
                  icon={<TargetIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Response Time</span>
                      <span className="font-bold text-green-600">145ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span className="font-bold text-green-600">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate</span>
                      <span className="font-bold text-red-600">0.1%</span>
                    </div>
                  </div>
                </Widget>
              );
              
            case "resource-usage":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Resource Usage"
                  icon={<TrendingDownIcon className="w-4 h-4" />}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDraggedOver={dragOverItem === widget.id}
                  isDragging={draggedItem === widget.id}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>CPU</span>
                      <span className="font-bold">24%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory</span>
                      <span className="font-bold">67%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </Widget>
              );
              
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}