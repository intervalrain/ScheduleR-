"use client";

import { useEffect, useRef } from "react";
import Gantt from "frappe-gantt";

export default function GanttPage() {
  const ganttRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ganttRef.current) {
      const tasks = [
        {
          id: "Task 1",
          name: "Redesign website",
          start: "2024-07-01",
          end: "2024-07-15",
          progress: 50,
          dependencies: "",
        },
        {
          id: "Task 2",
          name: "Develop backend API",
          start: "2024-07-05",
          end: "2024-07-25",
          progress: 30,
          dependencies: "Task 1",
        },
        {
          id: "Task 3",
          name: "Deploy to production",
          start: "2024-07-20",
          end: "2024-07-30",
          progress: 0,
          dependencies: "Task 2",
        },
      ];

      new Gantt(ganttRef.current, tasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: "YYYY-MM-DD",
        language: "en",
        custom_popup_html: null,
        on_click: function (task: any) {
          console.log(task);
        },
        on_date_change: function (task: any, start: any, end: any) {
          console.log(task, start, end);
        },
        on_progress_change: function (task: any, progress: any) {
          console.log(task, progress);
        },
        on_view_change: function (mode: any) {
          console.log(mode);
        },
      });
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gantt Chart</h1>
      <div ref={ganttRef}></div>
    </div>
  );
}