"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const IMPORT_TYPES = [
  { value: "CUSTOMERS", label: "Customer Database" },
  { value: "PRODUCTS", label: "Product Catalog" },
  { value: "VENDOR_PRICES", label: "Price List" },
  { value: "ORDERS", label: "Orders" },
  { value: "INVOICES", label: "Invoices" },
  { value: "AR_AGING", label: "AR Aging" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "QUOTES", label: "Quotes" },
] as const;

const ACCEPTED_EXTENSIONS = ".pdf,.csv,.xlsx,.xls";
const ACCEPTED_MIME = new Set([
  "application/pdf", "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }

/** File upload dialog with drag-and-drop for the Import Bridge. */
export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [importType, setImportType] = React.useState<string>("");
  const [status, setStatus] = React.useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setImportType("");
    setStatus("idle");
    setErrorMsg("");
    setIsDragOver(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function validateFile(f: File): string | null {
    if (!ACCEPTED_MIME.has(f.type) && !f.name.match(/\.(pdf|csv|xlsx|xls)$/i))
      return "Unsupported file type. Please upload PDF, CSV, XLSX, or XLS.";
    if (f.size > 50 * 1024 * 1024) return "File too large. Maximum size is 50 MB.";
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) { setErrorMsg(err); return; }
    setErrorMsg("");
    setFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragOver(true); }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDragOver(false); }
  function removeFile() { setFile(null); setErrorMsg(""); }

  async function handleSubmit() {
    if (!file || !importType) return;

    setStatus("uploading");
    setErrorMsg("");

    try {
      // Read file as base64 data URL for the fileUrl field.
      // In production this would upload to blob storage first.
      const fileUrl = await readFileAsDataUrl(file);

      const res = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          fileName: file.name,
          fileUrl,
          locationId: "default",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }

      setStatus("success");
      // Brief delay so user sees success state before closing
      setTimeout(() => {
        handleOpenChange(false);
        onSuccess();
      }, 1200);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const canSubmit = file !== null && importType !== "" && status === "idle";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Import</DialogTitle>
          <DialogDescription>
            Upload a file to import data into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import type selector */}
          <div className="space-y-1.5">
            <Label htmlFor="import-type">Import Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger className="w-full" id="import-type">
                <SelectValue placeholder="Select what you're importing..." />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone / file preview */}
          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
                p-8 text-center cursor-pointer transition-colors
                ${isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
                }
              `}
            >
              <Upload className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {isDragOver ? "Drop file here" : "Click to browse or drag & drop"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, CSV, XLSX, XLS up to 50 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleInputChange}
                className="hidden"
                aria-label="Upload import file"
              />
            </div>
          ) : (
            <FilePreview file={file} onRemove={removeFile} disabled={status !== "idle"} />
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success message */}
          {status === "success" && (
            <div className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Import created successfully. Processing will begin shortly.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={status === "uploading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="gap-2"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Start Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Shows the selected file with name, size, and a remove button. */
function FilePreview({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled: boolean }) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
  const sizeStr = file.size < 1024
    ? `${file.size} B`
    : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <FileText className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{ext} &middot; {sizeStr}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove file"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/** Read a File as a base64 data URL string. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
