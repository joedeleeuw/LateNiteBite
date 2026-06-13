import { useEffect } from "react";
import {
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export function useReanimatedLoop(run: () => void, loopMs: number): void {
  const tick = useSharedValue(0);

  useEffect(() => {
    run();
    tick.set(
      withRepeat(
        withDelay(
          loopMs,
          withTiming(1, { duration: 0 }, (finished) => {
            if (finished) {
              scheduleOnRN(run);
            }
          }),
        ),
        -1,
      ),
    );
  }, [loopMs, run, tick]);
}
