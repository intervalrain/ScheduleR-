/**
 * Sprint Completion Widget
 * Data Source: Calculated (based on sprint dates)
 * Category: Progress tracking
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";

interface SprintCompletionWidgetProps {
  sprintStartDate: string;
  sprintEndDate: string;
  className?: string;
}

export function SprintCompletionWidget({ 
  sprintStartDate, 
  sprintEndDate, 
  className 
}: SprintCompletionWidgetProps) {
  // Calculate progress based on dates
  const calculateProgress = () => {
    const now = new Date();
    const start = new Date(sprintStartDate);
    const end = new Date(sprintEndDate);
    
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const progressPercentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    
    return {
      progressPercentage: Math.round(progressPercentage),
      elapsedDays,
      totalDays,
      remainingDays
    };
  };

  const { progressPercentage, elapsedDays, totalDays } = calculateProgress();

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-blue-600">
            <TrendingUpIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Sprint Completion
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-blue-600">
          {progressPercentage}%
        </div>
        <p className="text-xs text-muted-foreground">
          Day {elapsedDays} of {totalDays}
        </p>
      </CardContent>
    </Card>
  );
}

export default SprintCompletionWidget;