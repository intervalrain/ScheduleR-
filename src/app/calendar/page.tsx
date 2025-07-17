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
  addMonths,
  subMonths,
  parse,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { NewBusyHourDialog, RegularHourSettingsModal, CategoryManagementModal, DeleteConfirmationModal } from "@/components";
import { cn } from "@/lib/utils";

// Interfaces
interface BusyHour {
  categoryId: string;
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  recurringGroupId?: string;
}

interface UserSettings {
  workHours: {
    start: string; // "HH:mm"
    end: string; // "HH:mm"
  };
  workDays: number[]; // 0 = Sunday, 1 = Monday, ...
  show24Hours: boolean;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
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
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    workHours: { start: "08:30", end: "17:30" },
    workDays: [1, 2, 3, 4, 5],
    show24Hours: false,
    weekStartsOn: 1, // Default to Monday
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ startTime: Date; endTime: Date } | null>(null);
  const [categories, setCategories] = useState<{id: string; name: string; color: string}[]>([]);

  const [isRegularHoursModalOpen, setIsRegularHoursModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const { data: session } = useSession();

  // Data Fetching
  const fetchBusyHours = useCallback(async () => {
    try {
      const response = await fetch("/api/user/busy-hours");
      if (response.ok) {
        const data = await response.json();
        setBusyHours(data.map((bh: BusyHour & {startTime: string; endTime: string}) => ({ ...bh, startTime: new Date(bh.startTime), endTime: new Date(bh.endTime) })));
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
          setUserSettings(prevSettings => ({
            ...prevSettings,
            ...data.settings,
            weekStartsOn: data.settings.weekStartsOn ?? 1 // Default to Monday if not set
          }));
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
        const sprintsData = await response.json();
        setSprints(sprintsData);
        
        // Set current sprint - find active sprint or use the first one
        if (sprintsData.length > 0) {
          const now = new Date();
          const activeSprint = sprintsData.find((sprint: Sprint) => {
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            return now >= start && now <= end;
          });
          setCurrentSprint(activeSprint || sprintsData[0]);
        }
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

  const handleSaveRegularHours = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedSettings }),
      });
      if (response.ok) {
        setUserSettings(updatedSettings); // Update state immediately
        fetchUserSettings(); // Refresh settings from server
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
        currentSprint={currentSprint}
        onOpenRegularHours={() => setIsRegularHoursModalOpen(true)}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
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
          currentSprint={currentSprint}
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
interface HeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: "week" | "month";
  setView: (view: "week" | "month") => void;
  currentSprint: Sprint | null;
  onOpenRegularHours: () => void;
  onOpenCategoryModal: () => void;
}

function Header({ currentDate, setCurrentDate, view, setView, currentSprint, onOpenRegularHours, onOpenCategoryModal }: HeaderProps) {
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

  const handleSprintDateJump = (dateType: 'start' | 'end') => {
    if (currentSprint) {
      const targetDate = dateType === 'start' 
        ? new Date(currentSprint.startDate) 
        : new Date(currentSprint.endDate);
      setCurrentDate(targetDate);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => handleDateNav('prev')}>{'<'}</Button>
        <Button size="sm" onClick={() => handleDateNav('next')}>{'>'}</Button>
        <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
        {currentSprint && (
          <>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => handleSprintDateJump('start')}
              title={`Jump to sprint start: ${format(new Date(currentSprint.startDate), 'MMM dd, yyyy')}`}
            >
              Sprint Start
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => handleSprintDateJump('end')}
              title={`Jump to sprint end: ${format(new Date(currentSprint.endDate), 'MMM dd, yyyy')}`}
            >
              Sprint End
            </Button>
          </>
        )}
      </div>
      <h2 className="text-lg font-semibold">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
      <div className="flex items-center gap-2 p-1 space-x-2">
        <div className="bg-muted rounded-lg">
          <Button size="sm" variant={view === 'week' ? 'destructive' : 'ghost'} onClick={() => handleViewChange('week')}>Week</Button>
          <Button size="sm" variant={view === 'month' ? 'destructive' : 'ghost'} onClick={() => handleViewChange('month')}>Month</Button>
        </div>
        <div className="rounded-lg space-x-4">
          <Button size="sm" variant="outline" onClick={onOpenRegularHours}>Settings</Button>
          <Button size="sm" variant="outline" onClick={onOpenCategoryModal}>Category</Button>
        </div>
      </div>
    </div>
  );
}

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  userSettings: UserSettings;
  busyHours: BusyHour[];
  currentSprint: Sprint | null;
  onRangeSelected: (range: { startTime: Date; endTime: Date }) => void;
  onBusyHourDeleted: () => void;
  categories: {id: string; name: string; color: string}[];
}

