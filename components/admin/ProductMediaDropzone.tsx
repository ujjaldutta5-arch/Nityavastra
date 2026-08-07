"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Image as ImageIcon, PlayCircle, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { compressImageIfNeeded } from "@/lib/imageCompress";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/types";

const MAX_IMAGES = 8;
const MAX_VIDEOS = 2;

type Props = {
  media: MediaItem[];
  coverUrl: string;
  onChange: (media: MediaItem[], coverUrl: string) => void;
};

export function ProductMediaDropzone({ media, coverUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const imageCount = media.filter((m) => m.kind === "image").length;
  const videoCount = media.filter((m) => m.kind === "video").length;

  const uploadFile = useCallback(
    async (file: File) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error("Only JPG/PNG/WEBP images or MP4/WebM videos");
        return;
      }
      if (isImage && imageCount >= MAX_IMAGES) {
        toast.error(`Max ${MAX_IMAGES} images`);
        return;
      }
      if (isVideo && videoCount >= MAX_VIDEOS) {
        toast.error(`Max ${MAX_VIDEOS} videos`);
        return;
      }

      setUploading(true);
      try {
        const prepared = isImage ? await compressImageIfNeeded(file) : file;
        const fd = new FormData();
        fd.append("file", prepared);
        fd.append("bucket", "products");
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        const kind = isVideo ? "video" : "image";
        const next = [...media, { kind, url: data.url as string }];
        const cover = coverUrl || (kind === "image" ? (data.url as string) : coverUrl);
        onChange(next, cover);
        toast.success(isVideo ? "Video uploaded" : "Image uploaded");
      } catch (e: unknown) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [media, coverUrl, onChange, imageCount, videoCount]
  );

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    for (const f of files) await uploadFile(f);
  };

  const removeAt = (idx: number) => {
    const next = media.filter((_, i) => i !== idx);
    const stillHasCover = next.some((m) => m.url === coverUrl);
    const newCover =
      stillHasCover && coverUrl
        ? coverUrl
        : next.find((m) => m.kind === "image")?.url || "";
    onChange(next, newCover);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= media.length) return;
    const next = [...media];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next, coverUrl);
  };

  const setCover = (url: string) => onChange(media, url);

  return (
    <div className="space-y-3" data-testid="product-media-dropzone">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-[#7C1F30] bg-[#7C1F30]/5" : "border-[#7C1F30]/25 bg-white"
        }`}
      >
        <ImageIcon className="mx-auto h-8 w-8 text-[#7C1F30]/60" />
        <p className="mt-2 text-sm text-[#57534E]">
          Drag & drop images/videos here, or click to browse
        </p>
        <p className="text-xs text-[#78716C] mt-1">
          Up to {MAX_IMAGES} images + {MAX_VIDEOS} videos · {imageCount}/{MAX_IMAGES} img ·{" "}
          {videoCount}/{MAX_VIDEOS} vid
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          multiple
          disabled={uploading}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const f of files) await uploadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {media.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {media.map((m, idx) => (
            <li
              key={`${m.url}-${idx}`}
              className={`relative rounded border bg-white overflow-hidden ${
                m.url === coverUrl ? "ring-2 ring-[#7C1F30]" : "border-[#7C1F30]/15"
              }`}
            >
              {m.kind === "video" ? (
                <div className="aspect-square flex items-center justify-center bg-[#FAF3E7]">
                  <PlayCircle className="h-8 w-8 text-[#7C1F30]" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="aspect-square object-cover w-full" />
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-0.5 bg-black/50 p-1">
                {m.kind === "image" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 px-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCover(m.url);
                    }}
                  >
                    Cover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    move(idx, -1);
                  }}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    move(idx, 1);
                  }}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(idx);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {uploading && <p className="text-xs text-[#57534E]">Uploading…</p>}
    </div>
  );
}
