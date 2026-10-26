"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SlipDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  copy: {
    label: string;
    help: string;
    drag: string;
    uploaded: string;
    uploading?: string;
  };
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".pdf"];

export function SlipDropzone({ file, onFileSelect, copy, disabled = false }: SlipDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (selectedFile: File) => {
    setError(null);

    // AC-11.1 Client-side check
    if (selectedFile.size > MAX_BYTES) {
      setError("File exceeds maximum allowed size of 5 MB.");
      return;
    }

    const ext = "." + (selectedFile.name.split(".").pop()?.toLowerCase() || "");
    const isValidType = ALLOWED_TYPES.includes(selectedFile.type) || ALLOWED_EXTS.includes(ext);

    if (!isValidType) {
      setError("Only JPG, PNG and PDF files are allowed.");
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-2">
      <label className="text-text text-sm font-semibold">{copy.label}</label>

      {file ? (
        <div className="border-gold/40 bg-gold/5 flex items-center justify-between rounded-lg border p-4 transition-all">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-gold/20 text-gold flex size-10 shrink-0 items-center justify-center rounded-md">
              {file.type === "application/pdf" ? (
                <FileText className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-text truncate text-sm font-medium">{file.name}</p>
              <p className="text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="text-muted hover:text-text size-8"
            aria-label="Remove slip"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragOver
              ? "border-gold bg-gold/5"
              : "border-hairline hover:border-hairline-elevated bg-surface/40 hover:bg-surface/70"
          } ${disabled ? "pointer-events-none opacity-50" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />
          <UploadCloud className="text-muted/60 size-9" />
          <p className="text-text mt-2 text-sm font-medium">{copy.drag}</p>
          <p className="text-muted mt-1 text-xs">{copy.help}</p>
        </div>
      )}

      {error && (
        <div className="text-error flex items-center gap-1.5 text-xs font-medium">
          <AlertCircle className="size-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
