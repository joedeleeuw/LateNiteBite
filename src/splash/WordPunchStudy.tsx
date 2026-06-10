import { useCallback, useEffect } from "react";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Pressable, Text, View } from "@/tw";

const PUNCH = Easing.bezier(0.16, 1, 0.3, 1);
const BREATHE = Easing.bezier(0.4, 0, 0.2, 1);

const WORD_DELAYS = [0, 1120, 2520];
const EST_DELAY = 3420;
const LOOP_MS = 6200;

function punchIn(delay: number) {
  return withDelay(
    delay,
    withSequence(
      withTiming(1.12, { duration: 140, easing: PUNCH }),
      withTiming(1, { duration: 420, easing: BREATHE }),
    ),
  );
}

function usePunchStyle(p: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 0.05, 1.12], [0, 1, 1]),
    transform: [
      { translateX: interpolate(p.get(), [0, 1, 1.12], [-28, 0, 2]) },
      { scale: interpolate(p.get(), [0, 1, 1.12], [0.92, 1, 1.04]) },
    ],
  }));
}

export function WordPunchStudy() {
  const late = useSharedValue(0);
  const nite = useSharedValue(0);
  const bite = useSharedValue(0);
  const est = useSharedValue(0);

  const run = useCallback(() => {
    late.set(0);
    nite.set(0);
    bite.set(0);
    est.set(0);

    late.set(punchIn(WORD_DELAYS[0]));
    nite.set(punchIn(WORD_DELAYS[1]));
    bite.set(punchIn(WORD_DELAYS[2]));
    est.set(
      withDelay(EST_DELAY, withTiming(1, { duration: 600, easing: BREATHE })),
    );
  }, [bite, est, late, nite]);

  useEffect(() => {
    run();
    const loop = setInterval(run, LOOP_MS);
    return () => clearInterval(loop);
  }, [run]);

  const lateStyle = usePunchStyle(late);
  const niteStyle = usePunchStyle(nite);
  const biteStyle = usePunchStyle(bite);

  const estStyle = useAnimatedStyle(() => ({
    opacity: est.get(),
  }));

  return (
    <Pressable
      onPress={run}
      className="flex-1 items-center justify-center bg-[#0A101C]"
    >
      <View className="items-center">
        <Animated.View style={lateStyle}>
          <Text className="text-7xl font-bold leading-tight tracking-tighter text-[#F2E9DA]">
            late
          </Text>
        </Animated.View>
        <Animated.View style={niteStyle}>
          <Text className="text-7xl font-bold leading-tight tracking-tighter text-lnb-glow">
            nite
          </Text>
        </Animated.View>
        <Animated.View style={biteStyle}>
          <Text className="text-7xl font-bold leading-tight tracking-tighter text-[#F2E9DA]">
            bite
          </Text>
        </Animated.View>
        <Animated.View style={estStyle}>
          <Text className="mt-4 text-sm text-lnb-muted">est. 2015</Text>
        </Animated.View>
      </View>
      <Text className="mt-10 text-xs text-lnb-muted">
        loops on its own — tap to replay now
      </Text>
    </Pressable>
  );
}
