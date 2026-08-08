"use client";

import DocumentFormDialog from "@/components/documents/DocumentFormDialog";
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
} from "@/lib/documents";
import {
  AlertTriangle,
  Download,
  Eye,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function ImportantDocumentsPage() {
  const router = useRouter();
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
    setShowForm(true);
  };

  const openEdit = (doc: ImportantDocument) => {
    setEditing(doc);
    setShowForm(true);
  };

  const openDetails = (doc: ImportantDocument) =>
    router.push(`/dashboard/documents/${doc.id}`);

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
            <div className={`stat-value ${stats?.expired ? "money-neg" : "num"}`}>
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
              {stats?.permanent
                ? `${stats.permanent} টার মেয়াদ নাই`
                : "মেয়াদ বাকি আছে"}
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
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openDetails(doc)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
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
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters.
            A two-column grid on a phone, a flex row from `sm` up. The previous
            single flex row let the search box shrink to ~10px on a 375px
            screen: `flex-1 min-w-0` yields to the two selects, which claim
            their intrinsic width and leave nothing behind. Here the search
            spans both columns, the selects take one each, and the desktop
            layout is unchanged. */}
        <div className="plane-section">
          <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
            <div className="relative col-span-2 sm:col-auto sm:min-w-0 sm:flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="নাম বা লাইসেন্স নম্বর দিয়ে খুঁজুন"
                className="input w-full pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select w-full min-w-0 sm:w-auto"
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
              className="select w-full min-w-0 sm:w-auto"
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
                className="btn btn-ghost btn-sm col-span-2 sm:col-auto sm:shrink-0"
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
                    <tr
                      key={doc.id}
                      onClick={() => openDetails(doc)}
                      className="cursor-pointer"
                    >
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
                              {doc.extension ? `${doc.extension.toUpperCase()} · ` : ""}
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
                      {/* The row navigates; the buttons must not also fire it. */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetails(doc)}
                            className="btn btn-ghost btn-sm"
                            title="বিস্তারিত দেখুন"
                            aria-label="বিস্তারিত দেখুন"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-sm"
                              title="ফাইলটা নামান"
                              aria-label="ফাইলটা নামান"
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
                              className={`h-4 w-4 ${doc.is_pinned ? "text-cyan-600" : ""}`}
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

      <DocumentFormDialog
        open={showForm}
        document={editing}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}
