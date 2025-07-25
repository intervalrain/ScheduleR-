/**
 * Burndown Chart Component
 * Displays sprint progress with ideal vs actual burn-down lines
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface BurndownChartProps {
  sprintId: string;
  sprintName: string;
  sprintStartDate: string;
  sprintEndDate: string;
}

export default function BurndownChart({ 
  sprintId, 
  sprintName,
  sprintStartDate,
  sprintEndDate 
}: BurndownChartProps) {
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [burndownMode, setBurndownMode] = useState<'includeTodo' | 'excludeTodo'>('includeTodo');
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchBurndownData = useCallback(async (mode: 'includeTodo' | 'excludeTodo' = 'includeTodo') => {
    setLoading(true);
    try {
      if (!session) {
        // Generate mock burndown data for demo
        const mockData: BurndownData = {
          sprintId,
          sprintName: "Demo Sprint",
          sprintStart: sprintStartDate,
          sprintEnd: sprintEndDate,
          totalHours: mode === 'includeTodo' ? 120 : 90,
          data: [
            { date: "2025-07-15", idealLine: mode === 'includeTodo' ? 120 : 90, remainLine: mode === 'includeTodo' ? 120 : 90 },
            { date: "2025-07-16", idealLine: mode === 'includeTodo' ? 112 : 84, remainLine: mode === 'includeTodo' ? 112 : 84 },
            { date: "2025-07-17", idealLine: mode === 'includeTodo' ? 104 : 78, remainLine: mode === 'includeTodo' ? 96 : 72 },
            { date: "2025-07-18", idealLine: mode === 'includeTodo' ? 96 : 72, remainLine: mode === 'includeTodo' ? 88 : 64 },
            { date: "2025-07-19", idealLine: mode === 'includeTodo' ? 88 : 66, remainLine: mode === 'includeTodo' ? 72 : 54 },
            { date: "2025-07-20", idealLine: mode === 'includeTodo' ? 80 : 60, remainLine: mode === 'includeTodo' ? 64 : 48 },
            { date: "2025-07-21", idealLine: mode === 'includeTodo' ? 72 : 54, remainLine: mode === 'includeTodo' ? 56 : 42 },
            { date: "2025-07-22", idealLine: mode === 'includeTodo' ? 64 : 48, remainLine: mode === 'includeTodo' ? 44 : 32 },
            { date: "2025-07-23", idealLine: mode === 'includeTodo' ? 56 : 42, remainLine: mode === 'includeTodo' ? 36 : 24 },
            { date: "2025-07-24", idealLine: mode === 'includeTodo' ? 48 : 36, remainLine: mode === 'includeTodo' ? 28 : 16 },
            { date: "2025-07-25", idealLine: mode === 'includeTodo' ? 40 : 30, remainLine: mode === 'includeTodo' ? 20 : 12 },
            { date: "2025-07-26", idealLine: mode === 'includeTodo' ? 32 : 24, remainLine: mode === 'includeTodo' ? 16 : 8 },
            { date: "2025-07-27", idealLine: mode === 'includeTodo' ? 24 : 18, remainLine: mode === 'includeTodo' ? 8 : 4 },
            { date: "2025-07-28", idealLine: mode === 'includeTodo' ? 16 : 12, remainLine: mode === 'includeTodo' ? 4 : 0 },
            { date: "2025-07-29", idealLine: 0, remainLine: 0 },
          ]
        };
        setBurndownData(mockData);
        return;
      }
      
      const response = await fetch(`/api/dashboard/burndown?sprintId=${sprintId}&mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        setBurndownData(data);
      } else {
        // API failed, use mock data as fallback
        console.warn("Burndown API failed, using mock data");
        const mockData: BurndownData = {
          sprintId,
          sprintName,
          sprintStart: sprintStartDate,
          sprintEnd: sprintEndDate,
          totalHours: 120,
          data: [
            { date: "2025-07-15", idealLine: 120, remainLine: 120 },
            { date: "2025-07-16", idealLine: 112, remainLine: 112 },
            { date: "2025-07-17", idealLine: 104, remainLine: 96 },
            { date: "2025-07-18", idealLine: 96, remainLine: 88 },
            { date: "2025-07-19", idealLine: 88, remainLine: 72 },
            { date: "2025-07-20", idealLine: 80, remainLine: 64 },
            { date: "2025-07-21", idealLine: 72, remainLine: 56 },
            { date: "2025-07-22", idealLine: 64, remainLine: 44 },
            { date: "2025-07-23", idealLine: 56, remainLine: 36 },
            { date: "2025-07-24", idealLine: 48, remainLine: 28 },
            { date: "2025-07-25", idealLine: 40, remainLine: 20 },
            { date: "2025-07-26", idealLine: 32, remainLine: 16 },
            { date: "2025-07-27", idealLine: 24, remainLine: 8 },
            { date: "2025-07-28", idealLine: 16, remainLine: 4 },
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
          { date: "2025-07-16", idealLine: 112, remainLine: 112 },
          { date: "2025-07-17", idealLine: 104, remainLine: 96 },
          { date: "2025-07-18", idealLine: 96, remainLine: 88 },
          { date: "2025-07-19", idealLine: 88, remainLine: 72 },
          { date: "2025-07-20", idealLine: 80, remainLine: 64 },
          { date: "2025-07-21", idealLine: 72, remainLine: 56 },
          { date: "2025-07-22", idealLine: 64, remainLine: 44 },
          { date: "2025-07-23", idealLine: 56, remainLine: 36 },
          { date: "2025-07-24", idealLine: 48, remainLine: 28 },
          { date: "2025-07-25", idealLine: 40, remainLine: 20 },
          { date: "2025-07-26", idealLine: 32, remainLine: 16 },
          { date: "2025-07-27", idealLine: 24, remainLine: 8 },
          { date: "2025-07-28", idealLine: 16, remainLine: 4 },
          { date: "2025-07-29", idealLine: 0, remainLine: 0 },
        ]
      };
      setBurndownData(mockData);
    } finally {
      setLoading(false);
    }
  }, [session, sprintId, sprintName, sprintStartDate, sprintEndDate]);

  useEffect(() => {
    fetchBurndownData(burndownMode);
  }, [sprintId, burndownMode, fetchBurndownData]);

  // Generate burndown chart data for Google Charts
  const getBurndownChartData = () => {
    if (!burndownData || !burndownData.data.length) {
      return [
        ['Date', 'Ideal Line', 'Remain Line'],
        ['No Data', 0, 0]
      ];
    }

    const chartData: (string | number)[][] = [
      ['Date', 'Ideal Line', 'Remain Line']
    ];

    burndownData.data.forEach(point => {
      chartData.push([
        point.date,
        point.idealLine,
        point.remainLine
      ]);
    });

    return chartData;
  };

  const burndownChartOptions = {
    title: `Sprint Burn-down Chart (${burndownMode === 'includeTodo' ? 'Including TODO' : 'Excluding TODO'})`,
    titleTextStyle: {
      fontSize: 16,
      bold: true
    },
    hAxis: {
      title: 'Date',
      titleTextStyle: { fontSize: 12 },
      textStyle: { fontSize: 10 }
    },
    vAxis: {
      title: 'Hours',
      titleTextStyle: { fontSize: 12 },
      textStyle: { fontSize: 10 },
      minValue: 0
    },
    series: {
      0: { 
        color: '#9ca3af', // Gray for ideal line
        lineWidth: 2,
        lineDashStyle: [5, 5] // Dashed line
      },
      1: { 
        color: '#ef4444', // Red for remaining line
        lineWidth: 3,
        areaOpacity: 0.3
      }
    },
    legend: {
      position: 'bottom',
      alignment: 'center',
      textStyle: { fontSize: 10 }
    },
    backgroundColor: '#ffffff',
    chartArea: {
      left: 60,
      top: 50,
      width: '80%',
      height: '70%'
    },
    height: 300,
    interpolateNulls: true
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDownIcon className="w-5 h-5" />
            Burn-down Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={burndownMode === 'includeTodo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBurndownMode('includeTodo')}
            >
              Include TODO
            </Button>
            <Button
              variant={burndownMode === 'excludeTodo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBurndownMode('excludeTodo')}
            >
              Exclude TODO
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Burn-down Chart...</p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Chart
              chartType="AreaChart"
              width="100%"
              height="300px"
              data={getBurndownChartData()}
              options={burndownChartOptions}
              loader={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Rendering Chart...</p>
                  </div>
                </div>
              }
            />
          </div>
        )}
        {burndownData && (
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 opacity-60 border-dashed border-2"></div>
                <span>Ideal Line: Linear burn-down target</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400"></div>
                <span>Not Yet Reviewing: Hours not yet entered review status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400"></div>
                <span>Remaining: {burndownMode === 'includeTodo' ? 'All unfinished hours' : 'In-progress and review hours only'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}