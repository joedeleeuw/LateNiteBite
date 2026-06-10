import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BulbBody, BulbGlow, MouseLayer, SheenLayer } from "@/splash/BulbMark";
import { Pressable, Text } from "@/tw";

const PUNCH = Easing.bezier(0.16, 1, 0.3, 1);
const BREATHE = Easing.bezier(0.4, 0, 0.2, 1);

const DROP_FROM = -26;
const ROCK_FROM = -12;
const THREAD_PIVOT = 30;

export function ScrewInStudy() {
  const drop = useSharedValue(DROP_FROM);
  const rock = useSharedValue(ROCK_FROM);
  const mouseRock = useSharedValue(ROCK_FROM);
  const settle = useSharedValue(1);
  const glow = useSharedValue(0);

  const run = useCallback(() => {
    drop.set(DROP_FROM);
    rock.set(ROCK_FROM);
    mouseRock.set(ROCK_FROM);
    settle.set(1);
    glow.set(0);

    drop.set(
      withSequence(
        withTiming(-32, { duration: 90, easing: BREATHE }),
        withTiming(0, { duration: 900, easing: BREATHE }),
      ),
    );
    rock.set(
      withDelay(
        90,
        withSequence(
          withTiming(8, { duration: 360, easing: BREATHE }),
          withTiming(-4, { duration: 280, easing: BREATHE }),
          withTiming(0, { duration: 260, easing: BREATHE }),
        ),
      ),
    );
    mouseRock.set(
      withDelay(
        140,
        withSequence(
          withTiming(6.5, { duration: 360, easing: BREATHE }),
          withTiming(-3.2, { duration: 280, easing: BREATHE }),
          withTiming(0, { duration: 290, easing: BREATHE }),
        ),
      ),
    );
    settle.set(
      withDelay(
        990,
        withSequence(
          withTiming(1.04, { duration: 140, easing: PUNCH }),
          withTiming(1, { duration: 420, easing: BREATHE }),
        ),
      ),
    );
    glow.set(
      withDelay(
        1130,
        withSequence(
          withTiming(0.7, { duration: 60 }),
          withTiming(0.25, { duration: 70 }),
          withTiming(1, { duration: 280, easing: BREATHE }),
        ),
      ),
    );
  }, [drop, glow, mouseRock, rock, settle]);

  useEffect(() => {
    run();
  }, [run]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: drop.get() },
      { translateY: THREAD_PIVOT },
      { rotate: `${rock.get()}deg` },
      { scale: settle.get() },
      { translateY: -THREAD_PIVOT },
    ],
  }));

  const mouseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: drop.get() },
      { translateY: THREAD_PIVOT },
      { rotate: `${mouseRock.get()}deg` },
      { scale: settle.get() },
      { translateY: -THREAD_PIVOT },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.get(),
  }));

  return (
    <Pressable
      onPress={run}
      className="flex-1 items-center justify-center bg-[#0A101C]"
    >
      <View style={{ width: 200, height: 300 }}>
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <BulbGlow />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
          <BulbBody />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <SheenLayer />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, mouseStyle]}>
          <MouseLayer />
        </Animated.View>
      </View>
      <Text className="mt-10 text-xs text-lnb-muted">tap to replay</Text>
    </Pressable>
  );
}
