import { LegendList, type LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link } from "expo-router";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView as RNScrollView,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Coordinates } from "@/core/geo";
import { fetchSpots } from "@/core/overpass";
import { rankSpots, type RankedSpot } from "@/core/rank";
import {
  bboxForCoordinates,
  formatAmenity,
  formatDistance,
  formatHeadline,
  nextOpeningLabel,
  requestLocationPermission,
  roundedCoordinates,
  rightNowRows,
  spotFoodDisplay,
  spotQueryKey,
} from "@/rightNow";
import { ChromeButton } from "@/chrome-button";
import { BulbMark } from "@/splash/BulbMark";
import { NightBulbScene } from "@/night-bulb-scene";
import { SpotPhotoThumb } from "@/spot-photo";
import {
  fetchSpotPhotos,
  MAX_SPOT_PHOTO_LOOKUPS,
  spotPhotoQueryKey,
  type SpotPhoto,
} from "@/spot-photos";
import { Pressable, Text, View } from "@/tw";
import { useMinuteNow } from "@/use-minute-now";

type RightNowRow = ReturnType<typeof rightNowRows>[number];

function headlineClassName(state: RankedSpot["state"]): string {
  if (state.status === "open") {
    return "text-lnb-open";
  }

  if (state.status === "closed") {
    return "text-lnb-closed";
  }

  return "text-lnb-muted";
}

function Header() {
  return (
    <View
      className="w-full max-w-[720px] self-center px-5 pb-5"
      testID="lnb_home_header"
    >
      <View className="flex-row items-center gap-3 self-start">
        <BulbMark width={34} height={51} />
        <View className="flex-row items-baseline gap-1">
          <Text className="text-[22px] font-bold leading-7 text-[#F2E9DA]">
            late
          </Text>
          <Text className="text-[22px] font-bold leading-7 text-[#FFB84D]">
            nite
          </Text>
          <Text className="text-[22px] font-bold leading-7 text-[#F2E9DA]">
            bite
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader() {
  return (
    <View className="w-full max-w-[720px] self-center px-5 pb-4">
      <Text className="text-2xl font-semibold leading-8 text-[#ECF0F7]">
        open
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
    <View className="w-full max-w-[720px] self-center gap-2 px-5 py-10">
      <Text className="text-2xl font-semibold text-[#ECF0F7]">
        nothing open
      </Text>
      {nextOpening ? (
        <Text className="text-sm text-[#B2BED0]">{nextOpening}</Text>
      ) : (
        <Text className="text-sm text-[#B2BED0]">try again later.</Text>
      )}
    </View>
  );
}

function HomeState({
  action,
  body,
  loading = false,
  testID,
  title,
}: {
  action?: ReactNode;
  body?: string;
  loading?: boolean;
  testID?: string;
  title: string;
}) {
  return (
    <View
      className="w-full max-w-[720px] flex-1 self-center px-5 py-6"
      testID={testID}
    >
      <View className="h-72 max-w-[430px] overflow-hidden rounded-[30px] border border-[#F2E9DA]/15 bg-[#0A101C]">
        <NightBulbScene mouse />
        <View className="absolute bottom-5 left-5 right-5 gap-3 rounded-[20px] bg-[#07101D]/82 px-4 py-4">
          <View className="flex-row items-center gap-3">
            {loading ? <ActivityIndicator color="#FFB84D" /> : null}
            <Text className="text-xl font-semibold text-[#ECF0F7]" selectable>
              {title}
            </Text>
          </View>
          {body ? (
            <Text className="text-sm leading-5 text-[#B2BED0]" selectable>
              {body}
            </Text>
          ) : null}
          {action ? <View className="flex-row flex-wrap gap-x-5 gap-y-2">{action}</View> : null}
        </View>
      </View>
    </View>
  );
}

const SpotRow = memo(function SpotRow({
  item,
  loadingPhoto,
  photo,
}: {
  item: RightNowRow;
  loadingPhoto: boolean;
  photo: SpotPhoto | null;
}) {
  const { ranked, routeId } = item;
  const food = spotFoodDisplay(ranked.spot);

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
        className="w-full max-w-[720px] self-center px-5 py-2"
        testID="lnb_spot_row"
      >
        <View
          className="flex-row gap-3 overflow-hidden rounded-[26px] border border-[#F2E9DA]/15 bg-[#111929]/92 p-3"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(242, 233, 218, 0.13), 0 14px 34px rgba(0, 0, 0, 0.28)",
          }}
        >
          <SpotPhotoThumb loading={loadingPhoto} photo={photo} />
          <View className="min-w-0 flex-1 gap-2">
            <View className="flex-row items-start justify-between gap-4">
              <Text className="min-w-0 flex-1 text-lg font-semibold text-[#ECF0F7]">
                {ranked.spot.name.toLowerCase()}
              </Text>
              <Text className="text-right text-sm tabular-nums text-[#B2BED0]">
                {formatDistance(ranked.distanceMi)}
              </Text>
            </View>
            <Text
              className={`text-sm font-medium ${headlineClassName(ranked.state)}`}
            >
              {formatHeadline(ranked.state)}
            </Text>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="min-w-0 flex-1 text-xs text-[#B2BED0]">
                {food.text}
              </Text>
              {food.label === "cuisine" ? (
                <Text className="text-xs text-[#78849A]">
                  {formatAmenity(ranked.spot.amenity)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
});

const PositiveLayoutScrollView = forwardRef<
  ComponentRef<typeof RNScrollView>,
  ScrollViewProps
>(function PositiveLayoutScrollView({ onLayout, ...props }, ref) {
  const onPositiveLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height, width } = event.nativeEvent.layout;
      if (height > 0 || width > 0) {
        onLayout?.(event);
      }
    },
    [onLayout],
  );

  return <RNScrollView {...props} onLayout={onPositiveLayout} ref={ref} />;
});

