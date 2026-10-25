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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-card border border-destructive/40 rounded-lg max-w-md w-full p-6 text-left shadow-2xl">
        <div className="flex items-center gap-3 text-destructive mb-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{copy.title}</h3>
            <span className="text-[11px] font-mono text-destructive">Irreversible action</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {copy.body}
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label
              htmlFor="confirm-shop-input"
              className="block text-xs uppercase font-mono tracking-wider text-muted-foreground mb-1.5"
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
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-destructive font-mono"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 border border-border rounded text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isMatch}
              className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/40 rounded text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{copy.cta}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
