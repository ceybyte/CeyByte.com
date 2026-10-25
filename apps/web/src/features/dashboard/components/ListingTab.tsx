"use client";

import { useState } from "react";
import { BUSINESS_CATEGORIES, DISTRICTS, type BusinessCategory, type District } from "@cbpos/shared/enums";
import { MiniMap, DISTRICT_CENTROIDS } from "@/components/gate/mini-map";
import type { MerchantListing } from "../types";
import { updateListing } from "../api";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface ListingTabProps {
  listing: MerchantListing;
  onListingUpdated: (updated: MerchantListing) => void;
  copy: {
    listingTitle: string;
    listingPublic: string;
    listingSave: string;
    listingSaved: string;
  };
}

export function ListingTab({
  listing,
  onListingUpdated,
  copy,
}: ListingTabProps) {
  const [shopName, setShopName] = useState(listing.shopName);
  const [category, setCategory] = useState<BusinessCategory>(listing.category as BusinessCategory);
  const [district, setDistrict] = useState<District>(listing.district as District);
  const [city, setCity] = useState(listing.city);
  const [whatsapp, setWhatsapp] = useState(listing.whatsapp ?? "");
  const [telegram, setTelegram] = useState(listing.telegram ?? "");
  const [lat, setLat] = useState(listing.lat);
  const [lng, setLng] = useState(listing.lng);
  const [isPublicOnMap, setIsPublicOnMap] = useState(listing.isPublicOnMap);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDistrictChange = (newDistrict: District) => {
    setDistrict(newDistrict);
    const centroid = DISTRICT_CENTROIDS[newDistrict];
    if (centroid) {
      setLat(centroid.lat);
      setLng(centroid.lng);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !city.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const updated = await updateListing({
        shopName: shopName.trim(),
        category,
        district,
        city: city.trim(),
        whatsapp: whatsapp.trim() || null,
        telegram: telegram.trim() || null,
        lat,
        lng,
        isPublicOnMap,
      });

      onListingUpdated(updated);
      setSavedSuccess(true);
      toast.success(copy.listingSaved);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {copy.listingTitle}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Keep your storefront details accurate for shoppers finding you on the CB POS map.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 bg-card border border-border rounded-lg p-6">
        {/* Shop Name */}
        <div>
          <label htmlFor="shop-name-input" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Shop name
          </label>
          <input
            id="shop-name-input"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Business Category & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category-select" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Business category
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as BusinessCategory)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400 capitalize"
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district-select" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              District
            </label>
            <select
              id="district-select"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value as District)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400 capitalize"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* City / Town */}
        <div>
          <label htmlFor="city-input" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Town or city
          </label>
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Contacts: WhatsApp & Telegram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="whatsapp-input" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              WhatsApp number
            </label>
            <input
              id="whatsapp-input"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="077 123 4567"
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label htmlFor="telegram-input" className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Telegram handle (optional)
            </label>
            <input
              id="telegram-input"
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@shop_name"
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* MiniMap Pin */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Map coordinates (drag pin to adjust)
            </label>
            <span className="text-[11px] font-mono text-muted-foreground">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
          <div className="h-60 rounded border border-border overflow-hidden">
            <MiniMap
              lat={lat}
              lng={lng}
              onChange={({ lat: newLat, lng: newLng }) => {
                setLat(newLat);
                setLng(newLng);
              }}
            />
          </div>
        </div>

        {/* Public Map Visibility Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            id="public-toggle"
            type="checkbox"
            checked={isPublicOnMap}
            onChange={(e) => setIsPublicOnMap(e.target.checked)}
            className="w-4 h-4 rounded border-border text-cyan-400 focus:ring-cyan-400 cursor-pointer"
          />
          <label htmlFor="public-toggle" className="text-xs text-foreground cursor-pointer select-none">
            {copy.listingPublic}
          </label>
        </div>

        {errorMsg && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded text-sm font-medium transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {savedSuccess && <Check className="w-4 h-4 text-cyan-400" />}
            <span>{savedSuccess ? "Saved!" : copy.listingSave}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
