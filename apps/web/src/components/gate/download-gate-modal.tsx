"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X, ArrowLeft, Download, ArrowRight } from "lucide-react";
import {
  BUSINESS_CATEGORIES,
  DISTRICTS,
  type BusinessCategory,
  type District,
  type LocationSource,
} from "@cbpos/shared/enums";
import { Step1ShopSchema, DownloadGateSchema } from "@cbpos/shared/schemas/download-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/use-media-query";
import { useGate } from "./gate-context";
import { MiniMap, DISTRICT_CENTROIDS } from "./mini-map";
import { WhatNextView } from "./what-next-view";
import { TurnstileWidget } from "./turnstile-widget";

export function DownloadGateModal() {
  const { isOpen, step, setStep, closeGate, step1Draft, setStep1Draft, downloadResult, setDownloadResult } =
    useGate();

  const locale = useLocale();
  const t = useTranslations("gate");
  const tErrors = useTranslations("errors");
  const tCat = useTranslations("categories");
  const tDist = useTranslations("districts");

  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Form states
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(false);

  // Step 2 states
  const [district, setDistrict] = useState<District | "">("colombo");
  const [city, setCity] = useState("Colombo 01");
  const [lat, setLat] = useState(6.9271);
  const [lng, setLng] = useState(79.8612);
  const [locationSource, setLocationSource] = useState<LocationSource>("city_centroid");
  const [isPublicOnMap, setIsPublicOnMap] = useState(false); // PDPA: defaults to unchecked
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate from draft when opened
  useEffect(() => {
    if (step1Draft) {
      if (step1Draft.fullName) setFullName(step1Draft.fullName);
      if (step1Draft.shopName) setShopName(step1Draft.shopName);
      if (step1Draft.category) setCategory(step1Draft.category);
      if (step1Draft.phone) setPhone(step1Draft.phone);
      if (step1Draft.whatsapp) setWhatsapp(step1Draft.whatsapp);
    }
  }, [step1Draft]);

  // Handle same as phone sync
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [sameAsPhone, phone]);

  // When district changes, update centroid if user hasn't pinned manually
  const handleDistrictChange = useCallback((newDistrict: District) => {
    setDistrict(newDistrict);
    const centroid = DISTRICT_CENTROIDS[newDistrict];
    if (centroid) {
      setLat(centroid.lat);
      setLng(centroid.lng);
      setLocationSource("city_centroid");
    }
  }, []);

  const handleStep1Submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      const input = {
        fullName,
        shopName,
        category,
        phone,
        whatsapp: sameAsPhone ? phone : whatsapp || undefined,
      };

      const parse = Step1ShopSchema.safeParse(input);
      if (!parse.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parse.error.issues) {
          const path = issue.path[0] as string;
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = issue.message.startsWith("errors.")
              ? tErrors(issue.message.replace("errors.", "") as "required" | "INVALID_PHONE" | "too_long")
              : issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setStep1Draft(parse.data);
      setStep(2);
    },
    [fullName, shopName, category, phone, whatsapp, sameAsPhone, setStep1Draft, setStep, tErrors],
  );

  const handleStep2Submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      const payload = {
        fullName,
        shopName,
        category,
        phone,
        whatsapp: sameAsPhone ? phone : whatsapp || undefined,
        district,
        city,
        lat,
        lng,
        locationSource,
        isPublicOnMap,
        termsAccepted,
        termsVersion: "2026-10-01",
        preferredLocale: locale,
        turnstileToken: turnstileToken || "1x00000000000000000000AA",
      };

      const parse = DownloadGateSchema.safeParse(payload);
      if (!parse.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parse.error.issues) {
          const path = issue.path[0] as string;
          if (path && !fieldErrors[path]) {
            fieldErrors[path] = issue.message.startsWith("errors.")
              ? tErrors(
                  issue.message.replace("errors.", "") as
                    "required" | "INVALID_PHONE" | "LOCATION_OUTSIDE_SRI_LANKA",
                )
              : issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/downloads", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.ok) {
          if (json?.error?.fields) {
            setErrors(json.error.fields);
          } else {
            setErrors({ form: tErrors("INTERNAL", { requestId: json?.error?.requestId ?? "unknown" }) });
          }
          return;
        }

        setDownloadResult(json.data);
        setStep("done");

        // Automatically trigger installer download
        if (json.data?.downloadUrl) {
          const link = document.createElement("a");
          link.href = json.data.downloadUrl;
          link.download = "";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch {
        setErrors({ form: tErrors("INTERNAL", { requestId: "network-error" }) });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      fullName,
      shopName,
      category,
      phone,
      whatsapp,
      sameAsPhone,
      district,
      city,
      lat,
      lng,
      locationSource,
      isPublicOnMap,
      termsAccepted,
      locale,
      turnstileToken,
      setDownloadResult,
      setStep,
      tErrors,
    ],
  );

  // Modal content renderer
  const renderContent = () => {
    return (
      <div className="flex flex-col gap-4">
        {/* Step Header & Progress Bar */}
        {step !== "done" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-mono text-xs font-semibold tracking-wider uppercase">
                {t("step", { n: step })}
              </span>
              <button
                type="button"
                onClick={closeGate}
                className="text-text-muted hover:text-text rounded-sm p-1 transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* 2-segment progress bar */}
            <div className="flex h-1 gap-1.5">
              <div className="bg-azure h-full flex-1 rounded-full transition-all duration-300" />
              <div
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  step === 2 ? "bg-azure" : "bg-surface-elevated"
                }`}
              />
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errors.form && (
          <div className="border-error/40 bg-error/10 text-error rounded-sm border p-2 text-xs">
            {errors.form}
          </div>
        )}

        {/* STEP 1: Your Shop Details */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-display text-text text-xl font-bold sm:text-2xl">{t("s1.title")}</h2>
              <p className="text-text-muted mt-1 text-xs leading-relaxed sm:text-sm">{t("s1.lead")}</p>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-fullName" className="text-xs font-medium">
                {t("fullName.label")}
              </Label>
              <Input
                id="gate-fullName"
                name="fullName"
                data-ph-no-capture="true"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kasun Perera"
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && <p className="text-error text-xs">{errors.fullName}</p>}
            </div>

            {/* Shop Name */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-shopName" className="text-xs font-medium">
                {t("shopName.label")}
              </Label>
              <Input
                id="gate-shopName"
                name="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t("shopName.placeholder")}
                aria-invalid={!!errors.shopName}
              />
              {errors.shopName && <p className="text-error text-xs">{errors.shopName}</p>}
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-category" className="text-xs font-medium">
                {t("category.label")}
              </Label>
              <Select value={category} onValueChange={(val) => setCategory(val as BusinessCategory)}>
                <SelectTrigger id="gate-category" aria-invalid={!!errors.category}>
                  <SelectValue placeholder={t("category.label")} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {tCat(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-error text-xs">{errors.category}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-phone" className="text-xs font-medium">
                {t("phone.label")}
              </Label>
              <div className="relative flex rounded-md">
                <span className="border-hairline bg-surface-elevated text-text-muted inline-flex items-center rounded-l-md border border-r-0 px-3 font-mono text-xs select-none">
                  +94
                </span>
                <Input
                  id="gate-phone"
                  name="phone"
                  type="tel"
                  data-ph-no-capture="true"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="77 123 4567"
                  className="rounded-l-none"
                  aria-invalid={!!errors.phone}
                />
              </div>
              <p className="text-text-muted text-[11px]">{t("phone.help")}</p>
              {errors.phone && <p className="text-error text-xs">{errors.phone}</p>}
            </div>

            {/* WhatsApp Number (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gate-whatsapp" className="text-xs font-medium">
                  {t("whatsapp.label")}
                </Label>
                <label className="text-text-muted hover:text-text flex cursor-pointer items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="accent-primary size-3.5 rounded"
                  />
                  <span>{t("whatsapp.same")}</span>
                </label>
              </div>
              {!sameAsPhone && (
                <div className="relative flex rounded-md">
                  <span className="border-hairline bg-surface-elevated text-text-muted inline-flex items-center rounded-l-md border border-r-0 px-3 font-mono text-xs select-none">
                    +94
                  </span>
                  <Input
                    id="gate-whatsapp"
                    name="whatsapp"
                    type="tel"
                    data-ph-no-capture="true"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="77 123 4567"
                    className="rounded-l-none"
                    aria-invalid={!!errors.whatsapp}
                  />
                </div>
              )}
              {errors.whatsapp && <p className="text-error text-xs">{errors.whatsapp}</p>}
            </div>

            {/* Sticky Action Footer on Mobile */}
            <div className="border-hairline bg-surface/95 sticky bottom-0 -mx-5 mt-4 -mb-5 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                <span>{t("s1.cta")}</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Location and Consent */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-display text-text text-xl font-bold sm:text-2xl">{t("s2.title")}</h2>
            </div>

            {/* District & City Dropdowns */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gate-district" className="text-xs font-medium">
                  {t("district.label")}
                </Label>
                <Select value={district} onValueChange={(val) => handleDistrictChange(val as District)}>
                  <SelectTrigger id="gate-district">
                    <SelectValue placeholder={t("district.label")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {tDist(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.district && <p className="text-error text-xs">{errors.district}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gate-city" className="text-xs font-medium">
                  {t("city.label")}
                </Label>
                <Input
                  id="gate-city"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pettah"
                  aria-invalid={!!errors.city}
                />
                {errors.city && <p className="text-error text-xs">{errors.city}</p>}
              </div>
            </div>

            {/* MiniMap Interactive Sri Lanka Map */}
            <MiniMap
              lat={lat}
              lng={lng}
              onChange={({ lat: newLat, lng: newLng, source }) => {
                setLat(newLat);
                setLng(newLng);
                setLocationSource(source);
              }}
              error={errors.lat || errors.lng}
            />

            {/* Public Map Opt-in Checkbox (Defaults to False) */}
            <div className="border-hairline bg-surface-elevated rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  id="gate-public"
                  checked={isPublicOnMap}
                  onCheckedChange={(checked) => setIsPublicOnMap(checked === true)}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <span className="text-text block font-semibold">{t("public.label")}</span>
                  <span className="text-text-muted mt-0.5 block leading-relaxed">{t("public.help")}</span>
                </div>
              </label>
            </div>

            {/* Terms & As-is Statement Checkbox (Required) */}
            <div className="border-hairline bg-surface-elevated rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  id="gate-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                  aria-invalid={!!errors.termsAccepted}
                />
                <div className="text-xs">
                  <span className="text-text block leading-relaxed">{t("terms.label")}</span>
                  <div className="text-azure-text mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <a
                      href={`/${locale}/legal/terms`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {t("terms.termsLink")}
                    </a>
                    <span>·</span>
                    <a
                      href={`/${locale}/legal/tax-disclaimer`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {t("terms.taxLink")}
                    </a>
                    <span>·</span>
                    <a
                      href={`/${locale}/legal/data-safety`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {t("terms.dataSafetyLink")}
                    </a>
                    <span>·</span>
                    <a
                      href={`/${locale}/legal/privacy`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {t("terms.privacyLink")}
                    </a>
                  </div>
                </div>
              </label>
              {errors.termsAccepted && <p className="text-error mt-2 text-xs">{errors.termsAccepted}</p>}
            </div>

            {/* Bot Defense Turnstile Widget */}
            <TurnstileWidget onToken={(token) => setTurnstileToken(token)} action="gate" />

            {/* Sticky Action Footer on Mobile */}
            <div className="border-hairline bg-surface/95 sticky bottom-0 -mx-5 mt-4 -mb-5 flex items-center justify-between gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="size-4" />
                <span>{t("s2.back")}</span>
              </Button>

              <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="flex-1">
                <Download className="size-4" />
                <span>{isSubmitting ? t("s2.submitting") : t("s2.cta")}</span>
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3 ("done"): What Next View */}
        {step === "done" && <WhatNextView data={downloadResult} onClose={closeGate} />}
      </div>
    );
  };

  if (!isOpen) return null;

  // Desktop view: Radix Dialog (560px wide, #252526 bg-surface)
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeGate()}>
        <DialogContent
          className="bg-surface border-hairline max-h-[90vh] max-w-[560px] overflow-y-auto p-6 shadow-2xl"
          showCloseButton={false}
          data-lenis-prevent
        >
          <DialogTitle className="sr-only">CB POS Download Gate</DialogTitle>
          <DialogDescription className="sr-only">
            Download gate modal to access CB POS installer
          </DialogDescription>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile view: Vaul Drawer covering 92% height
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeGate()}>
      <DrawerContent
        className="bg-surface border-hairline max-h-[92vh] overflow-y-auto p-5 pb-8 outline-none"
        data-lenis-prevent
      >
        <DrawerTitle className="sr-only">CB POS Download Gate</DrawerTitle>
        <DrawerDescription className="sr-only">
          Download gate modal to access CB POS installer
        </DrawerDescription>
        {renderContent()}
      </DrawerContent>
    </Drawer>
  );
}
