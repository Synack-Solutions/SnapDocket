"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  taken_at: string;
  url: string; // signed URL
}

interface JobPhotoGalleryProps {
  jobId: string;
  tenantId: string;
  initialPhotos: Photo[];
  canUpload: boolean; // false for completed+read-only viewers
}

export function JobPhotoGallery({
  jobId,
  tenantId,
  initialPhotos,
  canUpload,
}: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUploaded = (uploaded: UploadedPhoto[]) => {
    const newPhotos: Photo[] = uploaded.map((u) => ({
      id: u.id,
      storage_path: u.storage_path,
      file_name: u.file_name,
      caption: null,
      taken_at: new Date().toISOString(),
      url: u.url,
    }));
    setPhotos((prev) => [...newPhotos, ...prev]);
  };

  const handleDelete = (photo: Photo) => {
    setDeleting(photo.id);
    startTransition(async () => {
      const supabase = createClient();
      await supabase.storage.from("job-photos").remove([photo.storage_path]);
      await supabase.from("job_photos").delete().eq("id", photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (lightbox?.id === photo.id) setLightbox(null);
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-4">
      {canUpload && <PhotoUploader jobId={jobId} tenantId={tenantId} onUploaded={handleUploaded} />}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.file_name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.file_name}
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 rounded-b-xl bg-black/60 px-4 py-2 text-sm text-white">
              <span className="truncate">{lightbox.caption ?? lightbox.file_name}</span>
              <div className="flex shrink-0 gap-2">
                {canUpload && (
                  <button
                    onClick={() => handleDelete(lightbox)}
                    disabled={isPending && deleting === lightbox.id}
                    className={cn(
                      "rounded px-3 py-1 text-xs font-medium transition-colors",
                      "bg-destructive/80 hover:bg-destructive disabled:opacity-50"
                    )}
                  >
                    {deleting === lightbox.id ? "Deleting…" : "Delete"}
                  </button>
                )}
                <button
                  onClick={() => setLightbox(null)}
                  className="rounded px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
