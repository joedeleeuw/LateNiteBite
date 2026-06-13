import { useCallback, useState } from "react";
import { StyleSheet, View as RNView, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Text, View } from "@/tw";

const PUNCH = Easing.bezier(0.16, 1, 0.3, 1);
const BREATHE = Easing.bezier(0.4, 0, 0.2, 1);
const EXIT = Easing.bezier(0.3, 0, 1, 1);

const CARD_W = 280;
const CARD_H = 400;
const SURFACE = "#111A2C";
const AMBER = "#FFB84D";
const CREAM = "#F2E9DA";

type GlyphName = "pizza" | "pint" | "mug";

type StudySpot = {
  name: string;
  state: string;
  meta: string;
  glyph: GlyphName;
};

const SPOTS: StudySpot[] = [
  { name: "joe's pizza", state: "open · closes in 94m", meta: "0.2 mi · fast food", glyph: "pizza" },
  { name: "the half pint", state: "open · closes in 37m", meta: "0.1 mi · pub", glyph: "pint" },
  { name: "chihiro tea", state: "open · closes in 155m", meta: "0.1 mi · cafe", glyph: "mug" },
];

function Glyph({ name, size = 96 }: { name: GlyphName; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {name === "pizza" && (
        <>
          <Path
            d="M22 30 Q50 18 78 30 L55 78 Q50 86 45 78 Z"
            stroke={AMBER}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M28 40 Q50 31 72 40" stroke={AMBER} strokeWidth="6" opacity="0.5" strokeLinecap="round" />
          <Circle cx="44" cy="52" r="4.5" fill={AMBER} />
          <Circle cx="58" cy="60" r="4.5" fill={AMBER} />
        </>
      )}
      {name === "pint" && (
        <>
          <Path
            d="M36 24 L31 76 Q30.5 82 37 82 L63 82 Q69.5 82 69 76 L64 24 Z"
            stroke={AMBER}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M35 36 Q50 42 65 36" stroke={AMBER} strokeWidth="6" opacity="0.5" strokeLinecap="round" />
        </>
      )}
      {name === "mug" && (
        <>
          <Path
            d="M30 42 L62 42 L62 70 Q62 80 52 80 L40 80 Q30 80 30 70 Z"
            stroke={AMBER}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M62 48 Q76 48 76 58 Q76 68 62 68" stroke={AMBER} strokeWidth="7" strokeLinecap="round" />
          <Path d="M40 32 Q37 26 42 20" stroke={AMBER} strokeWidth="5" opacity="0.6" strokeLinecap="round" />
          <Path d="M52 32 Q49 26 54 20" stroke={AMBER} strokeWidth="5" opacity="0.6" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

function Gloss() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="cardGloss" x1="0" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor={CREAM} stopOpacity="0.09" />
          <Stop offset="0.4" stopColor={CREAM} stopOpacity="0.025" />
          <Stop offset="1" stopColor={CREAM} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#cardGloss)" />
    </Svg>
  );
}

function BackCard({ depth, spot }: { depth: 1 | 2; spot: StudySpot }) {
  const scale = depth === 1 ? 0.94 : 0.88;
  const lift = depth === 1 ? -18 : -34;
  const fade = depth === 1 ? 0.5 : 0.25;
  return (
    <RNView
      style={{
        position: "absolute",
        width: CARD_W,
        height: CARD_H,
        borderRadius: 28,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: "rgba(242,233,218,0.08)",
        opacity: fade,
        transform: [{ translateY: lift }, { scale }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Glyph name={spot.glyph} size={64} />
    </RNView>
  );
}

export function CardStackStudy() {
  const { width, height } = useWindowDimensions();
  const [order, setOrder] = useState([0, 1, 2]);
  const swipeX = useSharedValue(0);
  const openP = useSharedValue(0);

  const advance = useCallback(() => {
    setOrder((prev) => [...prev.slice(1), prev[0]]);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (openP.get() > 0.05) {
        return;
      }
      swipeX.set(e.translationX);
    })
    .onEnd((e) => {
      if (openP.get() > 0.05) {
        swipeX.set(withTiming(0, { duration: 280, easing: BREATHE }));
        return;
      }

      if (Math.abs(e.translationX) > 110) {
        swipeX.set(
          withTiming(
            Math.sign(e.translationX) * 560,
            { duration: 220, easing: EXIT },
            (finished) => {
              if (finished) {
                scheduleOnRN(advance);
                swipeX.set(0);
              }
            },
          ),
        );
      } else {
        swipeX.set(withTiming(0, { duration: 280, easing: BREATHE }));
      }
    });

  const toggleOpen = () => {
    scheduleOnUI(() => {
      "worklet";
      if (openP.get() > 0.5) {
        openP.set(withTiming(0, { duration: 380, easing: BREATHE }));
      } else {
        openP.set(withTiming(1, { duration: 420, easing: PUNCH }));
      }
    });
  };

  const tap = Gesture.Tap()
    .maxDistance(12)
    .onEnd((_e, success) => {
      if (success) {
        scheduleOnRN(toggleOpen);
      }
    });

  const cardGesture = Gesture.Race(pan, tap);

  const coverScale = Math.max(width / CARD_W, height / CARD_H) * 1.04;

  const frontStyle = useAnimatedStyle(() => {
    const p = openP.get();
    return {
      opacity: interpolate(p, [0, 0.55], [1, 0]),
      transform: [
        { translateX: swipeX.get() * (1 - p) },
        { rotate: `${(swipeX.get() / 24) * (1 - p)}deg` },
        { scale: interpolate(p, [0, 1], [1, coverScale]) },
      ],
    };
  });

  const detailFade = useAnimatedStyle(() => ({
    opacity: interpolate(openP.get(), [0.3, 1], [0, 1]),
    transform: [{ translateY: interpolate(openP.get(), [0.3, 1], [26, 0]) }],
  }));

  const detailEvents = useAnimatedStyle(() => ({
    pointerEvents: openP.get() > 0.5 ? ("auto" as const) : ("none" as const),
  }));

  const front = SPOTS[order[0]];
  const mid = SPOTS[order[1]];
  const back = SPOTS[order[2]];

  return (
    <GestureDetector gesture={cardGesture}>
      <View className="flex-1 items-center justify-center bg-[#0A101C]">
        <BackCard depth={2} spot={back} />
        <BackCard depth={1} spot={mid} />
        <Animated.View
          style={[
            {
              width: CARD_W,
              height: CARD_H,
              borderRadius: 28,
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: "rgba(242,233,218,0.16)",
              overflow: "hidden",
            },
            frontStyle,
          ]}
        >
          <Gloss />
          <RNView style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
            <Glyph name={front.glyph} />
            <Text className="text-3xl font-bold tracking-tighter text-[#ECF0F7]">
              {front.name}
            </Text>
            <Text className="text-base text-lnb-open">{front.state}</Text>
            <Text className="text-sm text-lnb-muted">{front.meta}</Text>
          </RNView>
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: SURFACE }, detailFade, detailEvents]}
        >
          <Gloss />
          <RNView style={{ flex: 1, paddingTop: 90, alignItems: "center", gap: 14 }}>
            <Glyph name={front.glyph} size={72} />
            <Text className="text-4xl font-bold tracking-tighter text-[#ECF0F7]">
              {front.name}
            </Text>
            <Text className="text-lg text-lnb-open">{front.state}</Text>
            <Text className="text-sm text-lnb-muted">{front.meta}</Text>
            <RNView
              style={{
                marginTop: 26,
                flexDirection: "row",
                gap: 26,
                backgroundColor: "rgba(17,26,44,0.9)",
                borderColor: "rgba(242,233,218,0.16)",
                borderWidth: 1,
                borderRadius: 28,
                paddingHorizontal: 30,
                paddingVertical: 14,
              }}
            >
              <Text className="text-base font-semibold text-[#FFB84D]">navigate</Text>
              <Text className="text-base text-lnb-muted">call</Text>
              <Text className="text-base text-lnb-muted">share</Text>
            </RNView>
            <Text className="mt-8 text-xs text-lnb-muted">tap anywhere to close</Text>
          </RNView>
        </Animated.View>
      <RNView style={{ position: "absolute", bottom: 110, flexDirection: "row", gap: 10 }}>
        {order.map((idx, i) => (
          <RNView
            key={SPOTS[idx].name}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: CREAM,
              opacity: i === 0 ? 0.85 : 0.25,
            }}
          />
        ))}
      </RNView>
      <Text className="absolute bottom-16 text-xs text-lnb-muted">
        tap card to open · swipe to flick through
      </Text>
      </View>
    </GestureDetector>
  );
}
