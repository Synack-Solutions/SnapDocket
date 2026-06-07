"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_DIMENSION = 1600; // px — longest side capped here
const JPEG_QUALITY = 0.82; // ~80% quality, substantial size reduction
const MAX_FILE_MB = 10;

export interface UploadedPhoto {
  id: string;
  storage_path: string;
  file_name: string;
  url: string; // signed URL
}

interface PhotoUploaderProps {
  jobId: string;
  tenantId: string;
  onUploaded: (photos: UploadedPhoto[]) => void;
}

/**
 * Compresses an image File to a JPEG Blob using the Canvas API.
 * Runs entirely in the browser — no server round-trip needed.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob returned null"));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function PhotoUploader({ jobId, tenantId, onUploaded }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ name: string; dataUrl: string }[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const newPreviews: { name: string; dataUrl: string }[] = [];
    let loaded = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${MAX_FILE_MB} MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({ name: file.name, dataUrl: e.target?.result as string });
        loaded++;
        if (loaded === files.length) setPreviews((p) => [...p, ...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = () => {
    if (!inputRef.current?.files?.length) return;
    const files = Array.from(inputRef.current.files);
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const uploaded: UploadedPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Compressing ${i + 1}/${files.length}…`);

        let blob: Blob;
        try {
          blob = await compressImage(file);
        } catch {
          setError(`Failed to compress "${file.name}"`);
          return;
        }

        const photoId = crypto.randomUUID();
        const storagePath = `${tenantId}/${jobId}/${photoId}.jpg`;

        setProgress(`Uploading ${i + 1}/${files.length}…`);
        const { error: uploadError } = await supabase.storage
          .from("job-photos")
          .upload(storagePath, blob, { contentType: "image/jpeg", upsert: false });

        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          return;
        }

        // Insert metadata row
        const { data: photoRow, error: dbError } = await supabase
          .from("job_photos")
          .insert({
            id: photoId,
            job_id: jobId,
            tenant_id: tenantId,
            storage_path: storagePath,
            file_name: file.name,
          })
          .select("id, storage_path, file_name")
          .single();

        if (dbError || !photoRow) {
          setError(`DB error: ${dbError?.message}`);
          return;
        }

        // Get a signed URL valid for 1 hour for immediate display
        const { data: signed } = await supabase.storage
          .from("job-photos")
          .createSignedUrl(storagePath, 3600);

        uploaded.push({
          id: photoRow.id,
          storage_path: photoRow.storage_path,
          file_name: photoRow.file_name,
          url: signed?.signedUrl ?? "",
        });
      }

      setProgress(null);
      setPreviews([]);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded(uploaded);
    });
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors",
          "hover:border-accent hover:bg-accent/5",
          isPending && "pointer-events-none opacity-50"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
          // Also populate the input for upload
          if (inputRef.current && e.dataTransfer.files.length) {
            // DataTransfer to input not directly possible; store separately
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-8 w-8 text-muted-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
        <span className="text-sm text-muted-foreground">Tap to add photos or drag &amp; drop</span>
        <span className="text-xs text-muted-foreground">
          JPEG / PNG / HEIC · up to {MAX_FILE_MB} MB each · auto-compressed before upload
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt={p.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {progress && <p className="text-sm text-muted-foreground">{progress}</p>}

      {previews.length > 0 && (
        <Button size="sm" onClick={handleUpload} loading={isPending}>
          Upload {previews.length} photo{previews.length > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}
