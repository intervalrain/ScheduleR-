/**
 * Code Commits Widget
 * Data Source: Mock (requires external API)
 * Category: External integrations
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranchIcon } from "lucide-react";

interface CodeCommitsWidgetProps {
  className?: string;
}

export function CodeCommitsWidget({ className }: CodeCommitsWidgetProps) {
  // Mock data - would need GitHub/GitLab API integration
  const mockCommits = 42;

  return (
    <Card className={`text-center cursor-move hover:shadow-md opacity-60 h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="text-gray-600">
            <GitBranchIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Code Commits
          </h3>
        </div>
        <div className="text-2xl font-bold mb-1 text-gray-600">
          {mockCommits}
        </div>
        <p className="text-xs text-muted-foreground">
          This sprint (Coming Soon)
        </p>
      </CardContent>
    </Card>
  );
}

export default CodeCommitsWidget;