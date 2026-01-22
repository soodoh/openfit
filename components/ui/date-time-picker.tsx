"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

interface DateTimePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  disabled,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || undefined);
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(value, "HH:mm") : "00:00",
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange?.(null);
      return;
    }

    const [hours, minutes] = timeValue.split(":").map(Number);
    selectedDate.setHours(hours, minutes, 0, 0);
    setDate(selectedDate);
    onChange?.(selectedDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value;
    setTimeValue(newTimeValue);

    if (date) {
      const [hours, minutes] = newTimeValue.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      setDate(newDate);
      onChange?.(newDate);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {date ? format(date, "MMM d, h:mm a") : "Pick a date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} />
          <div className="border-t p-3">
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
