import { Image as ExpoImage } from "expo-image";
import { Link as RouterLink } from "expo-router";
import React from "react";
import {
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  Text as RNText,
  View as RNView,
} from "react-native";
import { useCSSVariable, withUniwind } from "uniwind";

export { useCSSVariable };

export const View = withUniwind(RNView) as React.ComponentType<
  React.ComponentPropsWithRef<typeof RNView> & { className?: string }
>;
View.displayName = "CSS(View)";

export const Text = withUniwind(RNText) as React.ComponentType<
  React.ComponentPropsWithRef<typeof RNText> & { className?: string }
>;
Text.displayName = "CSS(Text)";

export const ScrollView = withUniwind(RNScrollView) as React.ComponentType<
  React.ComponentPropsWithRef<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
>;
ScrollView.displayName = "CSS(ScrollView)";

export const Pressable = withUniwind(RNPressable) as React.ComponentType<
  React.ComponentPropsWithRef<typeof RNPressable> & { className?: string }
>;
Pressable.displayName = "CSS(Pressable)";

export const Image = withUniwind(ExpoImage) as React.ComponentType<
  React.ComponentPropsWithRef<typeof ExpoImage> & { className?: string }
>;
Image.displayName = "CSS(Image)";

export const Link = withUniwind(RouterLink) as React.ComponentType<
  React.ComponentProps<typeof RouterLink> & { className?: string }
>;
Link.displayName = "CSS(Link)";
