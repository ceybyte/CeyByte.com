"use client";

import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<React.ComponentProps<"input">, "type" | "value" | "onChange" | "inputMode"> & {
  /** Nine national digits without the leading 0, e.g. "771234567". */
  value: string;
  onChange: (digits: string) => void;
  invalid?: boolean;
};

// Shows "77 123 4567"; accepts pasted 07X…, +947X… or 947X… (03-DESIGN §8.2). E.164 normalisation and
// validation live in packages/shared (Phase 2); this only keeps the 9 national digits.
export function toNationalDigits(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const national = digits.startsWith("94")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return national.slice(0, 9);
}

function display(d: string) {
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
}

export function PhoneInput({ value, onChange, invalid, className, ...props }: PhoneInputProps) {
  return (
    <div
      className={cn(
        "border-hairline bg-surface focus-within:border-azure-text flex min-h-10 w-full overflow-hidden rounded-sm border transition-colors",
        invalid && "border-error",
        className,
      )}
    >
      <span
        aria-hidden
        className="border-hairline bg-surface-elevated text-muted flex items-center border-r px-3 font-mono text-sm"
      >
        +94
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        data-ph-no-capture
        aria-invalid={invalid || undefined}
        value={display(value)}
        onChange={(e) => onChange(toNationalDigits(e.target.value))}
        className="text-text placeholder:text-muted min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-base focus-visible:outline-none"
        {...props}
      />
    </div>
  );
}
