"use client";

import { useState } from "react";
import { FileText, Trash2, Upload, ExternalLink } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useToast, useConfirm } from "@/components/ui/Feedback";
import {
  DOCUMENT_TYPES,
  VehicleDocument,
  documentTypeLabel,
} from "@/lib/vehicles";

interface Props {
  vehicleId: number;
  documents: VehicleDocument[];
  onChange: (documents: VehicleDocument[]) => void;
  /** Read-only mode for the customer profile, where papers are shown but not managed. */
  readOnly?: boolean;
}

const MAX_FILE_MB = 10;

/**
 * Papers belonging to one vehicle — registration, tax token, and the
 * কাগজ প্রাপ্তি স্বীকারোক্তি that records the date the shop handed the papers over.
 *
 * Used by both the vehicle detail page and the customer profile tab, so the
 * upload rules and labels only exist once.
 */
export default function VehicleDocuments({
  vehicleId,
  documents,
  onChange,
  readOnly = false,
}: Props) {
  const toast = useToast();
  const confirm = useConfirm();

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("papers_receipt");
  const [title, setTitle] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setReceivedDate("");
    setDocType("papers_receipt");
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("আগে একটা ফাইল সিলেক্ট করুন");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`ফাইলটা ${MAX_FILE_MB} এমবির বেশি বড় হতে পারবে না`);
      return;
    }

    setUploading(true);
    try {
      const created = await ApiService.uploadVehicleDocument(vehicleId, {
        file,
        doc_type: docType,
        title: title.trim() || undefined,
        received_date: receivedDate || undefined,
      });
      onChange([created, ...documents]);
      resetForm();
      toast.success("কাগজটা আপলোড হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "আপলোড করা গেল না");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: VehicleDocument) => {
    const ok = await confirm({
      title: "কাগজটা মুছে দেবেন?",
      message: "একবার মুছে ফেললে ফাইলটা আর ফেরানো যাবে না।",
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(document.id);
    try {
      await ApiService.deleteVehicleDocument(vehicleId, document.id);
      onChange(documents.filter((d) => d.id !== document.id));
      toast.success("কাগজটা মুছে দেওয়া হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছে দেওয়া গেল না");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {!readOnly && (
        <div className="plane-section">
          <div className="section-title">নতুন কাগজ আপলোড</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">কিসের কাগজ</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="select"
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">কবে পাওয়া গেছে</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">নাম (ইচ্ছে হলে)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="যেমন: বিআরটিএ রসিদ"
              />
            </div>
            <div>
              <label className="label">ফাইল</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input h-auto py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              ছবি বা পিডিএফ দিতে পারবেন, সর্বোচ্চ {MAX_FILE_MB} এমবি।
            </p>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file}
              className="btn btn-primary btn-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "আপলোড হচ্ছে…" : "আপলোড করুন"}
            </button>
          </div>
        </div>
      )}

      <div className="plane-section">
        <div className="section-title">আপলোড করা কাগজ ({documents.length})</div>
        {documents.length === 0 ? (
          <div className="empty">
            এখনো কোনো কাগজ আপলোড করা হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {doc.title || documentTypeLabel(doc.doc_type)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {documentTypeLabel(doc.doc_type)}
                      {doc.received_date
                        ? ` · পাওয়া গেছে ${new Date(doc.received_date).toLocaleDateString("bn-BD")}`
                        : ""}
                      {doc.file_name ? ` · ${doc.file_name}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      দেখুন
                    </a>
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      aria-label="কাগজটা মুছে দিন"
                      title="মুছে দিন"
                      className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
