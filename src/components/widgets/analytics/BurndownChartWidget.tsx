/**
 * Burndown Chart Widget
 * Data Source: Mock (no time tracking data yet)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDownIcon } from "lucide-react";

interface BurndownChartWidgetProps {
  totalTasks: number;
  completedTasks: number;
  className?: string;
}

export function BurndownChartWidget({ totalTasks, completedTasks, className }: BurndownChartWidgetProps) {
  const remainingTasks = totalTasks - completedTasks;

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-red-600">
            <TrendingDownIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Burndown Chart
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-red-600">
          {remainingTasks}
        </div>
        <p className="text-xs text-muted-foreground">
          Tasks remaining
        </p>
      </CardContent>
    </Card>
  );
}

export default BurndownChartWidget;