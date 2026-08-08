"use client";

import { useConfirm, useToast } from "@/components/ui/Feedback";
import { ApiService } from "@/lib/api";
import {
  DOC_TYPES,
  DocumentStats,
  ImportantDocument,
  docTypeLabel,
  expiryBadge,
  formatDate,
  formatFileSize,
  validateFile,
} from "@/lib/documents";
import {
  AlertTriangle,
  Download,
  FileText,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Blank form, also used to reset after a save. */
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

export default function ImportantDocumentsPage() {
  const toast = useToast();
  const confirm = useConfirm();

  const [documents, setDocuments] = useState<ImportantDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  // Expiry is derived on the server per row, not a DB column, so this one
  // filter is applied client-side over the fetched page.
  const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ImportantDocument | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [listResponse, statsResponse] = await Promise.all([
        ApiService.getImportantDocuments({
          search: search || undefined,
          doc_type: typeFilter || undefined,
          page_size: 200,
        }),
        ApiService.getImportantDocumentStats(),
      ]);
      const rows = Array.isArray(listResponse)
        ? listResponse
        : listResponse?.results ?? [];
      setDocuments(rows as ImportantDocument[]);
      setStats(statsResponse as DocumentStats);
    } catch (error) {
      console.error("Error loading documents:", error);
      setLoadError("কাগজপত্র আনা যায়নি। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      statusFilter
        ? documents.filter((d) => d.status === statusFilter)
        : documents,
    [documents, statusFilter]
  );

  // Anything already lapsed or lapsing within the month, soonest first.
  const needsAttention = useMemo(
    () =>
      documents
        .filter((d) => d.status === "expired" || d.status === "expiring")
        .sort((a, b) => (a.days_left ?? 0) - (b.days_left ?? 0)),
    [documents]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setFieldErrors({});
    setShowForm(true);
  };

  const openEdit = (doc: ImportantDocument) => {
    setEditing(doc);
    setForm({
      title: doc.title,
      doc_type: doc.doc_type,
      reference_number: doc.reference_number || "",
      issued_by: doc.issued_by || "",
      issue_date: doc.issue_date || "",
      expiry_date: doc.expiry_date || "",
      notes: doc.notes || "",
    });
    setFile(null);
    setFieldErrors({});
    setShowForm(true);
  };

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
      if (editing) {
        await ApiService.updateImportantDocument(editing.id, payload);
        toast.success("কাগজের তথ্য আপডেট হয়েছে");
      } else {
        await ApiService.createImportantDocument(payload);
        toast.success("কাগজ জমা হয়ে গেছে");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      setFile(null);
      load();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error(
        error instanceof Error ? error.message : "সেভ করা যায়নি, আবার চেষ্টা করুন"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (doc: ImportantDocument) => {
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
      load();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("ডিলিট করা যায়নি");
    }
  };

  const handleTogglePin = async (doc: ImportantDocument) => {
    // Flip locally first so the list reorders instantly, then reconcile.
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, is_pinned: !d.is_pinned } : d))
    );
    try {
      await ApiService.toggleImportantDocumentPin(doc.id);
      load();
    } catch (error) {
      console.error("Error pinning document:", error);
      toast.error("পিন করা যায়নি");
      load();
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">জরুরি কাগজপত্র</h1>
          <p className="page-sub">
            ট্রেড লাইসেন্স, টিন, ভ্যাট, চুক্তিপত্র — সব এক জায়গায়, মেয়াদসহ
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">নতুন কাগজ</span>
          <span className="sm:hidden">নতুন</span>
        </button>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট কাগজ</div>
            <div className="stat-value num">{stats?.total ?? 0}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">মেয়াদ শেষ</div>
            <div
              className={`stat-value ${stats?.expired ? "money-neg" : "num"}`}
            >
              {stats?.expired ?? 0}
            </div>
            <div className="stat-meta">এখনই নবায়ন দরকার</div>
          </div>
          <div className="stat">
            <div className="stat-label">শেষ হয়ে আসছে</div>
            <div className="stat-value num">{stats?.expiring ?? 0}</div>
            <div className="stat-meta">৩০ দিনের মধ্যে</div>
          </div>
          <div className="stat">
            <div className="stat-label">ঠিক আছে</div>
            <div className="stat-value num">
              {(stats?.valid ?? 0) + (stats?.permanent ?? 0)}
            </div>
            <div className="stat-meta">
              {stats?.permanent ? `${stats.permanent} টার মেয়াদ নাই` : "মেয়াদ বাকি আছে"}
            </div>
          </div>
        </div>

        {/* Papers that need renewing — the reason this feature exists. */}
        {needsAttention.length > 0 && (
          <div className="plane-section">
            <div className="section-title flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              নজর দেওয়া দরকার
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {needsAttention.slice(0, 5).map((doc) => {
                const badge = expiryBadge(doc);
                return (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-slate-700">
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-slate-500">
                        {" "}
                        · {docTypeLabel(doc.doc_type)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {formatDate(doc.expiry_date)}
                      </span>
                      <span className={badge.className}>{badge.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="নাম, লাইসেন্স নম্বর বা নোট দিয়ে খুঁজুন"
                className="input w-full pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select w-auto"
              aria-label="কাগজের টাইপ"
            >
              <option value="">সব রকম কাগজ</option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select w-auto"
              aria-label="মেয়াদের অবস্থা"
            >
              <option value="">সব অবস্থা</option>
              <option value="expired">মেয়াদ শেষ</option>
              <option value="expiring">শেষ হয়ে আসছে</option>
              <option value="valid">ঠিক আছে</option>
              <option value="permanent">মেয়াদ নাই</option>
            </select>
            {(searchInput || typeFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setTypeFilter("");
                  setStatusFilter("");
                }}
                className="btn btn-ghost btn-sm shrink-0"
              >
                সাফ করুন
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="plane-section space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : loadError ? (
          <div className="plane-section">
            <div className="empty">
              {loadError}
              <button onClick={load} className="btn btn-ghost btn-sm mt-3">
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="plane-section">
            <div className="empty">
              {documents.length === 0
                ? "এখনো কোনো কাগজ রাখা হয়নি। ট্রেড লাইসেন্স বা টিন সার্টিফিকেট দিয়ে শুরু করুন।"
                : "এই ফিল্টারে কিছু পাওয়া যায়নি"}
            </div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>কাগজ</th>
                  <th>টাইপ</th>
                  <th>নম্বর</th>
                  <th>ইস্যু</th>
                  <th>মেয়াদ শেষ</th>
                  <th>অবস্থা</th>
                  <th className="text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((doc) => {
                  const badge = expiryBadge(doc);
                  return (
                    <tr key={doc.id}>
                      <td className="cell-strong">
                        <span className="flex items-center gap-2">
                          {doc.is_pinned && (
                            <Pin
                              className="h-3.5 w-3.5 shrink-0 text-cyan-600"
                              aria-label="পিন করা"
                            />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate" title={doc.title}>
                              {doc.title}
                            </span>
                            <span className="block text-xs font-normal text-slate-500">
                              {doc.extension
                                ? `${doc.extension.toUpperCase()} · `
                                : ""}
                              {formatFileSize(doc.file_size)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td>{doc.doc_type_display || docTypeLabel(doc.doc_type)}</td>
                      <td>
                        {doc.reference_number || "—"}
                        {doc.issued_by ? (
                          <span className="block text-xs text-slate-500">
                            {doc.issued_by}
                          </span>
                        ) : null}
                      </td>
                      <td>{formatDate(doc.issue_date)}</td>
                      <td>{formatDate(doc.expiry_date)}</td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              title="ফাইলটা দেখুন বা নামান"
                              aria-label="ফাইলটা দেখুন বা নামান"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleTogglePin(doc)}
                            className="btn btn-ghost btn-sm"
                            title={doc.is_pinned ? "পিন খুলে দিন" : "উপরে পিন করুন"}
                            aria-label={doc.is_pinned ? "পিন খুলে দিন" : "উপরে পিন করুন"}
                          >
                            <Pin
                              className={`h-4 w-4 ${
                                doc.is_pinned ? "text-cyan-600" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => openEdit(doc)}
                            className="btn btn-ghost btn-sm"
                            title="এডিট করুন"
                            aria-label="এডিট করুন"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="btn btn-ghost btn-sm text-rose-600"
                            title="ডিলিট করুন"
                            aria-label="ডিলিট করুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > 0 && (
          <div className="plane-section text-xs text-slate-500">
            {documents.length} টার মধ্যে {visible.length} টা কাগজ দেখাচ্ছে
          </div>
        )}
      </div>

      {/* Upload / edit dialog */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">
                {editing ? "কাগজের তথ্য এডিট করুন" : "নতুন কাগজ রাখুন"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
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
                  onClick={() => setShowForm(false)}
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
      )}
    </div>
  );
}
