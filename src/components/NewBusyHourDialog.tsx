"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parse } from "date-fns";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface NewBusyHourDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedRange: { startTime: Date; endTime: Date } | null;
  onBusyHourCreated: () => void;
  categories: {id: string; name: string; color: string}[];
  onOpenCategoryModal: () => void;
}

export function NewBusyHourDialog({
  isOpen,
  setIsOpen,
  selectedRange,
  onBusyHourCreated,
  categories,
  onOpenCategoryModal,
}: NewBusyHourDialogProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [repeatFrequency, setRepeatFrequency] = useState<"none" | "daily" | "weekly">("none");
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(undefined);
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && selectedRange) {
      setTitle(""); // Reset title on new selection
      setStartTime(format(selectedRange.startTime, "HH:mm"));
      setEndTime(format(selectedRange.endTime, "HH:mm"));
      setSelectedCategoryId(null);
      setRepeatFrequency("none");
      setRepeatEndDate(undefined);
      setSelectedRepeatDays([]);

      // Default repeat end date to 1 year from selected start date
      const oneYearLater = new Date(selectedRange.startTime);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      setRepeatEndDate(oneYearLater);

    } else if (!isOpen) {
      setTitle("");
    }
  }, [isOpen, selectedRange]);

  const handleSubmit = async () => {
    if (!selectedRange || (!title && !selectedCategoryId)) return;

    const day = selectedRange.startTime;
    const startDateTime = parse(startTime, "HH:mm", day);
    const endDateTime = parse(endTime, "HH:mm", day);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    try {
      const response = await fetch("/api/user/busy-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: selectedCategory ? selectedCategory.name : title,
          startTime: startDateTime.toISOString(), 
          endTime: endDateTime.toISOString(),
          categoryId: selectedCategoryId,
          repeatFrequency,
          repeatEndDate: repeatEndDate?.toISOString(),
          selectedRepeatDays,
        }),
      });

      if (response.ok) {
        onBusyHourCreated();
        setIsOpen(false);
      } else {
        console.error("Failed to create busy hour");
      }
    } catch (error) {
      console.error("Error creating busy hour:", error);
    }
  };

  const daysOfWeek = [
    { id: 0, label: "Sun" },
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
  ];

  const handleRepeatDayChange = (dayId: number) => {
    setSelectedRepeatDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Busy Time on {selectedRange ? format(selectedRange.startTime, "MMMM d, yyyy") : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId || undefined}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="p-1">
                  <Button variant="ghost" className="w-full" onClick={onOpenCategoryModal}>
                    + Add category
                  </Button>
                </div>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Or Custom Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Meeting" disabled={!!selectedCategoryId} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">Start Time</Label>
            <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">End Time</Label>
            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" />
          </div>

          {/* Repetition Settings */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="repeat-frequency" className="text-right">Repeat</Label>
            <Select onValueChange={(value: "none" | "daily" | "weekly") => setRepeatFrequency(value)} value={repeatFrequency}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select repeat frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {repeatFrequency !== "none" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="repeat-end-date" className="text-right">Repeat Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal col-span-3",
                      !repeatEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {repeatEndDate ? format(repeatEndDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={repeatEndDate}
                    onSelect={setRepeatEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {repeatFrequency === "weekly" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Repeat On</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    variant={selectedRepeatDays.includes(day.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRepeatDayChange(day.id)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
