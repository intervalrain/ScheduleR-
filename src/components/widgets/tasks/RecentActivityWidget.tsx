/**
 * Recent Activity Widget
 * Data Source: Mock (currently shows total task count)
 * Category: Task management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranchIcon } from "lucide-react";

interface Task {
  id: string;
}

interface RecentActivityWidgetProps {
  tasks: Task[];
  className?: string;
}

export function RecentActivityWidget({ tasks, className }: RecentActivityWidgetProps) {
  const totalTasks = tasks.length;

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-gray-600">
            <GitBranchIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-gray-600">
          {totalTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          Total tasks tracked
        </p>
      </CardContent>
    </Card>
  );
}

export default RecentActivityWidget;