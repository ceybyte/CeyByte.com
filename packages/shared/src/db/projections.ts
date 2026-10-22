// Source of truth: docs/05-SCHEMA.md §7.2. The only public merchant shape; contract-tested.
import { and, eq, isNull } from "drizzle-orm";
import { merchants } from "./schema";

/** The ONLY columns allowed in public geo output. Contract-tested. */
export const PUBLIC_GEO_COLUMNS = {
  publicId: merchants.publicId,
  shopName: merchants.shopName,
  category: merchants.category,
  district: merchants.district,
  city: merchants.city,
  lat: merchants.lat,
  lng: merchants.lng,
  isSupporter: merchants.isSupporter,
  createdAt: merchants.createdAt,
} as const;

export const PUBLIC_GEO_PROPERTIES = [
  "id",
  "shopName",
  "category",
  "district",
  "city",
  "isSupporter",
  "since",
] as const;

export const publicMapWhere = and(
  eq(merchants.status, "listed"),
  eq(merchants.isPublicOnMap, true),
  isNull(merchants.deletedAt),
);

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

export function toGeoFeature(r: {
  publicId: string;
  shopName: string;
  category: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  isSupporter: boolean;
  createdAt: Date;
}) {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [round4(r.lng), round4(r.lat)] as [number, number] },
    properties: {
      id: r.publicId,
      shopName: r.shopName,
      category: r.category,
      district: r.district,
      city: r.city,
      isSupporter: r.isSupporter,
      since: r.createdAt.toISOString().slice(0, 7),
    },
  };
}
