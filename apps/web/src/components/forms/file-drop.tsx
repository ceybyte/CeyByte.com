"use client";

import { AlertCircle, FileText, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type FileDropState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; fileName: string }
  | { status: "done"; fileName: string }
  | { status: "error"; message: string };

type FileDropProps = {
  accept: string; // e.g. "image/jpeg,image/png,application/pdf"
  state: FileDropState;
  onFile: (file: File) => void;
  labels: { prompt: string; hint: string; replace: string; uploading: string };
  className?: string;
};

// 03-DESIGN §8.2. A real <button> opens the picker, so Enter/Space work without extra handlers.
export function FileDrop({ accept, state, onFile, labels, className }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      data-ph-no-capture
      className={cn(
        "border-hairline relative flex min-h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center transition-colors",
        over && "border-azure-text bg-surface-elevated",
        state.status === "error" && "border-error",
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => take(e.target.files)}
      />

      {state.status === "uploading" ? (
        <>
          <p className="text-text text-sm">
            {labels.uploading} <span className="font-mono">{Math.round(state.progress)}%</span>
          </p>
          <div className="bg-surface-elevated h-0.5 w-full max-w-xs overflow-hidden rounded-full">
            <div
              className="h-full origin-left transition-transform duration-200 ease-out [background:var(--azure-gradient)]"
              style={{ transform: `scaleX(${state.progress / 100})` }}
            />
          </div>
        </>
      ) : state.status === "done" ? (
        <p className="text-text inline-flex items-center gap-2 text-sm">
          <FileText aria-hidden strokeWidth={1.5} className="text-muted size-5" />
          <span className="font-mono">{state.fileName}</span>
        </p>
      ) : (
        <UploadCloud aria-hidden strokeWidth={1.5} className="text-muted size-6" />
      )}

      {state.status !== "uploading" && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="text-azure-text cursor-pointer text-sm font-medium underline-offset-4 hover:underline"
        >
          {state.status === "done" ? labels.replace : labels.prompt}
        </button>
      )}
      {state.status === "error" ? (
        <p role="alert" className="text-error inline-flex items-center gap-1.5 text-xs">
          <AlertCircle aria-hidden className="size-3.5" />
          {state.message}
        </p>
      ) : (
        <p className="text-muted text-xs">{labels.hint}</p>
      )}
    </div>
  );
}
