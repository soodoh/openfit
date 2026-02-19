import { cn } from "@/lib/utils";
import * as React from "react";

interface DurationInputProps extends Omit<
  React.ComponentProps<"input">,
  "value" | "onChange"
> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Input component for duration in MM:ss format.
 * Validates input to only allow valid duration strings.
 */
const DurationInput = React.forwardRef<HTMLInputElement, DurationInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty string
      if (input === "") {
        onChange("");
        return;
      }

      // Only allow digits and one colon
      if (!/^[\d:]*$/.test(input)) {
        return;
      }

      // Don't allow more than one colon
      if ((input.match(/:/g) || []).length > 1) {
        return;
      }

      // Parse and validate
      const parts = input.split(":");

      if (parts.length === 1) {
        // No colon yet - just digits for minutes
        // Limit to reasonable length (3 digits max for minutes)
        if (parts[0].length > 3) {
          return;
        }
        onChange(input);
      } else {
        // Has colon - validate minutes and seconds
        const [minutes, seconds] = parts;

        // Minutes can be up to 3 digits
        if (minutes.length > 3) {
          return;
        }

        // Seconds must be 0-59 and max 2 digits
        if (seconds.length > 2) {
          return;
        }

        // If seconds has 2 digits, validate it's <= 59
        if (seconds.length === 2) {
          const secNum = parseInt(seconds, 10);
          if (secNum > 59) {
            return;
          }
        }

        // If first digit of seconds is > 5, it's invalid
        if (seconds.length >= 1 && parseInt(seconds[0], 10) > 5) {
          return;
        }

        onChange(input);
      }
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
DurationInput.displayName = "DurationInput";

/**
 * Parses a MM:ss duration string to total seconds.
 * Returns undefined if the string is empty.
 */
export function parseDurationToSeconds(duration: string): number | undefined {
  if (!duration) {
    return undefined;
  }

  const parts = duration.split(":");
  const minutes = parseInt(parts[0] ?? "0", 10) || 0;
  const seconds = parseInt(parts[1] ?? "0", 10) || 0;

  return minutes * 60 + seconds;
}

export { DurationInput };
