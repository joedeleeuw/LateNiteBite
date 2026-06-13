import { LegendList, type LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSpots } from "@/core/overpass";
import { rankSpots } from "@/core/rank";
import {
  bboxForCoordinates,
  formatAmenity,
  formatDistance,
  formatHeadline,
  openStateTextClass,
  roundedCoordinates,
  serializeRankedSpot,
  spotQueryKey,
} from "@/rightNow";
import {
  bodyNote,
  buildRightNowBody,
  headerLabel,
  type LocationChoice,
  type LocationFlow,
  type RightNowBody,
  type SpotRowItem,
} from "@/rightNowScreen";
import { BulbMark } from "@/splash/BulbMark";
import { Pressable, Text, View } from "@/tw";

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

async function resolveLocationFlow(
  signal: AbortSignal,
  onPhase: (flow: LocationFlow) => void,
): Promise<LocationFlow> {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  onPhase({
    phase: "prompt",
    note: "use your location to find what's open nearby.",
  });

  const permission = await Location.requestForegroundPermissionsAsync();

  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    return {
      phase: "denied",
      note: "location denied. pick a place.",
    };
  }

  onPhase({
    phase: "locating",
    note: "use your location to find what's open nearby.",
  });

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    return {
      phase: "ready",
      choice: {
        label: "near you",
        coordinates: {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        },
      },
    };
  } catch (error) {
    if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      throw error;
    }

    return {
      phase: "denied",
      note: "location is being weird. pick a place.",
    };
  }
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

function EmptyState({ nextOpening }: { nextOpening: string | null }) {
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
        params: { id: routeId, ranked: serializeRankedSpot(ranked) },
      }}
      asChild
    >
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
              className={`min-w-0 flex-1 text-sm font-medium ${openStateTextClass(ranked.state)}`}
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

function SpinnerBlock({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-3 px-5 py-6">
      <ActivityIndicator />
      <Text className="text-sm text-lnb-muted">{message}</Text>
    </View>
  );
}

function RightNowBodyView({
  body,
  onPickPlace,
  onRetry,
  bottomInset,
  renderItem,
}: {
  body: RightNowBody;
  onPickPlace: (place: LocationChoice) => void;
  onRetry: () => void;
  bottomInset: number;
  renderItem: (props: LegendListRenderItemProps<SpotRowItem>) => ReactElement;
}) {
  switch (body.kind) {
    case "spinner":
      return <SpinnerBlock message={body.message} />;
    case "pick-place":
      return (
        <View className="gap-3 px-5">
          <Text className="text-sm text-lnb-muted">{body.note}</Text>
          <View className="gap-2">
            {body.places.map((place) => (
              <Pressable
                key={place.label}
                className="border-b border-lnb-border py-4"
                onPress={() => onPickPlace(place)}
              >
                <Text className="text-base font-semibold text-lnb-text">
                  {place.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    case "spots-loading":
      return <SpinnerBlock message="pulling nearby spots..." />;
    case "spots-error":
      return (
        <View className="gap-3 px-5 py-8">
          <Text className="text-base font-semibold text-lnb-text">
            overpass is slow tonight.
          </Text>
          <Text className="text-sm text-lnb-muted">
            try again, or pick a launch spot.
          </Text>
          <Pressable
            className="self-start border-b border-lnb-glow py-2"
            onPress={onRetry}
          >
            <Text className="text-sm font-semibold text-lnb-glow">
              try again
            </Text>
          </Pressable>
          <View className="gap-2">
            {body.places.map((place) => (
              <Pressable
                key={place.label}
                className="border-b border-lnb-border py-4"
                onPress={() => onPickPlace(place)}
              >
                <Text className="text-base font-semibold text-lnb-text">
                  {place.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    case "spots-list":
      return (
        <LegendList
          data={body.openRows}
          renderItem={renderItem}
          keyExtractor={(item) => item.routeId}
          estimatedItemSize={96}
          recycleItems
          ListEmptyComponent={
            <EmptyState nextOpening={body.nextOpening} />
          }
          ListFooterComponent={
            <Text className="px-5 pb-8 pt-6 text-xs text-lnb-muted">
              est. 2015
            </Text>
          }
          contentContainerStyle={{ paddingBottom: bottomInset + 12 }}
        />
      );
  }
}

export default function RightNow() {
  const insets = useSafeAreaInsets();
  const now = useMinuteNow();
  const [flow, setFlow] = useState<LocationFlow>({
    phase: "prompt",
    note: "use your location to find what's open nearby.",
  });

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const next = await resolveLocationFlow(controller.signal, setFlow);
        setFlow(next);
      } catch {
        return;
      }
    })();

    return () => controller.abort();
  }, []);

  const queryCoordinates = useMemo(
    () =>
      flow.phase === "ready"
        ? roundedCoordinates(flow.choice.coordinates)
        : null,
    [flow],
  );

  const spotsQuery = useQuery({
    queryKey: queryCoordinates
      ? spotQueryKey(queryCoordinates)
      : (["spots", "idle"] as const),
    queryFn: () => fetchSpots(bboxForCoordinates(queryCoordinates!)),
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

  const pickPlace = useCallback((place: LocationChoice) => {
    setFlow({ phase: "ready", choice: place });
  }, []);

  const onRetry = useCallback(() => {
    void spotsQuery.refetch();
  }, [spotsQuery]);

  const body = buildRightNowBody(flow, spotsQuery, ranked);
  const note = bodyNote(flow);

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
      <Header label={headerLabel(flow)} />
      {note ? (
        <Text className="px-5 pb-4 text-sm text-lnb-muted">{note}</Text>
      ) : null}
      <View className="flex-1">
        <RightNowBodyView
          body={body}
          onPickPlace={pickPlace}
          onRetry={onRetry}
          bottomInset={insets.bottom}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
}
