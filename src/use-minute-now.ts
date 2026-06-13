import { useEffect, useState } from "react";
import { floorToMinute, millisecondsUntilNextMinute } from "./minute-clock";

export function useMinuteNow(): Date {
  const [now, setNow] = useState(() => floorToMinute());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const tick = () => setNow(floorToMinute());
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, millisecondsUntilNextMinute());

    return () => {
      clearTimeout(timeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return now;
}
