import { useCallback, useEffect, useRef, useState } from "react";
const DEFAULT_INTERVAL_MS = 250;
const getRemainingSecondsFromExpiry = (expiryTimestamp: Date) => {
  const remainingMs = expiryTimestamp.getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
};
const getRemainingSecondsFromEndTime = (endTimeMs: number) => {
  const remainingMs = endTimeMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
};
export type CountdownTimer = {
  isRunning: boolean;
  totalSeconds: number;
  start: () => void;
  pause: () => void;
  restart: (expiryTimestamp: Date, autoStart?: boolean) => void;
};
export const useCountdownTimer = ({
  expiryTimestamp,
  autoStart = true,
  onExpire,
  interval = DEFAULT_INTERVAL_MS,
}: {
  expiryTimestamp: Date;
  autoStart?: boolean;
  onExpire?: () => void;
  interval?: number;
}): CountdownTimer => {
  const initialSeconds = getRemainingSecondsFromExpiry(expiryTimestamp);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart && initialSeconds > 0);
  const onExpireRef = useRef(onExpire);
  const remainingSecondsRef = useRef(initialSeconds);
  const endTimeMsRef = useRef<number | undefined>(
    autoStart && initialSeconds > 0
      ? Date.now() + initialSeconds * 1000
      : undefined,
  );
  const setRemainingSeconds = useCallback((nextSeconds: number) => {
    remainingSecondsRef.current = nextSeconds;
    setTotalSeconds(nextSeconds);
  }, []);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    if (!isRunning || endTimeMsRef.current === undefined) {
      return;
    }
    const tick = () => {
      const endTimeMs = endTimeMsRef.current;
      if (endTimeMs === undefined) {
        return;
      }
      const nextSeconds = getRemainingSecondsFromEndTime(endTimeMs);
      setRemainingSeconds(nextSeconds);
      if (nextSeconds <= 0) {
        endTimeMsRef.current = null;
        setIsRunning(false);
        onExpireRef.current?.();
      }
    };
    tick();
    const intervalId = globalThis.setInterval(tick, interval);
    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [interval, isRunning, setRemainingSeconds]);
  const start = useCallback(() => {
    const nextSeconds = remainingSecondsRef.current;
    if (nextSeconds <= 0) {
      endTimeMsRef.current = null;
      setIsRunning(false);
      return;
    }
    endTimeMsRef.current = Date.now() + nextSeconds * 1000;
    setIsRunning(true);
  }, []);
  const pause = useCallback(() => {
    const endTimeMs = endTimeMsRef.current;
    if (endTimeMs !== undefined) {
      setRemainingSeconds(getRemainingSecondsFromEndTime(endTimeMs));
    }
    endTimeMsRef.current = null;
    setIsRunning(false);
  }, [setRemainingSeconds]);
  const restart = useCallback(
    (nextExpiryTimestamp: Date, nextAutoStart = true) => {
      const nextSeconds = getRemainingSecondsFromExpiry(nextExpiryTimestamp);
      setRemainingSeconds(nextSeconds);
      if (nextAutoStart && nextSeconds > 0) {
        endTimeMsRef.current = Date.now() + nextSeconds * 1000;
        setIsRunning(true);
        return;
      }
      endTimeMsRef.current = null;
      setIsRunning(false);
    },
    [setRemainingSeconds],
  );
  return {
    isRunning,
    totalSeconds,
    start,
    pause,
    restart,
  };
};
