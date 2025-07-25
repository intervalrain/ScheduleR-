/**
 * Hours Summary Widget
 * Data Source: Real (from /api/tasks estimated hours)
 * Category: Time management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

interface Task {
  id: string;
  estimatedHours?: number;
}

interface HoursSummaryWidgetProps {
  tasks: Task[];
  className?: string;
}

export function HoursSummaryWidget({ tasks, className }: HoursSummaryWidgetProps) {
  const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-purple-600">
            <ClockIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Hours
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-purple-600">
          {totalHours}h
        </div>
        <p className="text-xs text-muted-foreground">
          Estimated work
        </p>
      </CardContent>
    </Card>
  );
}

export default HoursSummaryWidget;