"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { compressImages } from "@/lib/imageCompression";
import { useToast } from "@/components/ui/Feedback";

interface Props {
  photos: File[];
  onChange: (photos: File[]) => void;
  max?: number;
}

const MAX_FILE_MB = 10;

/**
 * Product photo picker with previews.
 *
 * Compression comes from the shared `lib/imageCompression` helper — this screen
 * used to carry its own private copy of the canvas-resize code, which meant the
 * edit screen and this one could drift apart on quality settings.
 */
export default function PhotoUploader({ photos, onChange, max = 8 }: Props) {
  const toast = useToast();
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!selected.length) return;

    const room = max - photos.length;
    if (room <= 0) {
      toast.error(`সর্বোচ্চ ${max} টা ছবি দেওয়া যাবে`);
      return;
    }

    const tooBig = selected.find((file) => file.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`প্রতিটা ছবি ${MAX_FILE_MB} এমবির কম হতে হবে`);
      return;
    }

    const accepted = selected.slice(0, room);
    if (accepted.length < selected.length) {
      toast.info(`প্রথম ${accepted.length} টা ছবি নেওয়া হয়েছে`);
    }

    setCompressing(true);
    try {
      const compressed = await compressImages(accepted);
      onChange([...photos, ...compressed]);
      setPreviews((prev) => [
        ...prev,
        ...compressed.map((file) => URL.createObjectURL(file)),
      ]);
    } catch {
      toast.error("ছবি ছোট করা গেল না");
    } finally {
      setCompressing(false);
    }
  };

  const handleRemove = (index: number) => {
    // Release the object URL, otherwise every removed preview leaks a blob.
    const url = previews[index];
    if (url) URL.revokeObjectURL(url);
    onChange(photos.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="label mb-0">প্রোডাক্টের ছবি</span>
        <span className="num text-xs text-slate-500">
          {photos.length}/{max}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-2">
        {previews.map((src, index) => (
          <div
            key={src}
            className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
          >
            <Image
              src={src}
              alt={`প্রোডাক্টের ছবি ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={`${index + 1} নম্বর ছবি সরিয়ে দিন`}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-rose-600 shadow-sm transition-opacity hover:bg-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <label
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-center transition-colors hover:border-cyan-400 hover:bg-slate-50 ${
              compressing ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <ImagePlus className="h-4 w-4 text-slate-400" />
            <span className="px-1 text-[10px] leading-tight text-slate-500">
              {compressing ? "ছোট হচ্ছে…" : "ছবি যোগ"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSelect}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        একসাথে কয়েকটা দিতে পারেন। আপলোডের আগে ছবি আপনাআপনি ছোট করে নেওয়া হয়।
      </p>
    </div>
  );
}
