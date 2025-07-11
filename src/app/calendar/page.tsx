"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  isWeekend,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addMonths,
  subMonths,
  parse,
  isWithinInterval,
  addDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { NewBusyHourDialog, RegularHourSettingsModal, CategoryManagementModal } from "@/components";
import { cn } from "@/lib/utils";

// Interfaces
interface BusyHour {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  title: string;
}

interface UserSettings {
  workHours: {
    start: string; // "HH:mm"
    end: string; // "HH:mm"
  };
  workDays: number[]; // 0 = Sunday, 1 = Monday, ...
  show24Hours: boolean;
}

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Main Component
export default function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [busyHours, setBusyHours] = useState<BusyHour[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    workHours: { start: "08:30", end: "17:30" },
    workDays: [1, 2, 3, 4, 5],
    show24Hours: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ startTime: Date; endTime: Date } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [isRegularHoursModalOpen, setIsRegularHoursModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: session } = useSession();

  // Data Fetching
  const fetchBusyHours = useCallback(async () => {
    try {
      const response = await fetch("/api/user/busy-hours");
      if (response.ok) {
        const data = await response.json();
        setBusyHours(data.map((bh: any) => ({ ...bh, startTime: new Date(bh.startTime), endTime: new Date(bh.endTime) })));
      }
    } catch (error) {
      console.error("Failed to fetch busy hours:", error);
    }
  }, []);

  const fetchUserSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setUserSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
    }
  }, []);

  const fetchSprints = useCallback(async () => {
    try {
      const response = await fetch("/api/sprints");
      if (response.ok) {
        setSprints(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch sprints:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/user/categories");
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          // Create default categories if none exist
          const defaultCategories = [
            { name: "Meeting", color: "#3b82f6" }, // blue-500
            { name: "Break", color: "#f59e0b" },   // amber-500
            { name: "Personal", color: "#8b5cf6" }, // violet-500
          ];
          for (const cat of defaultCategories) {
            await fetch("/api/user/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cat),
            });
          }
          // Refetch after creating defaults
          const updatedResponse = await fetch("/api/user/categories");
          setCategories(await updatedResponse.json());
        } else {
          setCategories(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchBusyHours();
      fetchUserSettings();
      fetchSprints();
      fetchCategories();
    }
  }, [session, fetchBusyHours, fetchUserSettings, fetchSprints, fetchCategories]);

  // Event Handlers
  const handleRangeSelected = (range: { startTime: Date; endTime: Date }) => {
    setSelectedRange(range);
    setIsDialogOpen(true);
  };

  const handleBusyHourCreated = () => {
    fetchBusyHours();
  };

  const handleSaveRegularHours = async (newSettings: any) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ...userSettings, ...newSettings } }),
      });
      if (response.ok) {
        fetchUserSettings(); // Refresh settings
      } else {
        console.error("Failed to save regular hours settings");
      }
    } catch (error) {
      console.error("Error saving regular hours settings:", error);
    }
  };

  // Render Logic
  return (
    <div className="p-6 h-full flex flex-col">
      <Header 
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        view={view}
        setView={setView}
        onOpenRegularHours={() => setIsRegularHoursModalOpen(true)}
      />
      <NewBusyHourDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        selectedRange={selectedRange}
        onBusyHourCreated={handleBusyHourCreated}
        categories={categories}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
      />
      <RegularHourSettingsModal
        isOpen={isRegularHoursModalOpen}
        setIsOpen={setIsRegularHoursModalOpen}
        userSettings={userSettings}
        onSave={handleSaveRegularHours}
      />
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        setIsOpen={setIsCategoryModalOpen}
        onCategoriesUpdated={fetchCategories}
      />
      {view === 'week' ? (
        <WeekView 
          currentDate={currentDate} 
          userSettings={userSettings} 
          busyHours={busyHours}
          onRangeSelected={handleRangeSelected}
          onBusyHourDeleted={fetchBusyHours}
          categories={categories}
        />
      ) : (
        <MonthView 
          currentDate={currentDate} 
          userSettings={userSettings} 
          busyHours={busyHours} 
          sprints={sprints} 
        />
      )}
    </div>
  );
}

