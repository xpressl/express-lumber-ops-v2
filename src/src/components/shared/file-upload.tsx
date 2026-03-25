"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept,
  maxSizeMB = 10,
  multiple = false,
  onFilesSelected,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function validateFiles(files: FileList | File[]): File[] {
    const valid: File[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (file.size > maxBytes) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      valid.push(file);
    }

    return valid;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      setError(null);
      onFilesSelected(multiple ? files : files.slice(0, 1));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = validateFiles(e.target.files);
    if (files.length > 0) {
      setError(null);
      onFilesSelected(multiple ? files : files.slice(0, 1));
    }
    e.target.value = "";
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-border hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Drag & drop file{multiple ? "s" : ""} here, or
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Browse Files
        </Button>
        <p className="text-xs text-muted-foreground font-mono">
          {accept ? `Accepted: ${accept}` : "All file types"} &middot; Max {maxSizeMB}MB
        </p>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
