import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ensureHttpProtocol, openExternalUrl } from "@/action-links";
import { ChromeButton } from "@/chrome-button";
import { fetchSpots } from "@/core/overpass";
import { rankSpots } from "@/core/rank";
import {
  buildNavigateUrl,
  bboxForCoordinates,
  formatAmenity,
  formatDetailState,
  formatDistance,
  navigationPlatformFromOS,
  spotFoodDisplay,
  spotDetailRouteFromParams,
  spotQueryKey,
} from "@/rightNow";
import { SpotPhotoHero } from "@/spot-photo";
import {
  fetchSpotPhotos,
  spotPhotoQueryKey,
} from "@/spot-photos";
import { MissingPlaceState } from "@/missing-place-state";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { useMinuteNow } from "@/use-minute-now";

function statusClassName(status: "closed" | "open" | "unknown"): string {
  if (status === "open") return "text-[#50C882]";
  if (status === "closed") return "text-[#E96363]";
  return "text-[#78849A]";
}

function BackButton() {
  return (
    <Link href="/" asChild>
      <Pressable
        className="self-start border-b border-[#F2E9DA]/20 py-2"
        testID="lnb_back_button"
      >
        <Text className="text-sm text-[#B2BED0]">back</Text>
      </Pressable>
    </Link>
  );
}

function DetailStateShell({
  action,
  body,
  testID,
  title,
}: {
  action?: ReactNode;
  body?: string;
  testID: string;
  title: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-lnb-bg px-5"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      testID={testID}
    >
      <View className="w-full max-w-[560px] flex-1 self-center gap-5">
        <BackButton />
        <View className="gap-3">
          <Text className="text-2xl font-semibold text-lnb-text" selectable>
            {title}
          </Text>
          {body ? (
            <Text className="text-sm text-lnb-muted" selectable>
              {body}
            </Text>
          ) : null}
          {action}
        </View>
      </View>
    </View>
  );
}

export default function SpotDetail() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const now = useMinuteNow();
  const [actionError, setActionError] = useState<string | null>(null);
  const detailRoute = useMemo(() => {
    try {
      return spotDetailRouteFromParams(params);
    } catch {
      return null;
    }
  }, [params]);
  const coordinates = detailRoute?.coordinates ?? null;
  const spotId = detailRoute?.spotId ?? null;
  const spotsQuery = useQuery({
    queryKey: coordinates ? spotQueryKey(coordinates) : ["spots", "detail"],
    queryFn: () => {
      if (!coordinates) {
        throw new Error("Spot detail requires coordinates");
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
  const spotPhotosQuery = useQuery({
    queryKey: ranked
      ? spotPhotoQueryKey([ranked.spot])
      : ["spot-photos", "detail"],
    queryFn: () => {
      if (!ranked) {
        throw new Error("Cannot fetch photos before the place is loaded");
      }
      return fetchSpotPhotos([ranked.spot]);
    },
    enabled: ranked != null,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });

  if (!coordinates || !spotId) {
    return <MissingPlaceState testID="lnb_spot_missing" />;
  }

  if (spotsQuery.isPending) {
    return (
      <DetailStateShell
        testID="lnb_spot_detail_loading"
        title="loading place"
      />
    );
  }

  if (spotsQuery.isError) {
    return (
      <DetailStateShell
        action={
          <ChromeButton
            testID="lnb_retry_spot_detail_button"
            onPress={() => {
              void spotsQuery.refetch();
            }}
          >
            try again
          </ChromeButton>
        }
        body="could not load this place."
        testID="lnb_spot_detail_error"
        title="place unavailable"
      />
    );
  }

  if (!ranked) {
    return <MissingPlaceState testID="lnb_spot_missing" />;
  }

  const spot = ranked.spot;
  const food = spotFoodDisplay(spot);
  const spotPhoto = spotPhotosQuery.data?.[0]?.photo ?? null;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: "#0A101C", paddingTop: insets.top + 12 }}
      testID="lnb_spot_detail"
    >
      <View className="w-full max-w-[560px] self-center px-5">
        <BackButton />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[560px] self-center gap-6 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 104 }}
      >
        <SpotPhotoHero
          error={spotPhotosQuery.isError}
          loading={spotPhotosQuery.isFetching}
          onRetry={() => {
            void spotPhotosQuery.refetch();
          }}
          photo={spotPhoto}
        />
        <View className="gap-3">
          <Text className="text-3xl font-semibold leading-9 text-[#ECF0F7]">
            {spot.name.toLowerCase()}
          </Text>
          <Text
            className={`text-base font-medium ${statusClassName(ranked.state.status)}`}
            testID="lnb_spot_detail_state"
          >
            {formatDetailState(ranked.state)}
          </Text>
          <Text className="text-sm tabular-nums text-[#B2BED0]">
            {formatDistance(ranked.distanceMi)} · {formatAmenity(spot.amenity)}
          </Text>
          {actionError ? (
            <Text className="text-sm text-[#B2BED0]" selectable>
              {actionError}
            </Text>
          ) : null}
        </View>
        <View className="gap-5">
          <View className="gap-1 border-b border-[#F2E9DA]/12 pb-4">
            <Text className="text-xs text-[#78849A]">{food.label}</Text>
            <Text className="text-base text-[#ECF0F7]">{food.text}</Text>
          </View>
          {spot.phone ? (
            <View className="gap-1 border-b border-[#F2E9DA]/12 pb-4">
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
                <Text className="text-base font-semibold text-[#FFB84D]">
                  call
                </Text>
                <Text className="text-sm text-[#B2BED0]" selectable>
                  {spot.phone}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {spot.website ? (
            <View className="gap-1 border-b border-[#F2E9DA]/12 pb-4">
              <Pressable
                onPress={() => {
                  setActionError(null);
                  const website = spot.website;
                  if (!website) {
                    setActionError("could not open website.");
                    return;
                  }
                  const websiteUrl = ensureHttpProtocol(website);

                  void openExternalUrl(websiteUrl, Linking.openURL).catch((error) => {
                    console.error("Failed to open website URL:", error);
                    setActionError("could not open website.");
                  });
                }}
              >
                <Text className="text-base font-semibold text-[#FFB84D]">
                  website
                </Text>
                <Text className="text-sm text-[#B2BED0]" selectable>
                  {spot.website}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View
        className="w-full max-w-[560px] self-center px-5 pt-2"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          className="items-center rounded-full bg-[#FFB84D] px-5 py-3"
          testID="lnb_navigate_button"
          onPress={() => {
            setActionError(null);
            void Promise.resolve()
              .then(() =>
                openExternalUrl(
                  buildNavigateUrl(
                    spot,
                    navigationPlatformFromOS(Platform.OS),
                  ),
                  Linking.openURL,
                ),
              )
              .catch((error) => {
                console.error("Failed to open navigation URL:", error);
                setActionError("could not open maps.");
              });
          }}
        >
          <Text className="text-base font-semibold text-[#0A101C]">directions</Text>
        </Pressable>
      </View>
    </View>
  );
}
