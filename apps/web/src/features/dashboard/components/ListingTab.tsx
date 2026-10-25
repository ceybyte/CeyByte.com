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

export function ListingTab({ listing, onListingUpdated, copy }: ListingTabProps) {
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
        <h2 className="text-foreground text-xl font-bold tracking-tight">{copy.listingTitle}</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Keep your storefront details accurate for shoppers finding you on the CB POS map.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-card border-border space-y-5 rounded-lg border p-6">
        {/* Shop Name */}
        <div>
          <label
            htmlFor="shop-name-input"
            className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
          >
            Shop name
          </label>
          <input
            id="shop-name-input"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
            className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Business Category & District */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category-select"
              className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
            >
              Business category
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as BusinessCategory)}
              className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm capitalize focus:border-cyan-400 focus:outline-none"
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="district-select"
              className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
            >
              District
            </label>
            <select
              id="district-select"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value as District)}
              className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm capitalize focus:border-cyan-400 focus:outline-none"
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
          <label
            htmlFor="city-input"
            className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
          >
            Town or city
          </label>
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="bg-background border-border text-foreground w-full rounded border px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Contacts: WhatsApp & Telegram */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="whatsapp-input"
              className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
            >
              WhatsApp number
            </label>
            <input
              id="whatsapp-input"
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="077 123 4567"
              className="bg-background border-border text-foreground w-full rounded border px-3 py-2 font-mono text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="telegram-input"
              className="text-muted-foreground mb-1 block font-mono text-xs tracking-wider uppercase"
            >
              Telegram handle (optional)
            </label>
            <input
              id="telegram-input"
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@shop_name"
              className="bg-background border-border text-foreground w-full rounded border px-3 py-2 font-mono text-sm focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* MiniMap Pin */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
              Map coordinates (drag pin to adjust)
            </label>
            <span className="text-muted-foreground font-mono text-[11px]">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
          <div className="border-border h-60 overflow-hidden rounded border">
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
            className="border-border h-4 w-4 cursor-pointer rounded text-cyan-400 focus:ring-cyan-400"
          />
          <label htmlFor="public-toggle" className="text-foreground cursor-pointer text-xs select-none">
            {copy.listingPublic}
          </label>
        </div>

        {errorMsg && (
          <p className="text-destructive bg-destructive/10 border-destructive/20 rounded border p-2.5 text-xs">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border flex cursor-pointer items-center gap-2 rounded border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {savedSuccess && <Check className="h-4 w-4 text-cyan-400" />}
            <span>{savedSuccess ? "Saved!" : copy.listingSave}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
