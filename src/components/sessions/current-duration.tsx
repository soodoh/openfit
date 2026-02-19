import dayjs from "dayjs";
import { useEffect, useState } from "react";
const getTimestamp = (startTime: Date | number) =>
  dayjs.duration(dayjs().diff(dayjs(startTime))).format("H:mm:ss");
export const CurrentDuration = ({
  startTime,
}: {
  startTime: Date | number;
}): any => {
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
  const segments = [
    { id: "hours", value: parts[0] },
    { id: "minutes", value: parts[1] },
    { id: "seconds", value: parts[2] },
  ].filter(
    (
      segment,
    ): segment is {
      id: string;
      value: string;
    } => segment.value !== undefined,
  );
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className={`w-1.5 h-1.5 rounded-full bg-green-500 ${isBlinking ? "opacity-100" : "opacity-40"} transition-opacity`}
        />
        <p className="text-xs text-muted-foreground">Duration</p>
      </div>
      <p className="text-base font-bold tabular-nums tracking-tight">
        {segments.map((segment) => (
          <span key={segment.id}>
            {segment.id !== "hours" && (
              <span className="text-muted-foreground/60 mx-0.5">:</span>
            )}
            <span>{segment.value}</span>
          </span>
        ))}
      </p>
    </div>
  );
};
export default CurrentDuration;
