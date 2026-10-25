"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccount } from "../api";
import { toast } from "sonner";

interface DeleteAccountModalProps {
  locale: string;
  expectedShopName: string;
  isOpen: boolean;
  onClose: () => void;
  copy: {
    title: string;
    body: string;
    confirm: string;
    cta: string;
  };
}

export function DeleteAccountModal({
  locale,
  expectedShopName,
  isOpen,
  onClose,
  copy,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [typedName, setTypedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMatch = typedName.trim() === expectedShopName.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      await deleteAccount(typedName.trim());
      toast.success("Listing and account permanently deleted");
      router.push(`/${locale}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Deletion failed");
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="bg-card border-destructive/40 w-full max-w-md rounded-lg border p-6 text-left shadow-2xl">
        <div className="text-destructive mb-3 flex items-center gap-3">
          <div className="bg-destructive/10 border-destructive/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-base font-bold">{copy.title}</h3>
            <span className="text-destructive font-mono text-[11px]">Irreversible action</span>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">{copy.body}</p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-shop-input"
              className="text-muted-foreground mb-1.5 block font-mono text-xs tracking-wider uppercase"
            >
              {copy.confirm} (type <strong className="text-foreground">{expectedShopName}</strong>)
            </label>
            <input
              id="confirm-shop-input"
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={expectedShopName}
              required
              className="bg-background border-border text-foreground focus:border-destructive w-full rounded border px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-destructive bg-destructive/10 border-destructive/20 rounded border p-2 text-xs">
              {errorMsg}
            </p>
          )}

          <div className="border-border/60 flex justify-end gap-2.5 border-t pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="border-border text-muted-foreground hover:text-foreground cursor-pointer rounded border px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isMatch}
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 flex cursor-pointer items-center gap-2 rounded border px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{copy.cta}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
