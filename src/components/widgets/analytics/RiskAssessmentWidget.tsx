/**
 * Risk Assessment Widget
 * Data Source: Mock (no real risk calculation yet)
 * Category: Analytics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";

interface RiskAssessmentWidgetProps {
  progressPercentage: number;
  className?: string;
}

export function RiskAssessmentWidget({ progressPercentage, className }: RiskAssessmentWidgetProps) {
  const getRiskLevel = () => {
    if (progressPercentage > 70) return { level: 'Low', color: 'text-green-600' };
    if (progressPercentage > 40) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  const { level, color } = getRiskLevel();

  return (
    <Card className={`text-center cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={color}>
            <AlertTriangleIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Risk Assessment
          </h3>
        </div>
        <div className={`text-2xl font-bold mb-1 ${color}`}>
          {level}
        </div>
        <p className="text-xs text-muted-foreground">
          Sprint risk level
        </p>
      </CardContent>
    </Card>
  );
}

export default RiskAssessmentWidget;