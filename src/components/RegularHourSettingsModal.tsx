
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegularHourSettingsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userSettings: {
    workHours: { start: string; end: string };
    workDays: number[];
    show24Hours: boolean;
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  };
  onSave: (settings: {
    workHours?: { start: string; end: string };
    workDays?: number[];
    show24Hours?: boolean;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  }) => void;
  isReadOnly?: boolean;
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
  isReadOnly = false,
}: RegularHourSettingsModalProps) {
  const [workHours, setWorkHours] = useState(userSettings.workHours);
  const [workDays, setWorkDays] = useState(userSettings.workDays);
  const [show24Hours, setShow24Hours] = useState(userSettings.show24Hours || false);
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(userSettings.weekStartsOn ?? 1);

  useEffect(() => {
    setWorkHours(userSettings.workHours);
    setWorkDays(userSettings.workDays);
    setShow24Hours(userSettings.show24Hours || false);
    setWeekStartsOn(userSettings.weekStartsOn ?? 1);
  }, [userSettings]);

  const handleWorkDayChange = (dayId: number) => {
    const newWorkDays = workDays.includes(dayId)
      ? workDays.filter((d: number) => d !== dayId)
      : [...workDays, dayId];
    setWorkDays(newWorkDays);
  };

  const handleSave = () => {
    onSave({ workHours, workDays, show24Hours, weekStartsOn });
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
                  disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
                    disabled={isReadOnly}
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
              disabled={isReadOnly}
            />
            <Label htmlFor="show-24-hours">Show 24-hour view</Label>
          </div>

          <div>
            <Label htmlFor="week-start">Week Start</Label>
            <Select
              value={weekStartsOn.toString()}
              onValueChange={(value) => setWeekStartsOn(parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Start with Sunday</SelectItem>
                <SelectItem value="1">Start with Monday</SelectItem>
                <SelectItem value="2">Start with Tuesday</SelectItem>
                <SelectItem value="3">Start with Wednesday</SelectItem>
                <SelectItem value="4">Start with Thursday</SelectItem>
                <SelectItem value="5">Start with Friday</SelectItem>
                <SelectItem value="6">Start with Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isReadOnly}>
            {isReadOnly ? 'Preview Mode' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
