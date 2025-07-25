/**
 * Sprint Health Widget
 * Data Source: Real (calculated from sprint and task data)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HeartIcon } from "lucide-react";
import { differenceInDays } from "date-fns";

interface Task {
  id: string;
  status: string;
}

interface SprintHealthWidgetProps {
  sprintStartDate: string;
  sprintEndDate: string;
  tasks: Task[];
  className?: string;
}

export function SprintHealthWidget({ 
  sprintStartDate, 
  sprintEndDate, 
  tasks,
  className 
}: SprintHealthWidgetProps) {
  const calculateSprintHealth = () => {
    const now = new Date();
    const start = new Date(sprintStartDate);
    const end = new Date(sprintEndDate);
    
    // Time calculations
    const totalDays = differenceInDays(end, start) + 1;
    const elapsedDays = Math.max(0, differenceInDays(now, start) + 1);
    const remainingDays = Math.max(0, differenceInDays(end, now) + 1);
    
    // Task calculations (handle undefined tasks)
    const safeTasks = tasks || [];
    const totalTasks = safeTasks.length;
    const completedTasks = safeTasks.filter(task => task.status === "DONE").length;
    const inProgressTasks = safeTasks.filter(task => task.status === "IN_PROGRESS").length;
    
    // 1. Task Completion Rate (40%)
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // 2. Schedule Performance (30%)
    const idealCompletionRate = (elapsedDays / totalDays) * 100;
    const schedulePerformance = 100 - Math.abs(idealCompletionRate - taskCompletionRate);
    
    // 3. Task Flow (20%)
    const taskFlowRate = totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0;
    const taskFlowScore = taskFlowRate > 30 ? 70 : 100; // Penalty if too many tasks in progress
    
    // 4. Time Buffer (10%)
    const timeBufferScore = (remainingDays / totalDays) * 100;
    
    // Calculate overall health
    const overallHealth = 
      (taskCompletionRate * 0.4) + 
      (schedulePerformance * 0.3) + 
      (taskFlowScore * 0.2) + 
      (timeBufferScore * 0.1);
    
    return {
      overallHealth: Math.round(overallHealth),
      taskCompletionRate: Math.round(taskCompletionRate),
      schedulePerformance: Math.round(schedulePerformance),
      taskFlowScore: Math.round(taskFlowScore),
      timeBufferScore: Math.round(timeBufferScore)
    };
  };
  
  const { overallHealth } = calculateSprintHealth();
  
  const getHealthStatus = () => {
    if (overallHealth >= 85) return { status: 'Excellent', color: 'text-green-600' };
    if (overallHealth >= 70) return { status: 'Good', color: 'text-green-600' };
    if (overallHealth >= 50) return { status: 'Fair', color: 'text-yellow-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const { status, color } = getHealthStatus();

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={color}>
            <HeartIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Sprint Health
          </h3>
        </div>
        <div className={`text-2xl font-bold mb-1 ${color}`}>
          {status}
        </div>
        <p className="text-xs text-muted-foreground">
          {overallHealth}% overall health
        </p>
      </CardContent>
    </Card>
  );
}

export default SprintHealthWidget;