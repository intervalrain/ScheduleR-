/**
 * Team Workload Widget
 * Data Source: Mock (currently shows active tasks count)
 * Category: Team management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

interface Task {
  id: string;
  status: string;
}

interface TeamWorkloadWidgetProps {
  tasks: Task[];
  className?: string;
}

export function TeamWorkloadWidget({ tasks, className }: TeamWorkloadWidgetProps) {
  const inProgressTasks = tasks.filter(task => task.status === "IN_PROGRESS").length;

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-indigo-600">
            <UsersIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Team Status
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-indigo-600">
          {inProgressTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          Active tasks
        </p>
      </CardContent>
    </Card>
  );
}

export default TeamWorkloadWidget;