// Header Component
function Header({ currentDate, setCurrentDate, view, setView, onOpenRegularHours }: any) {
  const handleViewChange = (newView: "week" | "month") => {
    setView(newView);
  };

  const handleDateNav = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
      setCurrentDate(newDate);
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => handleDateNav('prev')}>Previous</Button>
        <Button size="sm" onClick={() => handleDateNav('next')}>Next</Button>
        <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
      </div>
      <h2 className="text-lg font-semibold">
        {format(currentDate, view === 'week' ? 'MMMM yyyy' : 'MMMM yyyy')}
      </h2>
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
        <Button size="sm" variant={view === 'week' ? 'primary' : 'ghost'} onClick={() => handleViewChange('week')}>Week</Button>
        <Button size="sm" variant={view === 'month' ? 'primary' : 'ghost'} onClick={() => handleViewChange('month')}>Month</Button>
        <Button size="sm" variant="outline" onClick={onOpenRegularHours}>Settings</Button>
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ currentDate, userSettings, busyHours, onRangeSelected, onBusyHourDeleted, categories }: any) {
  const { workHours, workDays, show24Hours } = userSettings;
  const [selection, setSelection] = useState<{ day: Date; startTime: string; endTime: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    if (show24Hours) {
      for (let i = 0; i < 48; i++) {
        const startHour = Math.floor(i / 2).toString().padStart(2, "0");
        const startMinute = (i % 2 === 0) ? "00" : "30";
        const endHour = Math.floor((i + 1) / 2).toString().padStart(2, "0");
        const endMinute = ((i + 1) % 2 === 0) ? "00" : "30";
        slots.push({
          display: `${startHour}:${startMinute}-${endHour}:${endMinute}`,
          value: `${startHour}:${startMinute}`
        });
      }
    } else {
      const start = parse(workHours.start, "HH:mm", new Date());
      const end = parse(workHours.end, "HH:mm", new Date());
      let current = start;
      while (current < end) {
        const next = new Date(current);
        next.setMinutes(next.getMinutes() + 30);
        slots.push({
          display: `${format(current, "HH:mm")}-${format(next, "HH:mm")}`,
          value: format(current, "HH:mm")
        });
        current = next;
      }
    }
    return slots;
  }, [workHours, show24Hours]);

  const handleMouseDown = (day: Date, time: string) => {
    setIsDragging(true);
    setSelection({ day, startTime: time, endTime: time });
  };

  const handleMouseMove = (time: string) => {
    if (isDragging && selection) {
      setSelection({ ...selection, endTime: time });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selection) {
      const parsedStart = parse(selection.startTime, "HH:mm", selection.day);
      const parsedEnd = parse(selection.endTime, "HH:mm", selection.day);

      let finalStartTime: Date;
      let finalEndTime: Date;

      if (parsedStart <= parsedEnd) {
        finalStartTime = parsedStart;
        finalEndTime = new Date(parsedEnd.getTime()); // Create a new Date object to avoid modifying parsedEnd
        finalEndTime.setMinutes(finalEndTime.getMinutes() + 30); // Make selection inclusive
      } else {
        // Dragged backwards
        finalStartTime = parsedEnd;
        finalEndTime = new Date(parsedStart.getTime()); // Create a new Date object
        finalEndTime.setMinutes(finalEndTime.getMinutes() + 30); // Make selection inclusive
      }
      onRangeSelected({ startTime: finalStartTime, endTime: finalEndTime });
    }
    setIsDragging(false);
    setSelection(null);
  };

  const getBusyBlocksForDay = (day: Date) => {
    return busyHours.filter((bh: BusyHour) => isSameDay(bh.startTime, day));
  };

  return (
    <div className="flex-grow overflow-auto border-t border-l select-none" onMouseUp={handleMouseUp}>
      <div className="grid grid-cols-8 min-w-full">
        {/* Time column */}
        <div className="col-span-1 sticky left-0 bg-white z-10">
          <div className="h-10 border-b border-r"></div> {/* Empty cell for alignment */}
          {timeSlots.map((slot) => (
            <div key={slot.value} className="h-12 flex items-center justify-center border-b border-r">
              <span className="text-xs text-muted-foreground">{slot.display}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => (
          <div key={day.toString()} className="col-span-1 relative">
            <div className="h-10 flex flex-col items-center justify-center border-b border-r">
              <span className="font-semibold">{format(day, "EEE")}</span>
              <span className={cn("text-sm", isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground")}>
                {format(day, "d")}
              </span>
            </div>
            <div className="relative" onMouseLeave={handleMouseUp}>
              {timeSlots.map((slot, index) => {
                const isWorkDay = userSettings.workDays.includes(day.getDay());
                const isSelected = isDragging && selection?.day.getTime() === day.getTime() &&
                                   parse(slot.value, "HH:mm", day) >= parse(selection.startTime, "HH:mm", day) && 
                                   parse(slot.value, "HH:mm", day) < parse(selection.endTime, "HH:mm", day);

                return (
                  <div
                    key={slot.value}
                    onMouseDown={() => isWorkDay && handleMouseDown(day, slot.value)}
                    onMouseMove={() => isWorkDay && handleMouseMove(slot.value)}
                    className={cn(
                      "h-12 border-b border-r",
                      isWorkDay ? "bg-white cursor-pointer" : "bg-muted/50",
                      isSelected && "bg-primary/20"
                    )}
                  />
                );
              })}
              {/* Render busy hours */}
              {getBusyBlocksForDay(day).map((block: BusyHour) => {
                const top = timeSlots.findIndex((s: any) => s.value === format(block.startTime, "HH:mm")) * 3; // 3rem per slot (h-12)
                const height = (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 30) * 3; // 3rem per 30 mins
                const categoryColor = categories.find((cat: any) => cat.id === block.categoryId)?.color || "#ef4444"; // Default to red-500
                return (
                  <div
                    key={block.id}
                    className="absolute w-full text-white text-xs p-1 rounded-md z-10 group"
                    style={{ top: `${top}rem`, height: `${height}rem`, backgroundColor: categoryColor }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{block.title}</span>
                      <button
                        className="text-white hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the slot click
                          if (confirm(`Are you sure you want to delete "${block.title}"?`)) {
                            fetch(`/api/user/busy-hours/${block.id}`, {
                              method: "DELETE",
                            }).then(() => onBusyHourDeleted());
                          }
                        }}
                      >
                        X
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// Month View Component
function MonthView({ currentDate, userSettings, busyHours, sprints }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getAvailableHours = (day: Date) => {
    if (!userSettings.workDays.includes(day.getDay()) || isWeekend(day)) return 0;
    
    const { start, end } = userSettings.workHours;
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    let totalWorkMinutes = endMinutes - startMinutes;

    const dayBusyHours = busyHours.filter((bh: BusyHour) => isSameDay(bh.startTime, day));
    let busyMinutes = 0;
    dayBusyHours.forEach((bh: BusyHour) => {
      busyMinutes += (bh.endTime.getTime() - bh.startTime.getTime()) / (1000 * 60);
    });

    return Math.max(0, (totalWorkMinutes - busyMinutes) / 60);
  };

  const getSprintsForDay = (day: Date) => {
    return sprints.filter((sprint: Sprint) => {
      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);
      return isSameDay(day, sprintStart) || isSameDay(day, sprintEnd);
    });
  };

  const getAvailabilityColor = (availableHours: number) => {
    const maxHours = 8; // Assuming a standard 8-hour workday
    const percentage = Math.max(0, Math.min(1, availableHours / maxHours));

    // HSL values from globals.css
    const primaryColor = { h: 262, s: 83, l: 58 }; // --primary
    const grayColor = { h: 220, s: 9, l: 46 }; // --muted-foreground

    const h = primaryColor.h + (grayColor.h - primaryColor.h) * (1 - percentage);
    const s = primaryColor.s + (grayColor.s - primaryColor.s) * (1 - percentage);
    const l = primaryColor.l + (grayColor.l - primaryColor.l) * (1 - percentage);

    return `hsl(${h}, ${s}%, ${l}%`;
  };

  return (
    <div className="flex-grow grid grid-cols-7 grid-rows-6 border-t border-l">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
        <div key={day} className="text-center font-semibold p-2 border-b border-r bg-muted/50">{day}</div>
      ))}
      {days.map((day) => {
        const availableHours = getAvailableHours(day);
        return (
          <div 
            key={day.toString()} 
            className={cn(
              "border-b border-r p-2 flex flex-col",
              !isSameMonth(day, currentDate) && "text-muted-foreground bg-muted/20",
              isWeekend(day) && "bg-muted/50"
            )}
          >
            <span className={cn("font-medium", isSameDay(day, new Date()) && "text-primary")}>
              {format(day, "d")}
            </span>
            <div className="mt-1 text-sm">
              <span 
                className="font-bold text-white px-2 py-1 rounded-md text-xs"
                style={{ backgroundColor: getAvailabilityColor(availableHours) }}
              >
                {availableHours.toFixed(1)}h
              </span>
              <div className="mt-1">
                {getSprintsForDay(day).map((sprint: Sprint) => (
                  <div key={sprint.id} className="text-xs bg-secondary text-secondary-foreground p-1 rounded-md">
                    {sprint.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isSameMonth(day1: Date, day2: Date) {
  return day1.getMonth() === day2.getMonth();
}
