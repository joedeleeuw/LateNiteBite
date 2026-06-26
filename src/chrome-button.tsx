import { GlassView } from "expo-glass-effect";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text } from "@/tw";

type PressableProps = ComponentProps<typeof Pressable>;

export function ChromeButton({
  children,
  onPress,
  testID,
  tone = "primary",
}: {
  children: ReactNode;
  onPress: PressableProps["onPress"];
  testID?: string;
  tone?: "primary" | "secondary";
}) {
  const isPrimary = tone === "primary";
  const content = (
    <Pressable
      className={`min-h-11 items-center justify-center rounded-full px-4 py-2 ${
        isPrimary ? "bg-[#FFB84D]" : "bg-[#F2E9DA]/10"
      }`}
      testID={testID}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-semibold ${
          isPrimary ? "text-[#0A101C]" : "text-[#FFB84D]"
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );

  return (
    <GlassView
      isInteractive
      colorScheme="dark"
      glassEffectStyle={isPrimary ? "regular" : "clear"}
      style={{ borderRadius: 999, overflow: "hidden" }}
      tintColor={isPrimary ? "#FFB84D" : "#F2E9DA"}
    >
      {content}
    </GlassView>
  );
}
