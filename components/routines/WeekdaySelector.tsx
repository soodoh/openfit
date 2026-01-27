"use client";

import dayjs from "dayjs";

const weekdayLabels = [
  { short: "S", full: "Sunday", value: 0 },
  { short: "M", full: "Monday", value: 1 },
  { short: "T", full: "Tuesday", value: 2 },
  { short: "W", full: "Wednesday", value: 3 },
  { short: "T", full: "Thursday", value: 4 },
  { short: "F", full: "Friday", value: 5 },
  { short: "S", full: "Saturday", value: 6 },
];

export const WeekdaySelector = ({
  selectedWeekdays,
  onChange,
  disabled = false,
}: {
  selectedWeekdays: number[];
  onChange: (weekdays: number[]) => void;
  disabled?: boolean;
}) => {
  const toggleWeekday = (weekday: number) => {
    if (disabled) return;
    const newWeekdays = selectedWeekdays.includes(weekday)
      ? selectedWeekdays.filter((d) => d !== weekday)
      : [...selectedWeekdays, weekday].sort((a, b) => a - b);
    onChange(newWeekdays);
  };

  return (
    <div className="space-y-3">
      {/* Weekday Selector */}
      <div className="flex gap-2 justify-between">
        {weekdayLabels.map((day) => (
          <button
            key={`weekday-${day.value}`}
            type="button"
            onClick={() => toggleWeekday(day.value)}
            disabled={disabled}
            aria-label={day.full}
            aria-pressed={selectedWeekdays.includes(day.value)}
            className={`
              w-10 h-10 rounded-full text-sm font-medium transition-all duration-200
              flex items-center justify-center
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${
                selectedWeekdays.includes(day.value)
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {day.short}
          </button>
        ))}
      </div>

      {/* Selected days summary */}
      {selectedWeekdays.length > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          Selected:{" "}
          <span className="text-foreground">
            {selectedWeekdays
              .map((d) => dayjs().day(d).format("dddd"))
              .join(", ")}
          </span>
        </p>
      )}
    </div>
  );
};
