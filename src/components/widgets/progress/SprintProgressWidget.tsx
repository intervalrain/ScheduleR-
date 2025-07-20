/**
 * Sprint Progress Widget
 * Data Source: Calculated (based on sprint dates)
 * Category: Progress tracking
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { differenceInDays } from "date-fns";

interface SprintProgressWidgetProps {
  sprintStartDate: string;
  sprintEndDate: string;
  className?: string;
}

export function SprintProgressWidget({ 
  sprintStartDate, 
  sprintEndDate, 
  className 
}: SprintProgressWidgetProps) {
  const calculateProgress = () => {
    const now = new Date();
    const start = new Date(sprintStartDate);
    const end = new Date(sprintEndDate);
    
    const totalDays = differenceInDays(end, start) + 1;
    const elapsedDays = Math.max(0, differenceInDays(now, start) + 1);
    const remainingDays = Math.max(0, differenceInDays(end, now) + 1);
    
    return {
      elapsedDays,
      totalDays,
      remainingDays
    };
  };

  const { elapsedDays, totalDays, remainingDays } = calculateProgress();
  
  const getColor = () => {
    if (remainingDays > 5) return 'text-green-600';
    if (remainingDays > 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={getColor()}>
            <TrendingUpIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Sprint Progress
          </h3>
        </div>
        <div className={`text-2xl font-bold mb-1 ${getColor()}`}>
          {elapsedDays}/{totalDays}
        </div>
        <p className="text-xs text-muted-foreground">
          {remainingDays} days left
        </p>
      </CardContent>
    </Card>
  );
}

export default SprintProgressWidget;