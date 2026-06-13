import { useCallback } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  VignetteBulb,
  VignetteFixture,
  VignetteGlow,
  VignetteMouse,
  VignetteTail,
} from "@/splash/Vignette";
import { useReanimatedLoop } from "@/splash/useReanimatedLoop";
import { Pressable, Text } from "@/tw";

const PUNCH = Easing.bezier(0.16, 1, 0.3, 1);
const BREATHE = Easing.bezier(0.4, 0, 0.2, 1);

const VIEW_H = 300;
const HANG_UNITS = 16;
const ROCK_FROM = -8;
const SOCKET_PIVOT_UNITS = 66 - 150;
const MOUSE_PIVOT_X_UNITS = 110 - 100;
const MOUSE_PIVOT_Y_UNITS = 28 - 150;
const LOOP_MS = 6500;

export function ScrewInStudy() {
  const { height } = useWindowDimensions();
  const sceneHeight = Math.min(640, height * 0.78);
  const sceneWidth = (sceneHeight / VIEW_H) * 200;
  const unit = sceneHeight / VIEW_H;

  const hang = useSharedValue(HANG_UNITS * unit);
  const rock = useSharedValue(ROCK_FROM);
  const settle = useSharedValue(1);
  const glow = useSharedValue(0);
  const breath = useSharedValue(1);

  const run = useCallback(() => {
    const hangFrom = HANG_UNITS * unit;
    hang.set(hangFrom);
    rock.set(ROCK_FROM);
    settle.set(1);
    glow.set(0);
    breath.set(1);

    hang.set(
      withSequence(
        withTiming(hangFrom + 3 * unit, { duration: 90, easing: BREATHE }),
        withTiming(0, { duration: 900, easing: BREATHE }),
      ),
    );
    rock.set(
      withDelay(
        90,
        withSequence(
          withTiming(5, { duration: 340, easing: BREATHE }),
          withTiming(-3, { duration: 280, easing: BREATHE }),
          withTiming(0, { duration: 280, easing: BREATHE }),
        ),
      ),
    );
    settle.set(
      withDelay(
        990,
        withSequence(
          withTiming(1.03, { duration: 140, easing: PUNCH }),
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
          withRepeat(
            withSequence(
              withTiming(0.96, { duration: 900, easing: BREATHE }),
              withTiming(1, { duration: 1100, easing: BREATHE }),
            ),
            -1,
            true,
          ),
        ),
      ),
    );
    breath.set(
      withDelay(
        1500,
        withRepeat(
          withSequence(
            withTiming(1.015, { duration: 1300, easing: BREATHE }),
            withTiming(1, { duration: 1500, easing: BREATHE }),
          ),
          -1,
          true,
        ),
      ),
    );
  }, [breath, glow, hang, rock, settle, unit]);

  useReanimatedLoop(run, LOOP_MS);

  const bulbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hang.get() },
      { translateY: SOCKET_PIVOT_UNITS * unit },
      { rotate: `${rock.get()}deg` },
      { scale: settle.get() },
      { translateY: -SOCKET_PIVOT_UNITS * unit },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.get(),
  }));

  const mouseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: MOUSE_PIVOT_X_UNITS * unit },
      { translateY: MOUSE_PIVOT_Y_UNITS * unit },
      { scale: breath.get() },
      { translateX: -MOUSE_PIVOT_X_UNITS * unit },
      { translateY: -MOUSE_PIVOT_Y_UNITS * unit },
    ],
  }));

  return (
    <Pressable
      onPress={run}
      className="flex-1 items-center justify-center bg-[#0A101C]"
    >
      <View style={{ width: sceneWidth, height: sceneHeight }}>
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <VignetteGlow width={sceneWidth} height={sceneHeight} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, bulbStyle]}>
          <VignetteBulb width={sceneWidth} height={sceneHeight} />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <VignetteFixture width={sceneWidth} height={sceneHeight} />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, mouseStyle]}>
          <VignetteMouse width={sceneWidth} height={sceneHeight} />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <VignetteTail width={sceneWidth} height={sceneHeight} />
        </View>
      </View>
      <Text className="mt-6 text-xs text-lnb-muted">
        loops on its own — tap to replay now
      </Text>
    </Pressable>
  );
}