function renderPositiveLayoutScrollComponent(props: ScrollViewProps) {
  return <PositiveLayoutScrollView {...props} />;
}

function MeasuredLegendList({
  dataUpdatedAt,
  insetsBottom,
  nextOpening,
  photoStateKey,
  renderItem,
  rows,
}: {
  dataUpdatedAt: number;
  insetsBottom: number;
  nextOpening: string | null;
  photoStateKey: string;
  renderItem: (props: LegendListRenderItemProps<RightNowRow>) => ReactNode;
  rows: RightNowRow[];
}) {
  const [height, setHeight] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setHeight(nextHeight);
    }
  }, []);

  return (
    <View className="flex-1" onLayout={onLayout} style={{ minHeight: 1 }}>
      {height > 0 ? (
        <LegendList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(item) => item.routeId}
          extraData={`${dataUpdatedAt}:${photoStateKey}`}
          estimatedItemSize={128}
          style={{ height, minHeight: height }}
          recycleItems
          renderScrollComponent={renderPositiveLayoutScrollComponent}
          testID="lnb_spot_list"
          ListEmptyComponent={<EmptyState nextOpening={nextOpening} />}
          ListFooterComponent={
            <View className="w-full max-w-[720px] self-center px-5 pb-8 pt-6">
              <Text className="text-xs text-[#78849A]">est. 2015</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insetsBottom + 12, paddingTop: 2 }}
        />
      ) : null}
    </View>
  );
}

