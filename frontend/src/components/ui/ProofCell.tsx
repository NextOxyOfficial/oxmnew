"use client";

import { useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

/**
 * The paper behind a money row — a purchase invoice, a payment receipt.
 *
 * Both the model and the create form already accepted a file, but once a row
 * existed there was no way to attach one, and no way to remove a wrong scan.
 * In practice a shop pays first and gets the receipt afterwards, so "attach it
 * later" is the normal case, not the exception.
 *
 * The cell shows three states and nothing else: no paper (attach), busy, and
 * attached (open / replace / remove). Replace rather than stack, because one
 * payment has one receipt and a list of near-identical scans helps nobody.
 */

const ACCEPT = "image/*,application/pdf";
/** The server refuses larger; checking here saves a pointless round trip. */
const MAX_MB = 10;

export default function ProofCell({
  url,
  onUpload,
  onRemove,
  readOnly = false,
}: {
  url: string | null | undefined;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  readOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPdf = Boolean(url && url.toLowerCase().split("?")[0].endsWith(".pdf"));

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await job();
    } catch {
      setError("কাজটা হয়নি, আবার চেষ্টা করুন");
    } finally {
      setBusy(false);
    }
  };

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`ফাইল ${MAX_MB}MB-এর বেশি হওয়া যাবে না`);
      return;
    }
    run(() => onUpload(file));
  };

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        হচ্ছে…
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          // Cleared so picking the same file twice still fires a change.
          event.target.value = "";
        }}
      />

      {url ? (
        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
            title="কাগজটা দেখুন"
          >
            {isPdf ? (
              <FileText className="h-3.5 w-3.5" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {isPdf ? "PDF" : "ছবি"}
          </a>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title="অন্য কাগজ দিন"
                aria-label="অন্য কাগজ দিন"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => run(onRemove)}
                title="কাগজটা সরিয়ে দিন"
                aria-label="কাগজটা সরিয়ে দিন"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ) : readOnly ? (
        <span className="text-xs text-slate-400">কাগজ নেই</span>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 transition-colors hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700"
        >
          <Upload className="h-3.5 w-3.5" />
          কাগজ দিন
        </button>
      )}

      {error && <span className="text-[11px] text-rose-600">{error}</span>}
    </div>
  );
}
