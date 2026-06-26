import type { ComponentProps } from "react";
import { ActivityIndicator } from "react-native";
import { ChromeButton } from "@/chrome-button";
import { NightBulbScene } from "@/night-bulb-scene";
import { spotPhotoAttributionText, type SpotPhoto } from "@/spot-photos";
import { Image, Pressable, Text, View } from "@/tw";

function Attribution({
  compact = false,
  photo,
}: {
  compact?: boolean;
  photo: SpotPhoto;
}) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
      <Text className="text-[10px] font-semibold text-white" numberOfLines={1}>
        {compact ? photo.attribution.label : spotPhotoAttributionText(photo)}
      </Text>
    </View>
  );
}

export function SpotPhotoThumb({
  loading,
  photo,
}: {
  loading: boolean;
  photo: SpotPhoto | null;
}) {
  return (
    <View className="h-20 w-20 overflow-hidden rounded-[20px] border border-[#F2E9DA]/15 bg-[#0A101C]">
      {photo ? (
        <>
          <Image
            accessibilityLabel={spotPhotoAttributionText(photo)}
            className="h-full w-full"
            contentFit="cover"
            source={{ uri: photo.uri }}
            transition={160}
          />
          <Attribution compact photo={photo} />
        </>
      ) : loading ? (
        <View className="h-full w-full items-center justify-center">
          <ActivityIndicator color="#FFB84D" />
        </View>
      ) : (
        <NightBulbScene compact />
      )}
    </View>
  );
}

export function SpotPhotoHero({
  error,
  loading,
  onRetry,
  photo,
}: {
  error: boolean;
  loading: boolean;
  onRetry: ComponentProps<typeof Pressable>["onPress"];
  photo: SpotPhoto | null;
}) {
  if (photo) {
    return (
      <View
        className="w-full overflow-hidden rounded-3xl bg-lnb-surface-2"
        style={{ aspectRatio: 1 }}
      >
        <Image
          accessibilityLabel={spotPhotoAttributionText(photo)}
          className="h-full w-full"
          contentFit="cover"
          source={{ uri: photo.uri }}
          transition={180}
        />
        <Attribution photo={photo} />
      </View>
    );
  }

  if (loading) {
    return (
      <View
        className="w-full items-center justify-center rounded-3xl bg-[#0A101C]"
        style={{ aspectRatio: 1 }}
      >
        <ActivityIndicator color="#FFB84D" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="w-full overflow-hidden rounded-3xl bg-[#0A101C]"
        style={{ aspectRatio: 1 }}
      >
        <NightBulbScene />
        <View className="absolute bottom-5 left-5 right-5 gap-3 rounded-[20px] bg-[#07101D]/82 px-4 py-3">
          <Text className="text-base font-semibold text-[#ECF0F7]" selectable>
            photo lookup failed
          </Text>
          <View className="self-start">
            <ChromeButton onPress={onRetry}>try again</ChromeButton>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className="w-full overflow-hidden rounded-3xl bg-[#0A101C]"
      style={{ aspectRatio: 1 }}
    >
      <NightBulbScene />
      <View className="absolute bottom-5 left-5 right-5 rounded-[20px] bg-[#07101D]/82 px-4 py-3">
        <Text className="text-sm font-semibold text-[#B2BED0]" selectable>
          photo unavailable
        </Text>
      </View>
    </View>
  );
}
