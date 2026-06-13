import { LegendList, type LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSpots } from "@/core/overpass";
import { rankSpots, type RankedSpot } from "@/core/rank";
import {
  bboxForCoordinates,
  formatAmenity,
  formatDistance,
  formatHeadline,
  nextOpeningLabel,
  requestLocationPermission,
  routeIdForSpotId,
  roundedCoordinates,
  spotQueryKey,
} from "@/rightNow";
import { BulbMark } from "@/splash/BulbMark";
import { Pressable, Text, View } from "@/tw";
import { useMinuteNow } from "@/use-minute-now";

type LocationChoice = {
  label: string;
  coordinates: { lat: number; lon: number };
};

type PermissionState = "asking" | "locating" | "denied" | "error" | "ready";

type SpotRowItem = {
  ranked: RankedSpot;
  routeId: string;
  coordinates: LocationChoice["coordinates"];
};

function headlineClassName(state: RankedSpot["state"]): string {
  if (state.status === "open") {
    return "text-lnb-open";
  }

  if (state.status === "closed") {
    return "text-lnb-muted";
  }

  return "text-lnb-muted";
}

function Header({ label }: { label: string | null }) {
  return (
    <View className="gap-5 px-5 pb-4" testID="lnb_home_header">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-row items-center gap-3">
          <BulbMark width={42} height={63} />
          <View>
            <Text className="text-xl font-bold leading-5 text-lnb-text">
              late
            </Text>
            <Text className="text-xl font-bold leading-5 text-lnb-glow">
              nite
            </Text>
            <Text className="text-xl font-bold leading-5 text-lnb-text">
              bite
            </Text>
          </View>
        </View>
        {label ? (
          <Text className="max-w-40 text-right text-xs text-lnb-muted">
            {label}
          </Text>
        ) : null}
      </View>
      <Text className="text-2xl font-semibold leading-8 text-lnb-text">
        open right now
      </Text>
    </View>
  );
}

function EmptyState({
  nextOpening,
}: {
  nextOpening: string | null;
}) {
  return (
    <View className="gap-2 px-5 py-10">
      <Text className="text-2xl font-semibold text-lnb-text">
        {"nothing's open. rough."}
      </Text>
      {nextOpening ? (
        <Text className="text-sm text-lnb-muted">{nextOpening}</Text>
      ) : (
        <Text className="text-sm text-lnb-muted">
          nothing opening soon either.
        </Text>
      )}
    </View>
  );
}

