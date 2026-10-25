"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { updateLanguage } from "../api";
import type { MerchantListing } from "../types";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { Globe, User, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

interface SettingsTabProps {
  locale: string;
  listing: MerchantListing;
  copy: {
    language: string;
    deleteTitle: string;
    deleteBody: string;
    deleteConfirm: string;
    deleteCta: string;
  };
}

export function SettingsTab({ locale, listing, copy }: SettingsTabProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [langLoading, setLangLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleLanguageChange = async (newLocale: string) => {
    setSelectedLocale(newLocale);
    setLangLoading(true);
    try {
      await updateLanguage(newLocale);
      toast.success("Language preference updated");
      router.push(`/${newLocale}/dashboard/settings`);
      router.refresh();
    } catch {
      toast.error("Failed to update language");
    } finally {
      setLangLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-foreground text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Manage your account preferences and merchant data retention.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-card border-border space-y-4 rounded-lg border p-6">
        <div className="border-border flex items-center gap-3 border-b pb-4">
          <div className="bg-secondary text-foreground flex h-9 w-9 items-center justify-center rounded-full">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">Account Profile</h3>
            <p className="text-muted-foreground font-mono text-xs">{session?.user?.email ?? listing.phone}</p>
          </div>
        </div>

        {/* Language Preference */}
        <div>
          <label
            htmlFor="language-select"
            className="text-muted-foreground mb-2 block flex items-center gap-2 font-mono text-xs tracking-wider uppercase"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{copy.language}</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            {[
              { id: "en", label: "English" },
              { id: "si", label: "සිංහල (Sinhala)" },
              { id: "ta", label: "தமிழ் (Tamil)" },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageChange(lang.id)}
                disabled={langLoading}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded border px-4 py-2.5 text-xs font-medium transition ${
                  selectedLocale === lang.id
                    ? "bg-secondary text-foreground border-cyan-400 font-semibold"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <span>{lang.label}</span>
                {selectedLocale === lang.id && <Check className="h-3.5 w-3.5 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border-destructive/40 space-y-4 rounded-lg border p-6">
        <div className="text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-foreground text-sm font-bold">{copy.deleteTitle}</h3>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">{copy.deleteBody}</p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="border-destructive/60 hover:bg-destructive/10 text-destructive cursor-pointer rounded border px-4 py-2 text-xs font-medium transition"
          >
            {copy.deleteCta}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        locale={locale}
        expectedShopName={listing.shopName}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        copy={{
          title: copy.deleteTitle,
          body: copy.deleteBody,
          confirm: copy.deleteConfirm,
          cta: copy.deleteCta,
        }}
      />
    </div>
  );
}
