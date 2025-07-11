
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
import { Checkbox } from "@/components/ui/checkbox";

interface RegularHourSettingsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userSettings: any;
  onSave: (settings: any) => void;
}

const daysOfWeek = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
  { id: 0, label: "Sunday" },
];

export function RegularHourSettingsModal({
  isOpen,
  setIsOpen,
  userSettings,
  onSave,
}: RegularHourSettingsModalProps) {
  const [workHours, setWorkHours] = useState(userSettings.workHours);
  const [workDays, setWorkDays] = useState(userSettings.workDays);
  const [show24Hours, setShow24Hours] = useState(false); // New state for 24-hour view

  useEffect(() => {
    setWorkHours(userSettings.workHours);
    setWorkDays(userSettings.workDays);
  }, [userSettings]);

  const handleWorkDayChange = (dayId: number) => {
    const newWorkDays = workDays.includes(dayId)
      ? workDays.filter((d: number) => d !== dayId)
      : [...workDays, dayId];
    setWorkDays(newWorkDays);
  };

  const handleSave = () => {
    onSave({ workHours, workDays });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regular Hour Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Work Hours</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work-start">Start Time</Label>
                <Input
                  id="work-start"
                  type="time"
                  value={workHours.start}
                  onChange={(e) =>
                    setWorkHours({ ...workHours, start: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="work-end">End Time</Label>
                <Input
                  id="work-end"
                  type="time"
                  value={workHours.end}
                  onChange={(e) =>
                    setWorkHours({ ...workHours, end: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Work Days</h2>
            <div className="flex flex-wrap gap-4">
              {daysOfWeek.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={workDays.includes(day.id)}
                    onCheckedChange={() => handleWorkDayChange(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-24-hours"
              checked={show24Hours}
              onCheckedChange={(checked: boolean) => setShow24Hours(checked)}
            />
            <Label htmlFor="show-24-hours">Show 24-hour view</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
