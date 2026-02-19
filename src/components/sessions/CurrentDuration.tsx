
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const getTimestamp = (startTime: Date | number) =>
  dayjs.duration(dayjs().diff(dayjs(startTime))).format("H:mm:ss");

export const CurrentDuration = ({
  startTime,
}: {
  startTime: Date | number;
}) => {
  const [durationString, setDuration] = useState<string>(
    getTimestamp(startTime),
  );
  const [isBlinking, setIsBlinking] = useState(true);

  useEffect(() => {
    const timeout = setInterval(() => {
      setDuration(getTimestamp(startTime));
      setIsBlinking((prev) => !prev);
    }, 1000);
    return () => clearInterval(timeout);
  }, [startTime]);

  // Split the duration into parts for styling
  const parts = durationString.split(":");

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full bg-green-500 ${isBlinking ? "opacity-100" : "opacity-40"} transition-opacity`}
        />
        <p className="text-xs text-muted-foreground">Duration</p>
      </div>
      <p className="text-base font-bold tabular-nums tracking-tight">
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && (
              <span className="text-muted-foreground/60 mx-0.5">:</span>
            )}
            <span>{part}</span>
          </span>
        ))}
      </p>
    </div>
  );
};