function SpotRow({ item }: { item: SpotRowItem }) {
  const { ranked, routeId } = item;

  return (
    <Link
      href={{
        pathname: "/spot/[id]",
        params: {
          id: routeId,
          lat: String(item.coordinates.lat),
          lon: String(item.coordinates.lon),
        },
      }}
      asChild
    >
      <Pressable
        className="border-b border-lnb-border px-5 py-4"
        testID="lnb_spot_row"
      >
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-4">
            <Text className="min-w-0 flex-1 text-lg font-semibold text-lnb-text">
              {ranked.spot.name.toLowerCase()}
            </Text>
            <Text className="text-right text-sm tabular-nums text-lnb-text-2">
              {formatDistance(ranked.distanceMi)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text
              className={`min-w-0 flex-1 text-sm font-medium ${headlineClassName(ranked.state)}`}
            >
              {formatHeadline(ranked.state)}
            </Text>
            <Text className="text-xs text-lnb-muted">
              {formatAmenity(ranked.spot)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function RightNow() {
  const insets = useSafeAreaInsets();
  const now = useMinuteNow();
  const [permissionState, setPermissionState] =
    useState<PermissionState>("asking");
  const [choice, setChoice] = useState<LocationChoice | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(
    "use your location to find what's open nearby.",
  );
  const mountedRef = useRef(true);
  const locationRequestIdRef = useRef(0);

  useEffect(
    () => () => {
      mountedRef.current = false;
      locationRequestIdRef.current += 1;
    },
    [],
  );

  const locate = useCallback(() => {
    const requestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = requestId;
    const isCurrentRequest = () =>
      mountedRef.current && locationRequestIdRef.current === requestId;

    async function run() {
      setChoice(null);
      setPermissionState("asking");
      const permission = await requestLocationPermission(
        Location.requestForegroundPermissionsAsync,
        Location.PermissionStatus.GRANTED,
      );

      if (!isCurrentRequest()) {
        return;
      }

      if (permission.type === "error") {
        console.error("Location permission request failed:", permission.error);
        setPermissionState("error");
        setLocationNote("location failed. try again.");
        return;
      }

      if (permission.type === "denied") {
        setPermissionState("denied");
        setLocationNote("location permission is required.");
        return;
      }

      setPermissionState("locating");

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isCurrentRequest()) {
          return;
        }

        setChoice({
          label: "near you",
          coordinates: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
        });
        setPermissionState("ready");
        setLocationNote(null);
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }

        console.error("Location lookup failed after permission was granted:", error);
        setPermissionState("error");
        setLocationNote("location failed. try again.");
      }
    }

    void run();
  }, []);

  useEffect(() => locate(), [locate]);

  const queryCoordinates = useMemo(
    () => (choice ? roundedCoordinates(choice.coordinates) : null),
    [choice],
  );

  const spotsQuery = useQuery({
    queryKey: queryCoordinates ? spotQueryKey(queryCoordinates) : ["spots"],
    queryFn: () => {
      if (!queryCoordinates) {
        throw new Error("Cannot fetch spots before coordinates are selected");
      }
      return fetchSpots(bboxForCoordinates(queryCoordinates));
    },
    enabled: queryCoordinates != null,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const ranked = useMemo(
    () =>
      queryCoordinates && spotsQuery.data
        ? rankSpots(spotsQuery.data, queryCoordinates, now)
        : [],
    [now, queryCoordinates, spotsQuery.data],
  );

  const rows = useMemo<SpotRowItem[]>(
    () =>
      queryCoordinates
        ? ranked.map((item) => ({
            ranked: item,
            routeId: routeIdForSpotId(item.spot.id),
            coordinates: queryCoordinates,
          }))
        : [],
    [queryCoordinates, ranked],
  );

  const openRows = useMemo(
    () => rows.filter((item) => item.ranked.state.status === "open"),
    [rows],
  );

  const nextOpening = useMemo(() => nextOpeningLabel(ranked), [ranked]);

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<SpotRowItem>) => (
      <SpotRow item={item} />
    ),
    [],
  );

  return (
    <View
      className="flex-1 bg-lnb-bg"
      style={{ paddingTop: insets.top + 16 }}
      testID="lnb_home_screen"
    >
      <Header label={choice?.label ?? null} />
      {locationNote ? (
        <Text
          className="px-5 pb-4 text-sm text-lnb-muted"
          testID="lnb_location_note"
        >
          {locationNote}
        </Text>
      ) : null}
      {permissionState === "denied" && !choice ? (
        <View className="gap-3 px-5" testID="lnb_location_required">
          <Text
            className="text-base font-semibold text-lnb-text"
            testID="lnb_location_required_title"
          >
            enable location to continue.
          </Text>
          <Text className="text-sm text-lnb-muted" testID="lnb_no_fallback_copy">
            LateNiteBite does not use canned launch places.
          </Text>
          <View className="flex-row gap-5">
            <Pressable
              className="border-b border-lnb-glow py-2"
              testID="lnb_open_settings_button"
              onPress={() => {
                void Linking.openSettings().catch((error) => {
                  console.error("Failed to open settings:", error);
                });
              }}
            >
              <Text className="text-sm font-semibold text-lnb-glow">
                open settings
              </Text>
            </Pressable>
            <Pressable
              className="border-b border-lnb-glow py-2"
              testID="lnb_try_location_again_button"
              onPress={locate}
            >
              <Text className="text-sm font-semibold text-lnb-glow">
                try again
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {permissionState === "error" && !choice ? (
        <View className="px-5">
          <Pressable
            className="self-start border-b border-lnb-glow py-2"
            testID="lnb_try_location_again_button"
            onPress={() => {
              locate();
            }}
          >
            <Text className="text-sm font-semibold text-lnb-glow">
              try location again
            </Text>
          </Pressable>
        </View>
      ) : null}
      {permissionState !== "denied" && permissionState !== "error" && !choice ? (
        <View
          className="flex-row items-center gap-3 px-5 py-6"
          testID="lnb_location_loading"
        >
          <ActivityIndicator />
          <Text className="text-sm text-lnb-muted">
            {permissionState === "locating"
              ? "getting your spot..."
              : "asking for location..."}
          </Text>
        </View>
      ) : null}
      {choice ? (
        <View className="flex-1">
          {spotsQuery.isError ? (
            <View className="gap-3 px-5 py-8" testID="lnb_spots_error">
              <Text className="text-base font-semibold text-lnb-text">
                overpass is slow tonight.
              </Text>
              <Text className="text-sm text-lnb-muted">
                try again in a minute.
              </Text>
              <Pressable
                className="self-start border-b border-lnb-glow py-2"
                testID="lnb_retry_spots_button"
                onPress={() => {
                  void spotsQuery.refetch();
                }}
              >
                <Text className="text-sm font-semibold text-lnb-glow">
                  try again
                </Text>
              </Pressable>
            </View>
          ) : spotsQuery.isPending ? (
            <View
              className="flex-row items-center gap-3 px-5 py-6"
              testID="lnb_spots_loading"
            >
              <ActivityIndicator />
              <Text className="text-sm text-lnb-muted">
                pulling nearby spots...
              </Text>
            </View>
          ) : (
            <LegendList
              data={openRows}
              renderItem={renderItem}
              keyExtractor={(item) => item.routeId}
              estimatedItemSize={96}
              recycleItems
              testID="lnb_spot_list"
              ListEmptyComponent={<EmptyState nextOpening={nextOpening} />}
              ListFooterComponent={
                <Text className="px-5 pb-8 pt-6 text-xs text-lnb-muted">
                  est. 2015
                </Text>
              }
              contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
