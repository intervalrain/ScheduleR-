/**
 * Team Communication Widget
 * Data Source: Mock (requires chat system)
 * Category: External integrations
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

interface TeamCommunicationWidgetProps {
  className?: string;
}

export function TeamCommunicationWidget({ className }: TeamCommunicationWidgetProps) {
  // Mock data - would need chat/comments system
  const mockMessages = 18;

  return (
    <Card className={`text-center cursor-move hover:shadow-md opacity-60 h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-gray-600">
            <UsersIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Team Communication
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-gray-600">
          {mockMessages}
        </div>
        <p className="text-xs text-muted-foreground">
          Messages today (Coming Soon)
        </p>
      </CardContent>
    </Card>
  );
}

export default TeamCommunicationWidget;