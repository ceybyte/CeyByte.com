"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, ArrowRight } from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  DISTRICTS,
  type District,
} from "@cbpos/shared/enums";
import { DISTRICT_CENTROIDS } from "@/components/gate/mini-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DownloadFormProps {
  locale: string;
}

export function DownloadForm({ locale }: DownloadFormProps) {
  const t = useTranslations("gate");
  const tCat = useTranslations("categories");
  const tDist = useTranslations("districts");

  const [selectedDistrict, setSelectedDistrict] = useState<District>("colombo");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(false);

  const centroid = DISTRICT_CENTROIDS[selectedDistrict] ?? { lat: 6.9271, lng: 79.8612 };

  return (
    <form
      action="/api/downloads"
      method="POST"
      className="border-hairline bg-surface mx-auto max-w-xl space-y-6 rounded-lg border p-6 shadow-xl sm:p-8"
    >
      {/* Hidden Fields for No-JS Processing */}
      <input type="hidden" name="preferredLocale" value={locale} />
      <input type="hidden" name="termsVersion" value="2026-10-01" />
      <input type="hidden" name="locationSource" value="city_centroid" />
      <input type="hidden" name="lat" value={centroid.lat} />
      <input type="hidden" name="lng" value={centroid.lng} />
      <input type="hidden" name="turnstileToken" value="1x00000000000000000000AA" />

      <div>
        <span className="text-primary font-mono text-xs font-semibold uppercase tracking-wider">
          {t("step", { n: 1 })}
        </span>
        <h2 className="text-display text-text mt-1 text-2xl font-bold sm:text-3xl">
          {t("s1.title")}
        </h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">{t("s1.lead")}</p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="nojs-fullName" className="text-xs font-medium">
            {t("fullName.label")}
          </Label>
          <Input
            id="nojs-fullName"
            name="fullName"
            required
            data-ph-no-capture="true"
            placeholder="Kasun Perera"
          />
        </div>

        {/* Shop Name */}
        <div className="space-y-1.5">
          <Label htmlFor="nojs-shopName" className="text-xs font-medium">
            {t("shopName.label")}
          </Label>
          <Input
            id="nojs-shopName"
            name="shopName"
            required
            placeholder={t("shopName.placeholder")}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="nojs-category" className="text-xs font-medium">
            {t("category.label")}
          </Label>
          <select
            id="nojs-category"
            name="category"
            required
            defaultValue="grocery"
            className="border-hairline bg-surface-elevated text-text focus-visible:outline-text h-10 w-full rounded-md border px-3 text-sm"
          >
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {tCat(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <Label htmlFor="nojs-phone" className="text-xs font-medium">
            {t("phone.label")}
          </Label>
          <div className="relative flex rounded-md">
            <span className="border-hairline bg-surface-elevated text-text-muted inline-flex items-center rounded-l-md border border-r-0 px-3 font-mono text-xs select-none">
              +94
            </span>
            <Input
              id="nojs-phone"
              name="phone"
              type="tel"
              required
              data-ph-no-capture="true"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (sameAsPhone) setWhatsapp(e.target.value);
              }}
              placeholder="77 123 4567"
              className="rounded-l-none"
            />
          </div>
          <p className="text-text-muted text-[11px]">{t("phone.help")}</p>
        </div>

        {/* WhatsApp Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="nojs-whatsapp" className="text-xs font-medium">
              {t("whatsapp.label")}
            </Label>
            <label className="text-text-muted hover:text-text flex cursor-pointer items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(e) => {
                  setSameAsPhone(e.target.checked);
                  if (e.target.checked) setWhatsapp(phone);
                }}
                className="size-3.5 accent-primary rounded"
              />
              <span>{t("whatsapp.same")}</span>
            </label>
          </div>
          <div className="relative flex rounded-md">
            <span className="border-hairline bg-surface-elevated text-text-muted inline-flex items-center rounded-l-md border border-r-0 px-3 font-mono text-xs select-none">
              +94
            </span>
            <Input
              id="nojs-whatsapp"
              name="whatsapp"
              type="tel"
              data-ph-no-capture="true"
              value={sameAsPhone ? phone : whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="77 123 4567"
              disabled={sameAsPhone}
              className="rounded-l-none"
            />
          </div>
        </div>

        <div className="border-hairline-grid border-t pt-4">
          <h3 className="text-display text-text text-lg font-bold sm:text-xl">
            {t("s2.title")}
          </h3>
        </div>

        {/* District & City */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nojs-district" className="text-xs font-medium">
              {t("district.label")}
            </Label>
            <select
              id="nojs-district"
              name="district"
              required
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as District)}
              className="border-hairline bg-surface-elevated text-text focus-visible:outline-text h-10 w-full rounded-md border px-3 text-sm"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {tDist(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nojs-city" className="text-xs font-medium">
              {t("city.label")}
            </Label>
            <Input
              id="nojs-city"
              name="city"
              required
              defaultValue="Colombo 01"
              placeholder="e.g. Pettah"
            />
          </div>
        </div>

        {/* Public Map Opt-in */}
        <div className="border-hairline bg-surface-elevated rounded-md border p-3.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="isPublicOnMap"
              value="true"
              className="size-4 accent-primary rounded mt-0.5"
            />
            <div className="text-xs">
              <span className="text-text font-semibold block">{t("public.label")}</span>
              <span className="text-text-muted mt-1 block leading-relaxed">
                {t("public.help")}
              </span>
            </div>
          </label>
        </div>

        {/* Terms Acceptance */}
        <div className="border-hairline bg-surface-elevated rounded-md border p-3.5">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="termsAccepted"
              value="true"
              required
              className="size-4 accent-primary rounded mt-0.5"
            />
            <div className="text-xs">
              <span className="text-text leading-relaxed block">{t("terms.label")}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button (Exactly One Neon Green Button Per Viewport) */}
      <div className="pt-2">
        <Button type="submit" variant="primary" size="xl" className="w-full">
          <Download className="mr-1.5 size-5" />
          <span>{t("s2.cta")}</span>
          <ArrowRight className="ml-1 size-5" />
        </Button>
      </div>
    </form>
  );
}