export default function RightNow() {
  const insets = useSafeAreaInsets();
  const now = useMinuteNow();
  const [permissionState, setPermissionState] =
    useState<"asking" | "locating" | "denied" | "error" | "ready">("asking");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
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
      setCoordinates(null);
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
        return;
      }

      if (permission.type === "denied") {
        setPermissionState("denied");
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

        setCoordinates({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setPermissionState("ready");
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }

        console.error("Location lookup failed after permission was granted:", error);
        setPermissionState("error");
      }
    }

    void run();
  }, []);

  useEffect(() => locate(), [locate]);

  const queryCoordinates = useMemo(
    () => (coordinates ? roundedCoordinates(coordinates) : null),
    [coordinates],
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

  const rows = useMemo(
    () => (queryCoordinates ? rightNowRows(ranked, queryCoordinates) : []),
    [queryCoordinates, ranked],
  );

  const nextOpening = useMemo(() => nextOpeningLabel(ranked), [ranked]);
  const spotsForPhotos = useMemo(
    () =>
      rows
        .slice(0, MAX_SPOT_PHOTO_LOOKUPS)
        .map((item) => item.ranked.spot),
    [rows],
  );
  const spotPhotosQuery = useQuery({
    queryKey: spotsForPhotos.length
      ? spotPhotoQueryKey(spotsForPhotos)
      : ["spot-photos"],
    queryFn: () => fetchSpotPhotos(spotsForPhotos),
    enabled: spotsForPhotos.length > 0,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });
  const photoBySpotId = useMemo(() => {
    const photos = new Map<string, SpotPhoto>();
    for (const result of spotPhotosQuery.data ?? []) {
      if (result.photo) {
        photos.set(result.spotId, result.photo);
      }
    }
    return photos;
  }, [spotPhotosQuery.data]);

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<RightNowRow>) => (
      <SpotRow
        item={item}
        loadingPhoto={spotPhotosQuery.isFetching}
        photo={photoBySpotId.get(item.ranked.spot.id) ?? null}
      />
    ),
    [photoBySpotId, spotPhotosQuery.isFetching],
  );

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: "#0A101C", paddingTop: insets.top + 16 }}
      testID="lnb_home_screen"
    >
      <Header />
      <SectionHeader />
      {permissionState === "denied" && !coordinates ? (
        <HomeState
          action={
            <>
              <ChromeButton
                tone="secondary"
                testID="lnb_open_settings_button"
                onPress={() => {
                  void Linking.openSettings().catch((error) => {
                    console.error("Failed to open settings:", error);
                  });
                }}
              >
                open settings
              </ChromeButton>
              <ChromeButton
                testID="lnb_try_location_again_button"
                onPress={locate}
              >
                try again
              </ChromeButton>
            </>
          }
          body="location is off."
          testID="lnb_location_required"
          title="location required"
        />
      ) : null}
      {permissionState === "error" && !coordinates ? (
        <HomeState
          action={
            <ChromeButton
              testID="lnb_try_location_again_button"
              onPress={() => {
                locate();
              }}
            >
              try location again
            </ChromeButton>
          }
          body="location failed."
          title="location unavailable"
        />
      ) : null}
      {permissionState !== "denied" && permissionState !== "error" && !coordinates ? (
        <HomeState
          loading
          testID="lnb_location_loading"
          title={permissionState === "locating" ? "locating" : "location"}
        />
      ) : null}
      {coordinates ? (
        <View className="flex-1" style={{ minHeight: 1 }}>
          {spotsQuery.isError ? (
            <HomeState
              action={
                <ChromeButton
                  testID="lnb_retry_spots_button"
                  onPress={() => {
                    void spotsQuery.refetch();
                  }}
                >
                  try again
                </ChromeButton>
              }
              body="open-place lookup failed."
              testID="lnb_spots_error"
              title="spots unavailable"
            />
          ) : spotsQuery.isPending ? (
            <HomeState
              loading
              testID="lnb_spots_loading"
              title="checking open spots"
            />
          ) : (
            <View className="flex-1" style={{ minHeight: 1 }}>
              {spotPhotosQuery.isError ? (
                <View className="w-full max-w-[720px] flex-row items-center justify-between gap-4 self-center px-5 pb-3">
                  <Text className="text-sm text-[#B2BED0]" selectable>
                    photos unavailable
                  </Text>
                  <ChromeButton
                    tone="secondary"
                    onPress={() => {
                      void spotPhotosQuery.refetch();
                    }}
                  >
                    try again
                  </ChromeButton>
                </View>
              ) : null}
              <MeasuredLegendList
                dataUpdatedAt={spotPhotosQuery.dataUpdatedAt}
                insetsBottom={insets.bottom}
                nextOpening={nextOpening}
                photoStateKey={spotPhotosQuery.status}
                renderItem={renderItem}
                rows={rows}
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
