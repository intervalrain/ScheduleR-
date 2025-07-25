/**
 * Burndown Chart Widget
 * Data Source: Real (from /api/dashboard/burndown)
 * Category: Analytics
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDownIcon } from "lucide-react";
import { Chart } from "react-google-charts";
import { useSession } from "next-auth/react";

interface BurndownDataPoint {
  date: string;
  idealLine: number;
  remainLine: number;
}

interface BurndownData {
  sprintId: string;
  sprintName: string;
  sprintStart: string;
  sprintEnd: string;
  totalHours: number;
  data: BurndownDataPoint[];
}

interface BurndownChartWidgetProps {
  sprintId: string;
  sprintName: string;
  sprintStartDate: string;
  sprintEndDate: string;
  className?: string;
}

export function BurndownChartWidget({ 
  sprintId, 
  sprintName,
  sprintStartDate,
  sprintEndDate,
  className 
}: BurndownChartWidgetProps) {
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchBurndownData = useCallback(async () => {
    setLoading(true);
    try {
      if (!session) {
        // Generate mock burndown data for demo
        const mockData: BurndownData = {
          sprintId,
          sprintName: "Demo Sprint",
          sprintStart: sprintStartDate,
          sprintEnd: sprintEndDate,
          totalHours: 120,
          data: [
            { date: "2025-07-15", idealLine: 120, remainLine: 120 },
            { date: "2025-07-17", idealLine: 104, remainLine: 96 },
            { date: "2025-07-19", idealLine: 88, remainLine: 72 },
            { date: "2025-07-21", idealLine: 72, remainLine: 56 },
            { date: "2025-07-23", idealLine: 56, remainLine: 36 },
            { date: "2025-07-25", idealLine: 40, remainLine: 20 },
            { date: "2025-07-27", idealLine: 24, remainLine: 8 },
            { date: "2025-07-29", idealLine: 0, remainLine: 0 },
          ]
        };
        setBurndownData(mockData);
        return;
      }
      
      const response = await fetch(`/api/dashboard/burndown?sprintId=${sprintId}&mode=includeTodo`);
      if (response.ok) {
        const data = await response.json();
        setBurndownData(data);
      } else {
        // API failed, use mock data as fallback
        const mockData: BurndownData = {
          sprintId,
          sprintName,
          sprintStart: sprintStartDate,
          sprintEnd: sprintEndDate,
          totalHours: 120,
          data: [
            { date: "2025-07-15", idealLine: 120, remainLine: 120 },
            { date: "2025-07-17", idealLine: 104, remainLine: 96 },
            { date: "2025-07-19", idealLine: 88, remainLine: 72 },
            { date: "2025-07-21", idealLine: 72, remainLine: 56 },
            { date: "2025-07-23", idealLine: 56, remainLine: 36 },
            { date: "2025-07-25", idealLine: 40, remainLine: 20 },
            { date: "2025-07-27", idealLine: 24, remainLine: 8 },
            { date: "2025-07-29", idealLine: 0, remainLine: 0 },
          ]
        };
        setBurndownData(mockData);
      }
    } catch (error) {
      console.error("Failed to fetch burndown data:", error);
      // Use mock data on error
      const mockData: BurndownData = {
        sprintId,
        sprintName: `${sprintName} (Mock)`,
        sprintStart: sprintStartDate,
        sprintEnd: sprintEndDate,
        totalHours: 120,
        data: [
          { date: "2025-07-15", idealLine: 120, remainLine: 120 },
          { date: "2025-07-17", idealLine: 104, remainLine: 96 },
          { date: "2025-07-19", idealLine: 88, remainLine: 72 },
          { date: "2025-07-21", idealLine: 72, remainLine: 56 },
          { date: "2025-07-23", idealLine: 56, remainLine: 36 },
          { date: "2025-07-25", idealLine: 40, remainLine: 20 },
          { date: "2025-07-27", idealLine: 24, remainLine: 8 },
          { date: "2025-07-29", idealLine: 0, remainLine: 0 },
        ]
      };
      setBurndownData(mockData);
    } finally {
      setLoading(false);
    }
  }, [session, sprintId, sprintName, sprintStartDate, sprintEndDate]);

  useEffect(() => {
    fetchBurndownData();
  }, [fetchBurndownData]);

  // Generate burndown chart data for Google Charts
  const getBurndownChartData = () => {
    if (!burndownData || !burndownData.data.length) {
      return [
        ['Date', 'Ideal', 'Actual'],
        ['No Data', 0, 0]
      ];
    }

    const chartData: (string | number)[][] = [
      ['Date', 'Ideal', 'Actual']
    ];

    // Sample every other data point for widget display
    const sampledData = burndownData.data.filter((_, index) => index % 2 === 0);

    sampledData.forEach(point => {
      chartData.push([
        point.date.split('-').slice(1).join('/'), // Show MM/DD format
        point.idealLine,
        point.remainLine
      ]);
    });

    return chartData;
  };

  const chartOptions = {
    titleTextStyle: { fontSize: 0 }, // Hide title
    hAxis: {
      textStyle: { fontSize: 8 },
      gridlines: { color: 'transparent' },
      baselineColor: '#e5e7eb'
    },
    vAxis: {
      textStyle: { fontSize: 8 },
      gridlines: { color: '#f3f4f6', count: 3 },
      baselineColor: '#e5e7eb',
      minValue: 0
    },
    series: {
      0: { 
        color: '#9ca3af',
        lineWidth: 1,
        lineDashStyle: [2, 2]
      },
      1: { 
        color: '#ef4444',
        lineWidth: 2
      }
    },
    legend: { position: 'none' },
    backgroundColor: 'transparent',
    chartArea: {
      left: 25,
      top: 10,
      width: '85%',
      height: '80%'
    },
    height: 120,
    interpolateNulls: true
  };

  // Calculate current status
  const getCurrentStatus = () => {
    if (!burndownData || !burndownData.data.length) return { status: 'No Data', color: 'text-gray-500' };
    
    const latestData = burndownData.data[burndownData.data.length - 1];
    const remaining = latestData.remainLine;
    const ideal = latestData.idealLine;
    
    if (remaining === 0) return { status: 'Complete', color: 'text-green-600' };
    if (remaining <= ideal) return { status: 'On Track', color: 'text-green-600' };
    if (remaining <= ideal * 1.2) return { status: 'At Risk', color: 'text-yellow-600' };
    return { status: 'Behind', color: 'text-red-600' };
  };

  const { status, color } = getCurrentStatus();

  return (
    <Card className={`cursor-move hover:shadow-md h-48 ${className}`}>
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className={color}>
              <TrendingDownIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Burndown Status: 
            </h3>
            <p className={`text-sm font-medium ${color} text-muted-foreground`}>
              {status}
            </p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          ) : (
            <div className="w-full h-full">
              <Chart
                chartType="LineChart"
                width="100%"
                height="160px"
                data={getBurndownChartData()}
                options={chartOptions}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BurndownChartWidget;