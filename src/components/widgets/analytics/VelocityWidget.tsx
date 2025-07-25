/**
 * Velocity Widget
 * Data Source: Mock (shows completion percentage)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ZapIcon } from "lucide-react";

interface VelocityWidgetProps {
  taskProgressPercentage: number;
  className?: string;
}

export function VelocityWidget({ taskProgressPercentage, className }: VelocityWidgetProps) {
  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-orange-600">
            <ZapIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Velocity
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-orange-600">
          {Math.round(taskProgressPercentage)}
        </div>
        <p className="text-xs text-muted-foreground">
          Completion rate
        </p>
      </CardContent>
    </Card>
  );
}

export default VelocityWidget;