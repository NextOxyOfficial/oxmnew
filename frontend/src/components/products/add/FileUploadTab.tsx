"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ApiService } from "@/lib/api";
import { useToast } from "@/components/ui/Feedback";

interface UploadResults {
  success: boolean;
  products_created: number;
  successful_rows?: Array<{ row: number; name: string }>;
  errors: string[];
  message: string;
}

const VALID_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const REQUIRED_COLUMNS = [
  { name: "name", note: "প্রোডাক্টের নাম (সর্বোচ্চ ২০০ অক্ষর), একই নামে দুটো চলবে না" },
  { name: "buy_price", note: "কেনা দাম — যেমন 50.00, 125.99" },
  { name: "sell_price", note: "বিক্রির দাম, কেনা দামের সমান বা বেশি" },
  { name: "stock", note: "স্টক, পুরো সংখ্যা — যেমন 50, 100" },
];

const OPTIONAL_COLUMNS = [
  { name: "product_code", note: "SKU, পার্ট নম্বর বা বারকোড" },
  { name: "category", note: "ক্যাটাগরি — নতুন হলে আপনাআপনি তৈরি হবে" },
  { name: "supplier", note: "সাপ্লায়ার — নতুন হলে আপনাআপনি তৈরি হবে" },
  { name: "location", note: "কোথায় রাখা আছে (সর্বোচ্চ ২০০ অক্ষর)" },
  { name: "details", note: "প্রোডাক্টের বিবরণ" },
];

/** Excel arrives as a workbook; the API only speaks CSV, so convert first. */
const excelToCsv = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_csv(sheet));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("ফাইলটা পড়া গেল না"));
    reader.readAsArrayBuffer(file);
  });

/**
 * Bulk product import from CSV/Excel.
 *
 * Owns its own state: nothing here is shared with the manual-entry form, so
 * keeping it separate stops the page component from carrying upload state it
 * never reads.
 */
