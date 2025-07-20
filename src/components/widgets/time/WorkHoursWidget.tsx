/**
 * Work Hours Widget
 * Data Source: Real (from /api/user/busy-hours + sprint config)
 * Category: Time management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

interface WorkHoursWidgetProps {
  totalSprintHours: number;
  busyHours: number;
  className?: string;
}

export function WorkHoursWidget({ 
  totalSprintHours, 
  busyHours, 
  className 
}: WorkHoursWidgetProps) {
  const availableHours = Math.max(0, totalSprintHours - busyHours);
  
  const getColor = () => {
    if (availableHours > totalSprintHours * 0.7) return 'text-green-600';
    if (availableHours > totalSprintHours * 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={getColor()}>
            <ClockIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Available Hours
          </h3>
        </div>
        <div className={`text-2xl font-bold mb-1 ${getColor()}`}>
          {Math.round(availableHours)}h
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round(busyHours)}h busy / {Math.round(totalSprintHours)}h total
        </p>
      </CardContent>
    </Card>
  );
}

export default WorkHoursWidget;