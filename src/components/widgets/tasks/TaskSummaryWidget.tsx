/**
 * Task Summary Widget
 * Data Source: Real (from /api/tasks)
 * Category: Task management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "lucide-react";

interface Task {
  id: string;
  status: string;
}

interface TaskSummaryWidgetProps {
  tasks: Task[];
  className?: string;
}

export function TaskSummaryWidget({ tasks, className }: TaskSummaryWidgetProps) {
  const calculateTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "DONE").length;
    const inProgressTasks = tasks.filter(task => task.status === "IN_PROGRESS").length;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks
    };
  };

  const { totalTasks, completedTasks } = calculateTaskStats();

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-green-600">
            <CheckCircleIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Task Progress
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-green-600">
          {completedTasks}/{totalTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          Tasks completed
        </p>
      </CardContent>
    </Card>
  );
}

export default TaskSummaryWidget;