export default function FileUploadTab() {
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<UploadResults | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ok = VALID_EXTENSIONS.some((ext) =>
      selected.name.toLowerCase().endsWith(ext)
    );
    if (!ok) {
      toast.error("ঠিকঠাক একটা ফাইল সিলেক্ট করুন (CSV, XLSX বা XLS)");
      e.target.value = "";
      return;
    }
    setFile(selected);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("আগে একটা ফাইল সিলেক্ট করুন");
      return;
    }

    setUploading(true);
    setResults(null);
    try {
      const name = file.name.toLowerCase();
      let toSend = file;
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const csv = await excelToCsv(file);
        toSend = new File([new Blob([csv], { type: "text/csv" })], "converted.csv", {
          type: "text/csv",
        });
      }
      setResults(await ApiService.uploadProductsCSV(toSend));
    } catch (error) {
      setResults({
        success: false,
        products_created: 0,
        successful_rows: [],
        errors: [error instanceof Error ? error.message : "অজানা সমস্যা"],
        message: "ফাইল আপলোড করা গেল না",
      });
    } finally {
      setUploading(false);
    }
  };

  /** Both templates arrive as a blob, so the save-to-disk dance is shared. */
  const handleDownload = async (kind: "csv" | "xlsx") => {
    setDownloading(kind);
    try {
      const blob =
        kind === "csv"
          ? await ApiService.downloadProductsCSVTemplate()
          : await ApiService.downloadProductsExcelTemplate();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products_template.${kind}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("টেমপ্লেট ডাউনলোড করা গেল না");
    } finally {
      setDownloading(null);
    }
  };

  const reset = () => {
    setFile(null);
    setResults(null);
  };

  return (
    <>
      <div className="plane-section">
        <div className="section-title">কীভাবে করবেন</div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["টেমপ্লেট নামান", "নমুনা তথ্য আর ঠিক কলাম নামসহ ফাইলটা ডাউনলোড করুন"],
            ["নিজের তথ্য বসান", "নমুনা মুছে নিজের প্রোডাক্ট লিখুন, কলামের নাম বদলাবেন না"],
            ["আপলোড করুন", "ফাইলটা দিন, ভুল থাকলে কোন সারিতে সেটা দেখিয়ে দেওয়া হবে"],
          ].map(([title, note], index) => (
            <li key={title} className="flex gap-2.5">
              <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">
                  {title}
                </span>
                <span className="block text-xs text-slate-500">{note}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleDownload("csv")}
            disabled={downloading !== null}
            className="btn btn-ghost btn-sm"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading === "csv" ? "নামছে…" : "সিএসভি টেমপ্লেট"}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("xlsx")}
            disabled={downloading !== null}
            className="btn btn-ghost btn-sm"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading === "xlsx" ? "নামছে…" : "এক্সেল টেমপ্লেট"}
          </button>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">ফাইল সিলেক্ট করুন</div>

        {file ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {file.name}
                </span>
                <span className="num block text-xs text-slate-500">
                  {(file.size / 1024).toFixed(0)} কেবি
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                aria-label="ফাইলটা সরিয়ে দিন"
                className="btn btn-ghost btn-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "আপলোড হচ্ছে…" : "আপলোড করুন"}
              </button>
            </span>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-cyan-400 hover:bg-slate-50">
            <Upload className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              ফাইলটা এখানে দিন
            </span>
            <span className="text-xs text-slate-500">
              সিএসভি (.csv) বা এক্সেল (.xlsx, .xls) — এক্সেল সর্বোচ্চ ২৫ এমবি,
              সিএসভি ১০ এমবি
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}

        <p className="mt-2 text-xs text-slate-500">
          একবারে ১০০–৫০০টা প্রোডাক্ট রাখলে সবচেয়ে ভালো চলে। ফাইল আপলোডে শুধু
          একটাই দামের প্রোডাক্ট চলবে, ভ্যারিয়েন্ট চলবে না। ছবি পরে আলাদা করে
          দিতে হবে।
        </p>
      </div>

      {results && (
        <div className="plane-section">
          <div className="section-title">আপলোডের হিসাব</div>

          <div
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
              results.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {results.success ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>
              <span className="block font-medium">
                {results.products_created} টা প্রোডাক্ট যোগ হয়েছে
              </span>
              {results.message && (
                <span className="block text-xs opacity-90">{results.message}</span>
              )}
            </span>
          </div>

          {!!results.successful_rows?.length && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-slate-600">
                যেগুলো যোগ হয়েছে
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.successful_rows.map((row) => (
                  <div
                    key={`${row.row}-${row.name}`}
                    className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate text-slate-700">{row.name}</span>
                    <span className="num shrink-0 text-slate-400">
                      সারি {row.row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!results.errors?.length && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-medium text-rose-700">
                যে সারিগুলোয় সমস্যা
              </div>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                {results.errors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
              আরও প্রোডাক্ট আপলোড
            </button>
            <Link href="/dashboard/products" className="btn btn-primary btn-sm">
              প্রোডাক্ট দেখুন
            </Link>
          </div>
        </div>
      )}

      <div className="plane-section">
        <div className="section-title">ফাইল কেমন হতে হবে</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-600">
              যে কলামগুলো লাগবেই
            </div>
            <dl className="space-y-1.5">
              {REQUIRED_COLUMNS.map((column) => (
                <div key={column.name}>
                  <dt className="num text-xs font-medium text-rose-700">
                    {column.name}
                  </dt>
                  <dd className="text-xs text-slate-500">{column.note}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-600">
              ইচ্ছে হলে দেওয়া কলাম
            </div>
            <dl className="space-y-1.5">
              {OPTIONAL_COLUMNS.map((column) => (
                <div key={column.name}>
                  <dt className="num text-xs font-medium text-slate-700">
                    {column.name}
                  </dt>
                  <dd className="text-xs text-slate-500">{column.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
