"use client";

import React from "react";
import { useSprint } from "@/context/SprintContext";
import BurndownChart from "@/components/BurndownChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, TrendingDownIcon } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export default function BurndownPage() {
  const { selectedSprint, loading: sprintLoading } = useSprint();

  if (sprintLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sprint information...</p>
        </div>
      </div>
    );
  }

  if (!selectedSprint) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Burn-down Chart</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track your sprint progress with detailed burn-down analysis
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingDownIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Sprint</h3>
              <p className="text-muted-foreground mb-4">
                Select or create a sprint to view its burn-down chart.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDays = differenceInDays(new Date(selectedSprint.endDate), new Date(selectedSprint.startDate)) + 1;
  const remainingDays = Math.max(0, differenceInDays(new Date(selectedSprint.endDate), new Date()) + 1);
  const elapsedDays = Math.max(0, differenceInDays(new Date(), new Date(selectedSprint.startDate)) + 1);
  const progressPercentage = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Burn-down Chart</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your sprint progress with detailed burn-down analysis
        </p>
      </div>

      {/* Sprint Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {selectedSprint.name} - Sprint Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
              <p className="text-lg font-semibold">{totalDays} days</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedSprint.startDate), "MMM d")} - {format(new Date(selectedSprint.endDate), "MMM d, yyyy")}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
              <p className="text-lg font-semibold">
                Day {elapsedDays} of {totalDays}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="text-lg font-semibold">
                {isPast(new Date(selectedSprint.endDate)) ? '🔴 Ended' : 
                 remainingDays === 0 ? '🟡 Last Day' :
                 '🟢 Active'}
              </p>
              <p className="text-xs text-muted-foreground">
                {remainingDays > 0 ? `${remainingDays} days remaining` : 'Sprint completed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Burn-down Chart */}
      <BurndownChart
        sprintId={selectedSprint.id}
        sprintName={selectedSprint.name}
        sprintStartDate={selectedSprint.startDate}
        sprintEndDate={selectedSprint.endDate}
      />

      {/* Chart Information */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding the Burn-down Chart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Chart Elements</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-gray-400 border-dashed border-2"></div>
                <span><strong>Ideal Line:</strong> Shows the perfect linear burn-down if work is completed evenly throughout the sprint</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-2 bg-red-400"></div>
                <span><strong>Remaining Line:</strong> Shows actual remaining work based on task completion</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Chart Modes</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Include TODO:</strong> Includes all unfinished tasks (TODO, IN_PROGRESS, REVIEW) in remaining work calculation
              </div>
              <div>
                <strong>Exclude TODO:</strong> Only includes IN_PROGRESS and REVIEW tasks, excluding TODO tasks from the remaining work
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Interpretation</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• If the remaining line is <strong>above</strong> the ideal line, you're behind schedule</div>
              <div>• If the remaining line is <strong>below</strong> the ideal line, you're ahead of schedule</div>
              <div>• A steep drop in the remaining line indicates rapid progress</div>
              <div>• A flat remaining line suggests work has stalled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}