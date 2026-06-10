import { LegendList, type LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSpots } from "@/core/overpass";
import { rankSpots, type RankedSpot } from "@/core/rank";
import {
  FALLBACK_PLACES,
  bboxForCoordinates,
  formatAmenity,
  formatDistance,
  formatHeadline,
  nextOpeningLabel,
  rememberRankedSpots,
  routeIdForSpotId,
  roundedCoordinates,
  spotQueryKey,
} from "@/rightNow";
import { BulbMark } from "@/splash/BulbMark";
import { Pressable, Text, View } from "@/tw";

type LocationChoice = {
  label: string;
  coordinates: { lat: number; lon: number };
};

type PermissionState = "asking" | "locating" | "denied" | "ready";

type SpotRowItem = {
  ranked: RankedSpot;
  routeId: string;
};

function floorToMinute(date = new Date()): Date {
  const minute = new Date(date);
  minute.setSeconds(0, 0);
  return minute;
}

function useMinuteNow(): Date {
  const [now, setNow] = useState(() => floorToMinute());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const tick = () => setNow(floorToMinute());
    const timeout = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      clearTimeout(timeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return now;
}

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
    <View className="gap-5 px-5 pb-4">
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

function FallbackPicker({
  onPick,
}: {
  onPick: (place: LocationChoice) => void;
}) {
  return (
    <View className="gap-3 px-5">
      <Text className="text-sm text-lnb-muted">
        location denied. pick a launch spot.
      </Text>
      <View className="gap-2">
        {FALLBACK_PLACES.map((place) => (
          <Pressable
            key={place.label}
            className="border-b border-lnb-border py-4"
            onPress={() => onPick(place)}
          >
            <Text className="text-base font-semibold text-lnb-text">
              {place.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
    <Link href={{ pathname: "/spot/[id]", params: { id: routeId } }} asChild>
      <Pressable className="border-b border-lnb-border px-5 py-4">
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

  useEffect(() => {
    let mounted = true;

    async function locate() {
      setPermissionState("asking");
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted) {
        return;
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setPermissionState("denied");
        setLocationNote("location denied. pick a place.");
        return;
      }

      setPermissionState("locating");

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) {
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
      } catch {
        if (!mounted) {
          return;
        }

        setPermissionState("denied");
        setLocationNote("location is being weird. pick a place.");
      }
    }

    locate();

    return () => {
      mounted = false;
    };
  }, []);

  const queryCoordinates = useMemo(
    () => (choice ? roundedCoordinates(choice.coordinates) : null),
    [choice],
  );

  const spotsQuery = useQuery({
    queryKey: queryCoordinates ? spotQueryKey(queryCoordinates) : ["spots"],
    queryFn: () =>
      fetchSpots(
        bboxForCoordinates(queryCoordinates ?? FALLBACK_PLACES[0].coordinates),
      ),
    enabled: queryCoordinates != null,
    staleTime: 10 * 60 * 1000,
  });

  const ranked = useMemo(
    () =>
      queryCoordinates && spotsQuery.data
        ? rankSpots(spotsQuery.data, queryCoordinates, now)
        : [],
    [now, queryCoordinates, spotsQuery.data],
  );

  useEffect(() => {
    rememberRankedSpots(ranked);
  }, [ranked]);

  const rows = useMemo<SpotRowItem[]>(
    () =>
      ranked.map((item) => ({
        ranked: item,
        routeId: routeIdForSpotId(item.spot.id),
      })),
    [ranked],
  );

  const openRows = useMemo(
    () => rows.filter((item) => item.ranked.state.status === "open"),
    [rows],
  );

  const nextOpening = useMemo(() => nextOpeningLabel(ranked), [ranked]);

  const pickFallback = useCallback((place: LocationChoice) => {
    setChoice(place);
    setPermissionState("ready");
    setLocationNote(null);
  }, []);

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
    >
      <Header label={choice?.label ?? null} />
      {locationNote ? (
        <Text className="px-5 pb-4 text-sm text-lnb-muted">{locationNote}</Text>
      ) : null}
      {permissionState === "denied" && !choice ? (
        <FallbackPicker onPick={pickFallback} />
      ) : null}
      {permissionState !== "denied" && !choice ? (
        <View className="flex-row items-center gap-3 px-5 py-6">
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
            <View className="gap-3 px-5 py-8">
              <Text className="text-base font-semibold text-lnb-text">
                overpass is slow tonight.
              </Text>
              <Text className="text-sm text-lnb-muted">
                try again, or pick a launch spot.
              </Text>
              <Pressable
                className="self-start border-b border-lnb-glow py-2"
                onPress={() => {
                  void spotsQuery.refetch();
                }}
              >
                <Text className="text-sm font-semibold text-lnb-glow">
                  try again
                </Text>
              </Pressable>
              <FallbackPicker onPick={pickFallback} />
            </View>
          ) : spotsQuery.isPending ? (
            <View className="flex-row items-center gap-3 px-5 py-6">
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
