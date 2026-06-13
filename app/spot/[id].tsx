import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ensureHttpProtocol, openExternalUrl } from "@/action-links";
import { fetchSpots } from "@/core/overpass";
import { rankSpots } from "@/core/rank";
import {
  buildNavigateUrl,
  bboxForCoordinates,
  coordinatesFromParams,
  formatAmenity,
  formatCuisine,
  formatDetailState,
  formatDistance,
  spotIdForRouteId,
  spotQueryKey,
} from "@/rightNow";
import { Pressable, Text, View } from "@/tw";
import { useMinuteNow } from "@/use-minute-now";

type SpotParams = {
  id?: string;
  lat?: string;
  lon?: string;
};

export default function SpotDetail() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SpotParams>();
  const now = useMinuteNow();
  const [actionError, setActionError] = useState<string | null>(null);
  const coordinates = coordinatesFromParams(params);
  const spotId = spotIdForRouteId(params.id);
  const spotsQuery = useQuery({
    queryKey: coordinates ? [...spotQueryKey(coordinates), spotId] : ["spots", "detail"],
    queryFn: () => {
      if (!coordinates || !spotId) {
        throw new Error("Spot detail requires coordinates and a spot id");
      }
      return fetchSpots(bboxForCoordinates(coordinates));
    },
    enabled: coordinates != null && spotId != null,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
  const ranked = useMemo(
    () =>
      coordinates && spotsQuery.data
        ? rankSpots(spotsQuery.data, coordinates, now).find(
            (item) => item.spot.id === spotId,
          )
        : null,
    [coordinates, now, spotId, spotsQuery.data],
  );

  if (!coordinates || !spotId) {
    return (
      <View
        className="flex-1 gap-5 bg-lnb-bg px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        testID="lnb_spot_missing"
      >
        <Link href="/" asChild>
          <Pressable
            className="self-start border-b border-lnb-border py-2"
            testID="lnb_back_button"
          >
            <Text className="text-sm text-lnb-muted">back</Text>
          </Pressable>
        </Link>
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

  if (spotsQuery.isPending) {
    return (
      <View
        className="flex-1 gap-5 bg-lnb-bg px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        testID="lnb_spot_detail_loading"
      >
        <Link href="/" asChild>
          <Pressable
            className="self-start border-b border-lnb-border py-2"
            testID="lnb_back_button"
          >
            <Text className="text-sm text-lnb-muted">back</Text>
          </Pressable>
        </Link>
        <Text className="text-sm text-lnb-muted">pulling spot details...</Text>
      </View>
    );
  }

  if (spotsQuery.isError) {
    return (
      <View
        className="flex-1 gap-5 bg-lnb-bg px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        testID="lnb_spot_detail_error"
      >
        <Link href="/" asChild>
          <Pressable
            className="self-start border-b border-lnb-border py-2"
            testID="lnb_back_button"
          >
            <Text className="text-sm text-lnb-muted">back</Text>
          </Pressable>
        </Link>
        <View className="gap-3">
          <Text className="text-2xl font-semibold text-lnb-text" selectable>
            place lookup failed
          </Text>
          <Text className="text-sm text-lnb-muted" selectable>
            could not load details for this place.
          </Text>
          <Pressable
            className="self-start border-b border-lnb-glow py-2"
            testID="lnb_retry_spot_detail_button"
            onPress={() => {
              void spotsQuery.refetch();
            }}
          >
            <Text className="text-sm font-semibold text-lnb-glow">
              try again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!ranked) {
    return (
      <View
        className="flex-1 gap-5 bg-lnb-bg px-5"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
        testID="lnb_spot_missing"
      >
        <Link href="/" asChild>
          <Pressable
            className="self-start border-b border-lnb-border py-2"
            testID="lnb_back_button"
          >
            <Text className="text-sm text-lnb-muted">back</Text>
          </Pressable>
        </Link>
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
      testID="lnb_spot_detail"
    >
      <Link href="/" asChild>
        <Pressable
          className="self-start border-b border-lnb-border py-2"
          testID="lnb_back_button"
        >
          <Text className="text-sm text-lnb-muted">back</Text>
        </Pressable>
      </Link>
      <View className="flex-1 gap-8 pt-8">
        <View className="gap-3">
          <Text className="text-3xl font-semibold leading-9 text-lnb-text">
            {spot.name.toLowerCase()}
          </Text>
          <Text
            className={`text-base font-medium ${
              ranked.state.status === "open" ? "text-lnb-open" : "text-lnb-muted"
            }`}
            testID="lnb_spot_detail_state"
          >
            {formatDetailState(ranked.state)}
          </Text>
          <Text className="text-sm tabular-nums text-lnb-text-2">
            {formatDistance(ranked.distanceMi)} · {formatAmenity(spot)}
          </Text>
          {actionError ? (
            <Text className="text-sm text-lnb-muted" selectable>
              {actionError}
            </Text>
          ) : null}
        </View>
        <View className="gap-5">
          <View className="gap-1 border-b border-lnb-border pb-4">
            <Text className="text-xs text-lnb-muted">cuisine</Text>
            <Text className="text-base text-lnb-text">{formatCuisine(spot)}</Text>
          </View>
          <View className="gap-1 border-b border-lnb-border pb-4">
            <Text className="text-xs text-lnb-muted">phone</Text>
            {spot.phone ? (
              <Pressable
                onPress={() => {
                  setActionError(null);
                  void openExternalUrl(`tel:${spot.phone}`, Linking.openURL).catch(
                    (error) => {
                      console.error("Failed to open phone URL:", error);
                      setActionError("could not open phone.");
                    },
                  );
                }}
              >
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
                  setActionError(null);
                  void openExternalUrl(
                    ensureHttpProtocol(spot.website ?? ""),
                    Linking.openURL,
                  ).catch((error) => {
                    console.error("Failed to open website URL:", error);
                    setActionError("could not open website.");
                  });
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
        testID="lnb_navigate_button"
        onPress={() => {
          setActionError(null);
          void openExternalUrl(navigateUrl, Linking.openURL).catch((error) => {
            console.error("Failed to open navigation URL:", error);
            setActionError("could not open maps.");
          });
        }}
      >
        <Text className="text-base font-semibold text-lnb-bg">navigate</Text>
      </Pressable>
    </View>
  );
}
