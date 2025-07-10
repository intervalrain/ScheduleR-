"use client";

import { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUpIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  BarChart3Icon,
  RefreshCwIcon,
  LayoutDashboardIcon 
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
}

interface WidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ id, title, icon, children }) => (
  <div key={id} className="h-full">
    <Card className="h-full">
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

  const initialLayouts = {
    lg: [
      { i: "completion-rate", x: 0, y: 0, w: 3, h: 3 },
      { i: "task-summary", x: 3, y: 0, w: 3, h: 3 },
      { i: "hours-summary", x: 6, y: 0, w: 3, h: 3 },
      { i: "progress-chart", x: 9, y: 0, w: 3, h: 3 },
      { i: "burndown", x: 0, y: 3, w: 6, h: 4 },
      { i: "recent-activity", x: 6, y: 3, w: 6, h: 4 },
    ],
  };

  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLayouts = localStorage.getItem("dashboardLayouts");
      return savedLayouts ? JSON.parse(savedLayouts) : initialLayouts;
    }
    return initialLayouts;
  });

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
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        onLayoutChange={onLayoutChange}
        margin={[16, 16]}
      >
        <Widget 
          id="completion-rate" 
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

        <Widget 
          id="task-summary" 
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

        <Widget 
          id="hours-summary" 
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

        <Widget 
          id="progress-chart" 
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

        <Widget 
          id="burndown" 
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

        <Widget 
          id="recent-activity" 
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
      </ResponsiveGridLayout>
    </div>
  );
}