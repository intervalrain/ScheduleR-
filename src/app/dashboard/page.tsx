"use client";

import { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Widget: React.FC<WidgetProps> = ({ id, title, children }) => (
  <div key={id} className="bg-white p-4 rounded-lg shadow border">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    {children}
  </div>
);

export default function DashboardPage() {
  const initialLayouts = {
    lg: [
      { i: "a", x: 0, y: 0, w: 4, h: 3 },
      { i: "b", x: 4, y: 0, w: 4, h: 3 },
      { i: "c", x: 8, y: 0, w: 4, h: 3 },
    ],
  };

  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLayouts = localStorage.getItem("dashboardLayouts");
      return savedLayouts ? JSON.parse(savedLayouts) : initialLayouts;
    }
    return initialLayouts;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardLayouts", JSON.stringify(layouts));
    }
  }, [layouts]);

  const onLayoutChange = (layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={onLayoutChange}
      >
        <Widget id="a" title="Burn Down Chart">
          <p>Chart content here</p>
        </Widget>
        <Widget id="b" title="Sprint Completion Rate">
          <p>Rate content here</p>
        </Widget>
        <Widget id="c" title="Total Available Work Hours">
          <p>Hours content here</p>
        </Widget>
      </ResponsiveGridLayout>
    </div>
  );
}