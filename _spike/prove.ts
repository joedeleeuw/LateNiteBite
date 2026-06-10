import type { Coordinates } from "./core/geo";
import { fetchSpots, type BBox } from "./core/overpass";
import { rankSpots, type RankedSpot } from "./core/rank";

type City = {
  name: string;
  user: Coordinates;
  bbox: BBox;
};

const CITIES: City[] = [
  {
    name: "Tallahassee · FSU",
    user: { lat: 30.4419, lon: -84.2985 },
    bbox: { south: 30.425, west: -84.31, north: 30.46, east: -84.27 },
  },
  {
    name: "NYC · Washington Sq / NYU",
    user: { lat: 40.7308, lon: -73.9973 },
    bbox: { south: 40.72, west: -74.01, north: 40.745, east: -73.98 },
  },
];

function fmtMins(min: number | null): string {
  if (min == null) return "open-ended";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function stateLabel(r: RankedSpot): string {
  if (r.state.status === "open") {
    return `OPEN · closes in ${fmtMins(r.state.closesInMin)}`;
  }
  if (r.state.status === "closed") return "closed";
  return `? ${r.state.reason}`;
}

function printRun(title: string, ranked: RankedSpot[], at: Date): void {
  const dow = at.toLocaleDateString("en-US", { weekday: "short" });
  const time = at.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const open = ranked.filter((r) => r.state.status === "open");
  console.log(`\n  [${title} · ${dow} ${time}]  ${open.length} open now`);
  for (const r of open.slice(0, 10)) {
    const name = r.spot.name.slice(0, 26).padEnd(26);
    const dist = `${r.distanceMi.toFixed(2)} mi`.padStart(8);
    console.log(`    ${name}${dist}  ·  ${stateLabel(r)}`);
  }
}

function nextSaturday0130(from: Date): Date {
  const d = new Date(from);
  d.setHours(1, 30, 0, 0);
  const day = d.getDay();
  const delta = (6 - day + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const now = new Date();
  const lateNite = nextSaturday0130(now);

  for (const [i, city] of CITIES.entries()) {
    if (i > 0) await sleep(5000);
    console.log(`\n========== ${city.name} ==========`);
    try {
      const spots = await fetchSpots(city.bbox);
      const withHours = spots.filter((s) => s.openingHours).length;
      const pct = spots.length
        ? Math.round((withHours / spots.length) * 100)
        : 0;
      console.log(
        `  ${spots.length} food spots · ${withHours} (${pct}%) have opening_hours in OSM`,
      );
      printRun("NOW", rankSpots(spots, city.user, now), now);
      printRun("LATE NITE", rankSpots(spots, city.user, lateNite), lateNite);
    } catch (err) {
      console.log(`  FAILED: ${String(err)}`);
    }
  }
}

main();
