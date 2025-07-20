/**
 * Task Distribution Widget
 * Data Source: Calculated (calculated from task data)
 * Category: Task management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TargetIcon } from "lucide-react";

interface Task {
  id: string;
  status: string;
}

interface TaskDistributionWidgetProps {
  tasks: Task[];
  className?: string;
}

export function TaskDistributionWidget({ tasks, className }: TaskDistributionWidgetProps) {
  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "DONE").length;
    const reviewTasks = tasks.filter(task => task.status === "REVIEW").length;
    const inProgressTasks = tasks.filter(task => task.status === "IN_PROGRESS").length;
    const todoTasks = tasks.filter(task => task.status === "TODO").length;

    return {
      totalTasks,
      completedTasks,
      reviewTasks,
      inProgressTasks,
      todoTasks
    };
  };

  const { 
    totalTasks,
    completedTasks,
    reviewTasks,
    inProgressTasks,
    todoTasks } = calculateStats();

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-indigo-600">
            <TargetIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Task Distribution
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-indigo-600">
          {todoTasks} | {inProgressTasks} | {reviewTasks} | {completedTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          {/* {totalTasks} in total */}
          To do | In Progress | Reviewing | Done
        </p>
      </CardContent>
    </Card>
  );
}

export default TaskDistributionWidget;