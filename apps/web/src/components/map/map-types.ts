export interface GeoProperties {
  id: string;
  shopName: string;
  category: string;
  district: string;
  city: string;
  isSupporter: boolean;
  since: string;
}

export interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: GeoProperties;
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  version: number;
  generatedAt: string;
  features: GeoFeature[];
}

export interface MapFilterState {
  search: string;
  district: string;
  category: string;
  supportersOnly: boolean;
}

export const INITIAL_FILTERS: MapFilterState = {
  search: "",
  district: "all",
  category: "all",
  supportersOnly: false,
};
