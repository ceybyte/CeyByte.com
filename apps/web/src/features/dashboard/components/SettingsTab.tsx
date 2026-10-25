"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { updateLanguage } from "../api";
import { DeleteAccountModal } from "./DeleteAccountModal";
import type { MerchantListing } from "../types";
import { Globe, User, AlertTriangle, Check, Loader2 } from "lucide-react";
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
        <h2 className="text-xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account preferences and merchant data retention.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Account Profile</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {session?.user?.email ?? listing.phone}
            </p>
          </div>
        </div>

        {/* Language Preference */}
        <div>
          <label htmlFor="language-select" className="block text-xs uppercase font-mono tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>{copy.language}</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
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
                className={`px-4 py-2.5 rounded text-xs font-medium border flex items-center justify-between gap-2 transition cursor-pointer ${
                  selectedLocale === lang.id
                    ? "bg-secondary text-foreground border-cyan-400 font-semibold"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <span>{lang.label}</span>
                {selectedLocale === lang.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/40 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-sm font-bold text-foreground">{copy.deleteTitle}</h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {copy.deleteBody}
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 border border-destructive/60 hover:bg-destructive/10 text-destructive rounded text-xs font-medium transition cursor-pointer"
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
