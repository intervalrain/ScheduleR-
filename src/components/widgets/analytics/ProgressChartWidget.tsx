/**
 * Progress Chart Widget
 * Data Source: Real (from /api/tasks status)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3Icon } from "lucide-react";

interface Task {
  id: string;
  status: string;
}

interface ProgressChartWidgetProps {
  tasks: Task[];
  className?: string;
}

export function ProgressChartWidget({ tasks, className }: ProgressChartWidgetProps) {
  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "DONE").length;
    const inProgressTasks = tasks.filter(task => task.status === "IN_PROGRESS").length;
    const todoTasks = tasks.filter(task => task.status === "TODO").length;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks
    };
  };

  const { totalTasks, completedTasks, inProgressTasks, todoTasks } = calculateStats();

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-blue-600">
            <BarChart3Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Progress Overview
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-blue-600">
          {completedTasks}/{totalTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          {todoTasks} pending, {inProgressTasks} active
        </p>
      </CardContent>
    </Card>
  );
}

export default ProgressChartWidget;