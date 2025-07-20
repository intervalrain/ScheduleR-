/**
 * Sprint Health Widget
 * Data Source: Mock (simplified calculation)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HeartIcon } from "lucide-react";

interface SprintHealthWidgetProps {
  progressPercentage: number;
  className?: string;
}

export function SprintHealthWidget({ progressPercentage, className }: SprintHealthWidgetProps) {
  const getHealthStatus = () => {
    if (progressPercentage > 80) return { status: 'Excellent', color: 'text-green-600' };
    if (progressPercentage > 60) return { status: 'Good', color: 'text-green-600' };
    if (progressPercentage > 40) return { status: 'Fair', color: 'text-yellow-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const { status, color } = getHealthStatus();

  return (
    <Card className={`text-center cursor-move hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={color}>
            <HeartIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Sprint Health
          </h3>
        </div>
        <div className={`text-2xl font-bold mb-1 ${color}`}>
          {status}
        </div>
        <p className="text-xs text-muted-foreground">
          Sprint progress
        </p>
      </CardContent>
    </Card>
  );
}

export default SprintHealthWidget;