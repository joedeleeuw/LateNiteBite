import { Link, useLocalSearchParams } from "expo-router";
import { Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  buildNavigateUrl,
  formatAmenity,
  formatCuisine,
  formatDetailState,
  formatDistance,
  openStateTextClass,
  parseRankedSpotParam,
  routeIdForSpotId,
} from "@/rightNow";
import { Pressable, Text, View } from "@/tw";

type SpotParams = {
  id?: string;
  ranked?: string;
};

function openUrl(url: string) {
  void Linking.openURL(url);
}

function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function BackLink() {
  return (
    <Link href="/" asChild>
      <Pressable className="self-start border-b border-lnb-border py-2">
        <Text className="text-sm text-lnb-muted">back</Text>
      </Pressable>
    </Link>
  );
}

export default function SpotDetail() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SpotParams>();
  const routeId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const rankedParam = params.ranked;
  const parsed = parseRankedSpotParam(
    typeof rankedParam === "string"
      ? rankedParam
      : Array.isArray(rankedParam)
        ? rankedParam[0]
        : undefined,
  );
  const ranked =
    parsed && routeId && routeIdForSpotId(parsed.spot.id) === routeId
      ? parsed
      : null;

  if (!ranked) {
    return (
      <View
        className="flex-1 gap-5 bg-lnb-bg px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <BackLink />
        <View className="gap-2">
          <Text className="text-2xl font-semibold text-lnb-text">
            spot slipped away
          </Text>
          <Text className="text-sm text-lnb-muted">
            head back to right now and tap it again.
          </Text>
        </View>
      </View>
    );
  }

  const spot = ranked.spot;
  const navigateUrl = buildNavigateUrl(spot, Platform.OS);

  return (
    <View
      className="flex-1 bg-lnb-bg px-5"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <BackLink />
      <View className="flex-1 gap-8 pt-8">
        <View className="gap-3">
          <Text className="text-3xl font-semibold leading-9 text-lnb-text">
            {spot.name.toLowerCase()}
          </Text>
          <Text
            className={`text-base font-medium ${openStateTextClass(ranked.state)}`}
          >
            {formatDetailState(ranked.state)}
          </Text>
          <Text className="text-sm tabular-nums text-lnb-text-2">
            {formatDistance(ranked.distanceMi)} · {formatAmenity(spot)}
          </Text>
        </View>
        <View className="gap-5">
          <View className="gap-1 border-b border-lnb-border pb-4">
            <Text className="text-xs text-lnb-muted">cuisine</Text>
            <Text className="text-base text-lnb-text">{formatCuisine(spot)}</Text>
          </View>
          <View className="gap-1 border-b border-lnb-border pb-4">
            <Text className="text-xs text-lnb-muted">phone</Text>
            {spot.phone ? (
              <Pressable onPress={() => openUrl(`tel:${spot.phone}`)}>
                <Text className="text-base text-lnb-glow">{spot.phone}</Text>
              </Pressable>
            ) : (
              <Text className="text-base text-lnb-muted">unknown</Text>
            )}
          </View>
          <View className="gap-1 border-b border-lnb-border pb-4">
            <Text className="text-xs text-lnb-muted">website</Text>
            {spot.website ? (
              <Pressable
                onPress={() => {
                  const website = spot.website;
                  if (website) {
                    openUrl(withProtocol(website));
                  }
                }}
              >
                <Text className="text-base text-lnb-glow">{spot.website}</Text>
              </Pressable>
            ) : (
              <Text className="text-base text-lnb-muted">unknown</Text>
            )}
          </View>
        </View>
      </View>
      <Pressable
        className="items-center bg-lnb-glow px-5 py-4"
        onPress={() => openUrl(navigateUrl)}
      >
        <Text className="text-base font-semibold text-lnb-bg">navigate</Text>
      </Pressable>
    </View>
  );
}
