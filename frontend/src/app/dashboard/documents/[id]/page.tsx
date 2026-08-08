"use client";

import DocumentFormDialog from "@/components/documents/DocumentFormDialog";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import { ApiService } from "@/lib/api";
import {
  ImportantDocument,
  docTypeLabel,
  expiryBadge,
  formatDate,
  formatFileSize,
} from "@/lib/documents";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Extensions the browser can show inline; everything else gets a download card. */
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

export default function DocumentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  const toast = useToast();
  const confirm = useConfirm();

  const [doc, setDoc] = useState<ImportantDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ApiService.getImportantDocument(documentId);
      setDoc(data as ImportantDocument);
    } catch (err) {
      console.error("Error loading document:", err);
      setError("কাগজটা পাওয়া যায়নি। হয়তো মুছে ফেলা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) load();
  }, [documentId, load]);

  const handleDelete = async () => {
    if (!doc) return;
    const ok = await confirm({
      title: "কাগজটা ডিলিট করবেন?",
      message: `"${doc.title}" আর ফাইলটা দুটোই মুছে যাবে। এটা ফেরানো যাবে না।`,
      confirmLabel: "ডিলিট করুন",
      danger: true,
    });
    if (!ok) return;
    try {
      await ApiService.deleteImportantDocument(doc.id);
      toast.success("কাগজটা মুছে ফেলা হয়েছে");
      router.push("/dashboard/documents");
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("ডিলিট করা যায়নি");
    }
  };

  const handleTogglePin = async () => {
    if (!doc) return;
    try {
      const updated = await ApiService.toggleImportantDocumentPin(doc.id);
      setDoc(updated as ImportantDocument);
      toast.success(
        (updated as ImportantDocument).is_pinned
          ? "উপরে পিন করা হয়েছে"
          : "পিন খুলে দেওয়া হয়েছে"
      );
    } catch (err) {
      console.error("Error pinning document:", err);
      toast.error("পিন করা যায়নি");
    }
  };

  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">লোড হচ্ছে…</h1>
            <p className="page-sub">কাগজের তথ্য আনা হচ্ছে</p>
          </div>
        </header>
        <div className="plane">
          <div className="plane-section space-y-3">
            <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কাগজটা নাই</h1>
            <p className="page-sub">{error}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="btn btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            তালিকায় ফিরে যান
          </button>
        </header>
        <div className="plane">
          <div className="plane-section">
            <div className="empty">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const badge = expiryBadge(doc);
  const isImage = IMAGE_EXTENSIONS.includes(doc.extension);
  const isPdf = doc.extension === "pdf";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "কাগজের টাইপ", value: doc.doc_type_display || docTypeLabel(doc.doc_type) },
    { label: "লাইসেন্স / সার্টিফিকেট নম্বর", value: doc.reference_number || "—" },
    { label: "কে দিয়েছে", value: doc.issued_by || "—" },
    { label: "ইস্যুর তারিখ", value: formatDate(doc.issue_date) },
    {
      label: "মেয়াদ শেষ",
      value: (
        <span className="flex flex-wrap items-center justify-end gap-2">
          {formatDate(doc.expiry_date)}
          <span className={badge.className}>{badge.label}</span>
        </span>
      ),
    },
    {
      label: "ফাইল",
      value: `${doc.file_name ?? "—"}${
        doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""
      }`,
    },
    { label: "কে রেখেছে", value: doc.uploaded_by_name || "—" },
    { label: "কবে রাখা হয়েছে", value: formatDate(doc.created_at) },
    { label: "শেষ আপডেট", value: formatDate(doc.updated_at) },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div className="min-w-0">
          <h1 className="page-title truncate" title={doc.title}>
            {doc.title}
          </h1>
          <p className="page-sub">
            {[doc.doc_type_display || docTypeLabel(doc.doc_type), doc.reference_number]
              .filter(Boolean)
              .join(" · ") || "কাগজের বিস্তারিত"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="btn btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </button>
          <button onClick={handleTogglePin} className="btn btn-ghost" title="পিন">
            <Pin className={`h-4 w-4 ${doc.is_pinned ? "text-cyan-600" : ""}`} />
            <span className="hidden sm:inline">
              {doc.is_pinned ? "পিন খুলুন" : "পিন করুন"}
            </span>
          </button>
          <button onClick={() => setShowEdit(true)} className="btn btn-primary">
            <Pencil className="h-4 w-4" />
            এডিট করুন
          </button>
        </div>
      </header>

      <div className="plane">
        {/* Expiry is the headline — a shopkeeper opens this page to answer
            "is this still valid?" before anything else. */}
        <div className="plane-section flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarClock className="h-4 w-4 text-slate-400" />
            {doc.expiry_date
              ? `মেয়াদ শেষ ${formatDate(doc.expiry_date)}`
              : "এই কাগজের কোনো মেয়াদ নাই"}
          </span>
          <span className={badge.className}>{badge.label}</span>
        </div>

        {/* Preview */}
        <div className="plane-section">
          <div className="section-title">কাগজটা</div>
          {!doc.file_url ? (
            <div className="empty mt-2">ফাইলটা পাওয়া যাচ্ছে না</div>
          ) : isImage ? (
            <div className="relative mt-2 h-[26rem] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <Image
                src={doc.file_url}
                alt={doc.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={doc.file_url}
              title={doc.title}
              className="mt-2 h-[32rem] w-full rounded-lg border border-slate-200 bg-slate-50"
            />
          ) : (
            /* Word, Excel, txt — the browser cannot render these inline, so
               offer the file instead of an empty grey box. */
            <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <FileText className="h-10 w-10 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-slate-700">
                  {doc.file_name}
                </div>
                <div className="text-xs text-slate-500">
                  {doc.extension.toUpperCase()} · {formatFileSize(doc.file_size)}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                এই ধরনের ফাইল ব্রাউজারে দেখা যায় না — নামিয়ে দেখুন
              </p>
            </div>
          )}

          {doc.file_url && (
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={doc.file_url}
                download={doc.file_name ?? undefined}
                className="btn btn-primary btn-sm"
              >
                <Download className="h-4 w-4" />
                নামিয়ে নিন
              </a>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink className="h-4 w-4" />
                নতুন ট্যাবে খুলুন
              </a>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="plane-section">
          <div className="section-title">কাগজের তথ্য</div>
          <dl className="mt-1 divide-y divide-slate-200">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 py-2.5"
              >
                <dt className="text-sm text-slate-500">{row.label}</dt>
                <dd className="text-right text-sm text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {doc.notes && (
          <div className="plane-section">
            <div className="section-title">নোট</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {doc.notes}
            </p>
          </div>
        )}

        <div className="plane-section">
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 className="h-4 w-4" />
            এই কাগজটা ডিলিট করুন
          </button>
        </div>
      </div>

      <DocumentFormDialog
        open={showEdit}
        document={doc}
        onClose={() => setShowEdit(false)}
        onSaved={(saved) => {
          setShowEdit(false);
          // Use the response directly so the page updates without a refetch.
          setDoc(saved);
        }}
      />
    </div>
  );
}
