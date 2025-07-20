/**
 * Calendar Overview Widget
 * Data Source: Real (from /api/user/busy-hours)
 * Category: Time management
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface BusyHour {
  id: string;
  startTime: string;
  endTime: string;
}

interface CalendarOverviewWidgetProps {
  busyHours: BusyHour[];
  className?: string;
}

export function CalendarOverviewWidget({ busyHours, className }: CalendarOverviewWidgetProps) {
  const calculateTotalBusyHours = () => {
    return busyHours.reduce((total, bh) => {
      const start = new Date(bh.startTime);
      const end = new Date(bh.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const totalBusyHours = Math.round(calculateTotalBusyHours());

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-pink-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Calendar Overview
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-pink-600">
          {totalBusyHours}h
        </div>
        <p className="text-xs text-muted-foreground">
          Time blocked this sprint
        </p>
      </CardContent>
    </Card>
  );
}

export default CalendarOverviewWidget;