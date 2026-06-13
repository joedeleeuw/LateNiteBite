import type { UseQueryResult } from "@tanstack/react-query";
import type { Coordinates } from "@/core/geo";
import type { Spot } from "@/core/spot";
import type { RankedSpot } from "@/core/rank";
import {
  FALLBACK_PLACES,
  nextOpeningLabel,
  routeIdForSpotId,
  type FallbackPlace,
} from "./rightNow";

export type LocationChoice = {
  label: string;
  coordinates: Coordinates;
};

export type LocationFlow =
  | { phase: "prompt"; note: string }
  | { phase: "locating"; note: string }
  | { phase: "denied"; note: string }
  | { phase: "ready"; choice: LocationChoice };

export type SpotRowItem = {
  ranked: RankedSpot;
  routeId: string;
};

export type RightNowBody =
  | { kind: "spinner"; message: string }
  | { kind: "pick-place"; note: string; places: FallbackPlace[] }
  | { kind: "spots-loading" }
  | { kind: "spots-error"; places: FallbackPlace[] }
  | {
      kind: "spots-list";
      openRows: SpotRowItem[];
      nextOpening: string | null;
    };

export function openSpotRows(ranked: RankedSpot[]): SpotRowItem[] {
  return ranked
    .filter((item) => item.state.status === "open")
    .map((ranked) => ({
      ranked,
      routeId: routeIdForSpotId(ranked.spot.id),
    }));
}

export function headerLabel(flow: LocationFlow): string | null {
  return flow.phase === "ready" ? flow.choice.label : null;
}

export function bodyNote(flow: LocationFlow): string | null {
  if (flow.phase === "ready" || flow.phase === "denied") {
    return null;
  }

  return flow.note;
}

export function buildRightNowBody(
  flow: LocationFlow,
  spotsQuery: UseQueryResult<Spot[], Error>,
  ranked: RankedSpot[],
): RightNowBody {
  if (flow.phase === "prompt") {
    return {
      kind: "spinner",
      message: "asking for location...",
    };
  }

  if (flow.phase === "locating") {
    return {
      kind: "spinner",
      message: "getting your spot...",
    };
  }

  if (flow.phase === "denied") {
    return {
      kind: "pick-place",
      note: flow.note,
      places: FALLBACK_PLACES,
    };
  }

  if (spotsQuery.isError) {
    return {
      kind: "spots-error",
      places: FALLBACK_PLACES,
    };
  }

  if (spotsQuery.isPending) {
    return { kind: "spots-loading" };
  }

  return {
    kind: "spots-list",
    openRows: openSpotRows(ranked),
    nextOpening: nextOpeningLabel(ranked),
  };
}
