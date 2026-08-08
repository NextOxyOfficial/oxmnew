"use client";

import { useToast } from "@/components/ui/Feedback";
import { ApiService } from "@/lib/api";
import {
  DOC_TYPES,
  ImportantDocument,
  formatFileSize,
  validateFile,
} from "@/lib/documents";
import { FileText, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Upload / edit dialog for জরুরি কাগজপত্র.
 *
 * Lives here rather than inside the list page because the detail page needs
 * the exact same form — two copies would drift the moment a field is added.
 */

const emptyForm = {
  title: "",
  doc_type: "trade_license",
  reference_number: "",
  issued_by: "",
  issue_date: "",
  expiry_date: "",
  notes: "",
};

type FormState = typeof emptyForm;

const formFor = (doc: ImportantDocument | null): FormState =>
  doc
    ? {
        title: doc.title,
        doc_type: doc.doc_type,
        reference_number: doc.reference_number || "",
        issued_by: doc.issued_by || "",
        issue_date: doc.issue_date || "",
        expiry_date: doc.expiry_date || "",
        notes: doc.notes || "",
      }
    : emptyForm;

export default function DocumentFormDialog({
  open,
  document: editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null → upload a new paper; a document → edit that one. */
  document: ImportantDocument | null;
  onClose: () => void;
  onSaved: (saved: ImportantDocument) => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload the fields every time the dialog opens, so a cancelled edit never
  // leaks its half-typed values into the next one.
  useEffect(() => {
    if (!open) return;
    setForm(formFor(editing));
    setFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, editing]);

  if (!open) return null;

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const pickFile = (picked: File | null) => {
    if (!picked) {
      setFile(null);
      return;
    }
    const problem = validateFile(picked);
    if (problem) {
      setFieldErrors((prev) => ({ ...prev, file: problem }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    setFile(picked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "কাগজের নাম লিখুন";
    // A new document needs a file; an edit keeps the one already stored.
    if (!editing && !file) errors.file = "ফাইল সিলেক্ট করুন";
    if (form.issue_date && form.expiry_date && form.expiry_date < form.issue_date) {
      errors.expiry_date = "মেয়াদ শেষের তারিখ ইস্যুর তারিখের আগে হতে পারে না";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("doc_type", form.doc_type);
    payload.append("reference_number", form.reference_number.trim());
    payload.append("issued_by", form.issued_by.trim());
    payload.append("notes", form.notes.trim());
    // Empty date strings must not be sent — DRF rejects "" for a DateField.
    if (form.issue_date) payload.append("issue_date", form.issue_date);
    if (form.expiry_date) payload.append("expiry_date", form.expiry_date);
    if (file) payload.append("file", file);

    setIsSaving(true);
    try {
      const saved = editing
        ? await ApiService.updateImportantDocument(editing.id, payload)
        : await ApiService.createImportantDocument(payload);
      toast.success(editing ? "কাগজের তথ্য আপডেট হয়েছে" : "কাগজ জমা হয়ে গেছে");
      onSaved(saved as ImportantDocument);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error(
        error instanceof Error ? error.message : "সেভ করা যায়নি, আবার চেষ্টা করুন"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">
            {editing ? "কাগজের তথ্য এডিট করুন" : "নতুন কাগজ রাখুন"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label" htmlFor="doc-title">
                কাগজের নাম <span className="text-rose-600">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="input"
                placeholder="যেমন: ট্রেড লাইসেন্স ২০২৬"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="doc-type">
                  কাগজের টাইপ
                </label>
                <select
                  id="doc-type"
                  value={form.doc_type}
                  onChange={(e) => setField("doc_type", e.target.value)}
                  className="select"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="doc-ref">
                  লাইসেন্স / সার্টিফিকেট নম্বর
                </label>
                <input
                  id="doc-ref"
                  type="text"
                  value={form.reference_number}
                  onChange={(e) => setField("reference_number", e.target.value)}
                  className="input"
                  placeholder="কাগজে যে নম্বরটা লেখা"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="doc-issuer">
                  কে দিয়েছে
                </label>
                <input
                  id="doc-issuer"
                  type="text"
                  value={form.issued_by}
                  onChange={(e) => setField("issued_by", e.target.value)}
                  className="input"
                  placeholder="যেমন: পৌরসভা"
                />
              </div>
              <div>
                <label className="label" htmlFor="doc-issue">
                  ইস্যুর তারিখ
                </label>
                <input
                  id="doc-issue"
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setField("issue_date", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="doc-expiry">
                  মেয়াদ শেষের তারিখ
                </label>
                <input
                  id="doc-expiry"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setField("expiry_date", e.target.value)}
                  className="input"
                />
                {fieldErrors.expiry_date ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors.expiry_date}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    মেয়াদ না থাকলে খালি রাখুন
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="doc-file">
                ফাইল {!editing && <span className="text-rose-600">*</span>}
              </label>
              <input
                id="doc-file"
                ref={fileInputRef}
                type="file"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="input h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
              {fieldErrors.file ? (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.file}</p>
              ) : file ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                  <Upload className="h-3.5 w-3.5" />
                  {file.name} · {formatFileSize(file.size)}
                </p>
              ) : editing ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <FileText className="h-3.5 w-3.5" />
                  এখন আছে: {editing.file_name} — নতুন ফাইল না দিলে এটাই থাকবে
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  পিডিএফ বা ছবি, সর্বোচ্চ ১০ এমবি
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="doc-notes">
                বাড়তি নোট
              </label>
              <textarea
                id="doc-notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="textarea"
                rows={2}
                placeholder="কিছু মনে রাখার থাকলে লিখুন…"
              />
            </div>
          </div>

          <div className="modal-foot">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isSaving}
            >
              বাতিল
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "সেভ হচ্ছে…" : editing ? "আপডেট করুন" : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