function WeekView({ currentDate, userSettings, busyHours, currentSprint, onRangeSelected, onBusyHourDeleted, categories }: WeekViewProps) {
  const { workHours, show24Hours, weekStartsOn } = userSettings;
  const [selection, setSelection] = useState<{ day: Date; startTime: string; endTime: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BusyHour | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<BusyHour | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn }),
    end: endOfWeek(currentDate, { weekStartsOn }),
  });

  // Helper functions for visual markers
  const isToday = (day: Date) => isSameDay(day, new Date());
  
  const isSprintStart = (day: Date) => {
    if (!currentSprint) return false;
    return isSameDay(day, new Date(currentSprint.startDate));
  };
  
  const isSprintEnd = (day: Date) => {
    if (!currentSprint) return false;
    return isSameDay(day, new Date(currentSprint.endDate));
  };
  
  const isWithinSprint = (day: Date) => {
    if (!currentSprint) return false;
    const sprintStart = new Date(currentSprint.startDate);
    const sprintEnd = new Date(currentSprint.endDate);
    return day >= sprintStart && day <= sprintEnd;
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render for current time position
      // This forces re-render by updating the currentTime dependency
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Global mouse event handlers for dragging
  useEffect(() => {
    let currentDropPosition: { dayIndex: number; timeSlotIndex: number } | null = null;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingBlock || !draggedBlock) return;
      
      // Find the calendar grid container
      const calendarContainer = document.querySelector('.grid.grid-cols-8');
      if (!calendarContainer) return;
      
      const rect = calendarContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate which day column and time slot
      const columnWidth = rect.width / 8;
      const dayIndex = Math.floor(x / columnWidth) - 1; // -1 because first column is time
      
      if (dayIndex >= 0 && dayIndex < weekDays.length) {
        const headerHeight = 56; // h-14 = 3.5rem = 56px
        const slotHeight = 48; // h-12 = 3rem = 48px
        const timeSlotIndex = Math.floor((y - headerHeight) / slotHeight);
        
        if (timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
          currentDropPosition = { dayIndex, timeSlotIndex };
          
          // Update the dragged block position visually
          const draggedElement = document.querySelector(`[data-block-id="${draggedBlock.id}"]`);
          if (draggedElement) {
            (draggedElement as HTMLElement).style.transform = `translate(${x - (dragOffset?.x || 0)}px, ${y - (dragOffset?.y || 0)}px)`;
          }
        }
      }
    };

    const handleGlobalMouseUp = async () => {
      if (isDraggingBlock && draggedBlock && currentDropPosition) {
        // Calculate new date and time
        const newDay = weekDays[currentDropPosition.dayIndex];
        const newTimeSlot = timeSlots[currentDropPosition.timeSlotIndex];
        
        // Calculate duration of the original block
        const originalDuration = draggedBlock.endTime.getTime() - draggedBlock.startTime.getTime();
        
        // Create new start and end times
        const newStartTime = parse(newTimeSlot.value, "HH:mm", newDay);
        const newEndTime = new Date(newStartTime.getTime() + originalDuration);
        
        // Update via API
        try {
          const response = await fetch(`/api/user/busy-hours/${draggedBlock.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startTime: newStartTime.toISOString(),
              endTime: newEndTime.toISOString()
            })
          });
          
          if (response.ok) {
            onBusyHourDeleted(); // Refresh data
          } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to update time block position');
          }
        } catch (error) {
          console.error('Error updating block position:', error);
          alert('Failed to update time block position');
        }
      }
      
      handleBlockMouseUp();
    };

    if (isDraggingBlock) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingBlock, draggedBlock, dragOffset, weekDays, onBusyHourDeleted]);

  const handleDeleteBusyHour = async (block: BusyHour, deleteType: 'single' | 'future' | 'all') => {
    let deleteUrl = `/api/user/busy-hours/${block.id}`;
    
    if (deleteType === 'future') {
      deleteUrl += '?deleteFuture=true';
    } else if (deleteType === 'all') {
      deleteUrl += '?deleteRecurring=true';
    }
    
    try {
      await fetch(deleteUrl, { method: "DELETE" });
      onBusyHourDeleted();
    } catch (error) {
      console.error('Error deleting busy hour:', error);
    }
  };

  const handleBlockMouseDown = (block: BusyHour, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setDraggedBlock(block);
    setIsDraggingBlock(true);
  };

  const handleBlockMouseMove = (event: React.MouseEvent) => {
    if (!isDraggingBlock || !draggedBlock || !dragOffset) return;
    
    event.preventDefault();
    // We'll update the block position during mouse move
    // The actual position calculation will be done here
  };

  const handleBlockMouseUp = async () => {
    if (isDraggingBlock && draggedBlock) {
      // Reset the transform on the dragged element
      const draggedElement = document.querySelector(`[data-block-id="${draggedBlock.id}"]`);
      if (draggedElement) {
        (draggedElement as HTMLElement).style.transform = '';
      }

      // Here we would calculate the new date/time and update via API
      // For now, we'll just reset the dragging state
      // In a full implementation, you'd:
      // 1. Calculate which day and time slot the block was dropped on
      // 2. Validate if it's a valid location
      // 3. Update the block via API
      // 4. Refresh the data
      
      try {
        // Example API call to update block position
        // const response = await fetch(`/api/user/busy-hours/${draggedBlock.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     startTime: newStartTime,
        //     endTime: newEndTime
        //   })
        // });
        // if (response.ok) {
        //   onBusyHourDeleted(); // Refresh data
        // }
        
        console.log('Block dragging completed for:', draggedBlock.title);
      } catch (error) {
        console.error('Error updating block position:', error);
      }
    }
    
    setIsDraggingBlock(false);
    setDraggedBlock(null);
    setDragOffset(null);
  };

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
    // Allow dragging to start anywhere
    setIsDragging(true);
    setSelection({ day, startTime: time, endTime: time });
  };

  const handleMouseMove = (time: string) => {
    if (isDragging && selection) {
      // Allow dragging to any time slot
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
        finalEndTime = new Date(parsedEnd.getTime()); 
        finalEndTime.setMinutes(finalEndTime.getMinutes() + 30); 
      } else {
        // Dragged backwards
        finalStartTime = parsedEnd;
        finalEndTime = new Date(parsedStart.getTime()); 
        finalEndTime.setMinutes(finalEndTime.getMinutes() + 30); 
      }
      
      // Validate the selection before triggering the dialog
      const isWorkDay = userSettings.workDays.includes(selection.day.getDay());
      const isDayWithinSprint = isWithinSprint(selection.day);
      
      // Check if time slots are within work hours
      const isWithinWorkHours = show24Hours ? (() => {
        const workStart = parse(workHours.start, "HH:mm", new Date());
        const workEnd = parse(workHours.end, "HH:mm", new Date());
        const startHour = finalStartTime.getHours() * 60 + finalStartTime.getMinutes();
        const endHour = finalEndTime.getHours() * 60 + finalEndTime.getMinutes();
        const workStartMinutes = workStart.getHours() * 60 + workStart.getMinutes();
        const workEndMinutes = workEnd.getHours() * 60 + workEnd.getMinutes();
        return startHour >= workStartMinutes && endHour <= workEndMinutes;
      })() : true;
      
      // Only proceed if selection is valid
      if (isWorkDay && isDayWithinSprint && isWithinWorkHours) {
        onRangeSelected({ startTime: finalStartTime, endTime: finalEndTime });
      } else {
        // Show a message explaining why the selection is invalid
        let message = "Cannot create time block: ";
        if (!isWorkDay) message += "Selected day is not a work day.";
        else if (!isDayWithinSprint) message += "Selected day is outside sprint period.";
        else if (!isWithinWorkHours) message += "Selected time is outside work hours.";
        alert(message);
      }
    }
    setIsDragging(false);
    setSelection(null);
  };

  const getBusyBlocksForDay = (day: Date) => {
    return busyHours.filter((bh: BusyHour) => isSameDay(bh.startTime, day));
  };

  // Calculate current time position - only for today
  const getCurrentTimePosition = () => {
    const now = new Date();
    
    // Check if current week contains today
    const todayInThisWeek = weekDays.some(day => isToday(day));
    if (!todayInThisWeek) return null;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    if (show24Hours) {
      // In 24-hour view, calculate position based on all 24 hours
      const totalMinutesIn24Hours = 24 * 60;
      const positionPercentage = (currentTimeInMinutes / totalMinutesIn24Hours) * 100;
      return (positionPercentage / 100) * (timeSlots.length * 3); // 3rem per slot
    } else {
      // In work hours view, calculate position relative to work hours
      const workStart = parse(workHours.start, "HH:mm", new Date());
      const workEnd = parse(workHours.end, "HH:mm", new Date());
      const workStartMinutes = workStart.getHours() * 60 + workStart.getMinutes();
      const workEndMinutes = workEnd.getHours() * 60 + workEnd.getMinutes();
      
      if (currentTimeInMinutes < workStartMinutes || currentTimeInMinutes > workEndMinutes) {
        return null; // Current time is outside work hours
      }
      
      const relativeMinutes = currentTimeInMinutes - workStartMinutes;
      const totalWorkMinutes = workEndMinutes - workStartMinutes;
      const positionPercentage = (relativeMinutes / totalWorkMinutes) * 100;
      return (positionPercentage / 100) * (timeSlots.length * 3); // 3rem per slot
    }
  };

  const currentTimePosition = getCurrentTimePosition();
  const todayColumnIndex = weekDays.findIndex(day => isToday(day));

  return (
    <div 
      className={cn(
        "flex-grow overflow-auto bg-white select-none transition-all duration-200 ease-in-out relative",
        isDraggingBlock && "cursor-move"
      )} 
      onMouseUp={handleMouseUp}
      onMouseMove={handleBlockMouseMove}
      onMouseLeave={handleBlockMouseUp}
    >
      {/* Current time indicator - only for today column */}
      {currentTimePosition !== null && todayColumnIndex >= 0 && (
        <div 
          className="absolute z-20 pointer-events-none"
          style={{ 
            top: `${3.5 + currentTimePosition}rem`, // 3.5rem for header height (h-14) + time position
            left: `${(todayColumnIndex + 1) * 12.5}%`, // Position in today's column (12.5% per column)
            width: '12.5%' // Width of one column
          }}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></div>
            <div className="flex-1 h-0.5 bg-red-500 shadow-sm"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></div>
          </div>
        </div>
      )}
      <div className={cn(
        "grid grid-cols-8 min-w-full relative border border-gray-200 rounded-lg overflow-hidden",
        isDraggingBlock && "[&_*]:!border-transparent"
      )}>
        {/* Time column */}
        <div className="col-span-1 sticky left-0 bg-gray-50 z-10">
          <div className="h-14 border-b border-r border-gray-200 bg-gray-50"></div> {/* Empty cell for alignment */}
          {timeSlots.map((slot) => (
            <div key={slot.value} className="h-12 flex items-center justify-center border-b border-r border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-600 font-medium">{slot.value}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const isWorkDay = userSettings.workDays.includes(day.getDay());
          const isDayWithinSprint = isWithinSprint(day);
          const isDayAvailable = isWorkDay && isDayWithinSprint;
          
          return (
            <div key={day.toString()} className="col-span-1 relative">
              <div className={cn(
                "h-14 flex flex-col items-center justify-center border-b border-r border-gray-200 relative",
                isToday(day) && isDayAvailable ? "bg-blue-50 border-blue-200" : "bg-white",
                !isDayAvailable && "bg-gray-50"
              )}>
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wide mb-1",
                  isToday(day) && isDayAvailable ? "text-blue-600" : "text-gray-500"
                )}>{format(day, "EEE")}</span>
                <span className={cn(
                  "text-lg font-semibold",
                  isToday(day) && isDayAvailable ? "text-blue-600 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center" : 
                  isDayAvailable ? "text-gray-700" : "text-gray-400"
                )}>
                  {format(day, "d")}
                </span>
              {/* Visual markers */}
              <div className="absolute top-1 right-1 flex gap-1">
                {isToday(day) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Today"></div>
                )}
                {isSprintStart(day) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Sprint Start"></div>
                )}
                {isSprintEnd(day) && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title="Sprint End"></div>
                )}
              </div>
            </div>
            <div className="relative" onMouseLeave={handleMouseUp}>
              {timeSlots.map((slot) => {
                const isDayWithinSprint = isWithinSprint(day);
                
                // Check if current time slot is within work hours when in 24-hour view
                const isWithinWorkHours = show24Hours ? (() => {
                  const slotTime = parse(slot.value, "HH:mm", new Date());
                  const workStart = parse(workHours.start, "HH:mm", new Date());
                  const workEnd = parse(workHours.end, "HH:mm", new Date());
                  return slotTime >= workStart && slotTime < workEnd;
                })() : true;
                
                // A day is interactable if it's a work day, within sprint, and within work hours
                const isSelected = isDragging && selection?.day.getTime() === day.getTime() &&
                                   parse(slot.value, "HH:mm", day) >= parse(selection.startTime, "HH:mm", day) && 
                                   parse(slot.value, "HH:mm", day) < parse(selection.endTime, "HH:mm", day);

                // Determine if this slot should be styled as available or unavailable
                const isAvailableSlot = isWorkDay && isDayWithinSprint && (show24Hours ? isWithinWorkHours : true);

                return (
                  <div
                    key={slot.value}
                    onMouseDown={() => isAvailableSlot && handleMouseDown(day, slot.value)}
                    onMouseMove={() => isAvailableSlot && handleMouseMove(slot.value)}
                    className={cn(
                      "h-12 border-b border-r border-gray-200 transition-all duration-150 ease-in-out",
                      isAvailableSlot ? "bg-white hover:bg-gray-50 cursor-pointer" : "bg-gray-100 cursor-not-allowed",
                      isSelected && "bg-blue-100 shadow-sm border-blue-200"
                    )}
                  />
                );
              })}
              {/* Render busy hours */}
              {getBusyBlocksForDay(day).map((block: BusyHour) => {
                const top = timeSlots.findIndex((s) => s.value === format(block.startTime, "HH:mm")) * 3; // 3rem per slot (h-12)
                const height = (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 30) * 3; // 3rem per 30 mins
                const categoryColor = categories.find((cat) => cat.id === block.categoryId)?.color || "#ef4444"; // Default to red-500
                return (
                  <div
                    key={block.id}
                    data-block-id={block.id}
                    className={cn(
                      "absolute w-full text-white text-xs p-2 rounded-lg z-10 group shadow-sm hover:shadow-md transition-all duration-200 border border-white/20",
                      isDraggingBlock && draggedBlock?.id === block.id && "z-50 shadow-2xl scale-105 rotate-1",
                      "cursor-move"
                    )}
                    style={{ 
                      top: `${top}rem`, 
                      height: `${height}rem`, 
                      backgroundColor: categoryColor,
                      left: '2px',
                      right: '2px',
                      width: 'calc(100% - 4px)'
                    }}
                    onMouseDown={(e) => handleBlockMouseDown(block, e)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm leading-tight">{block.title}</span>
                        <button
                          className="text-white hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-1"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the slot click
                            setItemToDelete(block);
                            setDeleteModalOpen(true);
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="text-xs opacity-90 leading-tight">
                        {format(block.startTime, "HH:mm")} - {format(block.endTime, "HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        title={itemToDelete?.title || ""}
        isRecurring={!!itemToDelete?.recurringGroupId}
        onConfirm={(deleteType) => {
          if (itemToDelete) {
            handleDeleteBusyHour(itemToDelete, deleteType);
            setItemToDelete(null);
          }
        }}
      />
    </div>
  );
}


// Month View Component
interface MonthViewProps {
  currentDate: Date;
  userSettings: UserSettings;
  busyHours: BusyHour[];
  sprints: Sprint[];
}

function MonthView({ currentDate, userSettings, busyHours, sprints }: MonthViewProps) {
  const { weekStartsOn } = userSettings;
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getAvailableHours = (day: Date) => {
    if (!userSettings.workDays.includes(day.getDay()) || isWeekend(day)) return 0;
    
    const { start, end } = userSettings.workHours;
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const totalWorkMinutes = endMinutes - startMinutes;

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

  const isWithinAnySprint = (day: Date) => {
    return sprints.some((sprint: Sprint) => {
      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);
      return day >= sprintStart && day <= sprintEnd;
    });
  };

  const getSprintStatusForDay = (day: Date) => {
    const dayStatus: Array<{type: 'start' | 'end'; sprint: Sprint}> = [];
    sprints.forEach((sprint: Sprint) => {
      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);
      if (isSameDay(day, sprintStart)) {
        dayStatus.push({ type: 'start', sprint });
      }
      if (isSameDay(day, sprintEnd)) {
        dayStatus.push({ type: 'end', sprint });
      }
    });
    return dayStatus;
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

  const dayHeaders = weekStartsOn === 0 
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex-grow grid grid-cols-7 grid-rows-6 border-t border-l">
      {dayHeaders.map(day => (
        <div key={day} className="text-center font-semibold p-2 border-b border-r bg-muted/50">{day}</div>
      ))}
      {days.map((day) => {
        const availableHours = getAvailableHours(day);
        const sprintStatuses = getSprintStatusForDay(day);
        const withinSprint = isWithinAnySprint(day);
        return (
          <div 
            key={day.toString()} 
            className={cn(
              "border-b border-r p-2 flex flex-col",
              !isSameMonth(day, currentDate) && "text-muted-foreground bg-muted/20",
              isWeekend(day) && "bg-muted/50"
            )}
          >
            <span className={cn("font-medium", isSameDay(day, new Date()) && "font-extrabold text-xl text-primary")}>
              {format(day, "d")}
            </span>
            <div className="mt-1 text-sm">
              {withinSprint && (
                <span 
                  className="font-bold text-white px-2 py-1 rounded-md text-xs"
                  style={{ backgroundColor: getAvailabilityColor(availableHours) }}
                >
                  {availableHours.toFixed(1)}h
                </span>
              )}
              <div className="mt-1 space-y-1">
                {sprintStatuses.map((status, index) => (
                  <div key={index} className={cn(
                    "text-xs px-1 py-0.5 rounded-md text-white font-medium",
                    status.type === 'start' ? "bg-green-500" : "bg-red-500"
                  )}>
                    {status.type === 'start' ? 'Sprint Starts' : 'Sprint Ends'}
                  </div>
                ))}
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
