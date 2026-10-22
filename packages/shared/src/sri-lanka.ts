import { SRI_LANKA_BOUNDS, type District } from "./enums";

// Geography helpers for the download gate (04-APP_FLOW S02-b) and the map. Data files live in
// apps/web/public/data/lk-{districts,cities}.json and are passed in, so this module stays isomorphic.

export type LatLng = { lat: number; lng: number };

export type City = LatLng & {
  name: string;
  district: District;
};

export function isInSriLanka({ lat, lng }: LatLng): boolean {
  const b = SRI_LANKA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

const EARTH_RADIUS_KM = 6371.0088;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestCity<T extends LatLng>(
  point: LatLng,
  cities: readonly T[],
): { city: T; km: number } | null {
  let best: { city: T; km: number } | null = null;
  for (const city of cities) {
    const km = haversineKm(point, city);
    if (!best || km < best.km) best = { city, km };
  }
  return best;
}
