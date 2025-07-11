
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays, isPast } from "date-fns";
import { useSession } from "next-auth/react";

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Task {
  id: string;
  status: string;
}

export default function Home() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchSprints();
    }
  }, [session]);

  useEffect(() => {
    if (selectedSprint) {
      fetchTasksForSprint(selectedSprint.id);
    }
  }, [selectedSprint]);

  const fetchSprints = async () => {
    try {
      const response = await fetch("/api/sprints");
      if (response.ok) {
        const data = await response.json();
        setSprints(data);
        if (data.length > 0) {
          setSelectedSprint(data[0]); // Select the first sprint by default
        }
      }
    } catch (error) {
      console.error("Failed to fetch sprints:", error);
    }
  };

  const fetchTasksForSprint = async (sprintId: string) => {
    try {
      const response = await fetch(`/api/tasks?sprintId=${sprintId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const totalDays = selectedSprint
    ? differenceInDays(new Date(selectedSprint.endDate), new Date(selectedSprint.startDate)) + 1
    : 0;
  const remainingDays = selectedSprint
    ? differenceInDays(new Date(selectedSprint.endDate), new Date()) + 1
    : 0;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Welcome to ScheduleR</h1>
      <p className="text-muted-foreground">
        Manage your sprints, tasks, and team collaboration in one place.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedSprint && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Current Sprint: {selectedSprint.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Duration: {format(new Date(selectedSprint.startDate), "MMM d, yyyy")} -{" "}
                {format(new Date(selectedSprint.endDate), "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Total Days: {totalDays}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Remaining Days: {remainingDays > 0 ? remainingDays : 0} (Sprint {isPast(new Date(selectedSprint.endDate)) ? "ended" : "ongoing"})
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Tasks: {completedTasks} / {totalTasks} completed
              </p>
            </CardContent>
          </Card>
        )}

        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Recent Tasks</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your recent tasks
          </p>
        </div>
        
        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Sprint Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track your current sprint progress
          </p>
        </div>
        
        <div className="task-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Team Activity</h3>
          <p className="text-sm text-muted-foreground">
            See what your team is working on
          </p>
        </div>
      </div>
    </div>
  );
}
