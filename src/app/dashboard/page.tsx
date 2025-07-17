"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
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
  AlertTriangleIcon
} from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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

const Widget: React.FC<WidgetProps> = ({ id, title, icon, children }) => (
  <div key={id} className="w-1/4 h-1/4 max-h-svh p-0.5">
    <Card className="h-full">
      <CardHeader className="pb-3 drag-handle cursor-move">
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
  const [enabledWidgets, setEnabledWidgets] = useState<{id: string, size: 'small' | 'medium' | 'large'}[]>([
    { id: "completion-rate", size: "small" },
    { id: "task-summary", size: "small" },
    { id: "hours-summary", size: "small" },
    { id: "sprint-health", size: "small" },
    { id: "progress-chart", size: "small" },
    { id: "team-workload", size: "medium" },
    { id: "velocity", size: "small" },
    { id: "risk-assessment", size: "small" },
    { id: "burndown", size: "medium" },
    { id: "recent-activity", size: "medium" }
  ]);

  const getWidgetLayoutSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return { w: 3, h: 2 };  // 1/4 width (3 out of 12)
      case 'medium':
        return { w: 6, h: 2 };  // 1/2 width (6 out of 12)
      case 'large':
        return { w: 12, h: 2 }; // full width (12 out of 12)
      default:
        return { w: 3, h: 2 };
    }
  };

  const generateInitialLayouts = (widgets: {id: string, size: 'small' | 'medium' | 'large'}[]) => {
    const layouts: { [key: string]: any[] } = { lg: [] };
    let x = 0, y = 0;
    let maxRowHeight = 0;
    
    widgets.forEach((widget, index) => {
      const size = getWidgetLayoutSize(widget.size);
      
      // Check if widget fits in current row (max 4 cards per row = 12 units)
      if (x + size.w > 12) {
        x = 0;
        y += maxRowHeight;
        maxRowHeight = 0;
      }
      
      layouts.lg.push({
        i: widget.id,
        x: x,
        y: y,
        w: size.w,
        h: size.h
      });
      
      x += size.w;
      maxRowHeight = Math.max(maxRowHeight, size.h);
    });
    
    return layouts;
  };

  const initialLayouts = generateInitialLayouts([
    { id: "completion-rate", size: "small" },
    { id: "task-summary", size: "small" },
    { id: "hours-summary", size: "small" },
    { id: "sprint-health", size: "small" },
    { id: "progress-chart", size: "small" },
    { id: "team-workload", size: "medium" },
    { id: "velocity", size: "small" },
    { id: "risk-assessment", size: "small" },
    { id: "burndown", size: "medium" },
    { id: "recent-activity", size: "medium" }
  ]);

  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLayouts = localStorage.getItem("dashboardLayouts");
      return savedLayouts ? JSON.parse(savedLayouts) : initialLayouts;
    }
    return initialLayouts;
  });
  
  // Load saved widgets from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidgets = localStorage.getItem("enabledWidgets");
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            setEnabledWidgets(parsed);
          }
        } catch (e) {
          console.error('Error parsing saved widgets:', e);
        }
      }
    }
  }, []);
  
  // Update layouts when widgets change
  React.useEffect(() => {
    const newLayouts = generateInitialLayouts(enabledWidgets);
    setLayouts(newLayouts);
  }, [enabledWidgets]);

  const handleWidgetToggle = (widgetId: string, enabled: boolean, size: 'small' | 'medium' | 'large' = 'small') => {
    setEnabledWidgets(prev => {
      const newWidgets = enabled 
        ? [...prev.filter(w => w.id !== widgetId), { id: widgetId, size }]
        : prev.filter(w => w.id !== widgetId);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("enabledWidgets", JSON.stringify(newWidgets));
      }
      return newWidgets;
    });
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardLayouts", JSON.stringify(layouts));
    }
  }, [layouts]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

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

      <div className="relative min-h-[400px]">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={onLayoutChange}
          margin={[16, 16]}
          isDraggable={true}
          isResizable={false}
          draggableHandle=".drag-handle"
        >
        {enabledWidgets.map(widget => {
          switch (widget.id) {
            case "completion-rate":
              return (
                <Widget 
                  key={widget.id}
                  id={widget.id}
                  title="Sprint Completion Rate"
                  icon={<TrendingUpIcon className="w-4 h-4" />}
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
              
            default:
              return null;
          }
        })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}