"use client";

import { sumBy } from "@/lib/money";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

interface Purchase {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  date: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  products: string;
  notes?: string;
  proof_document?: string;
  proof_url?: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseHistoryTabProps {
  purchases: Purchase[];
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
  getFilteredPurchases: () => Purchase[];
  getUniqueSuppliers: () => string[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  onUpdatePurchase?: (
    purchaseId: number,
    updatedData: { status: "pending" | "completed" | "cancelled" }
  ) => Promise<void>;
  onDeletePurchase?: (purchaseId: number) => Promise<void>;
}

// Design-system badge + Bangla label for each purchase status.
const STATUS_BADGE: Record<string, string> = {
  pending: "badge-warn",
  completed: "badge-success",
  cancelled: "badge-muted",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "বাকি আছে",
  completed: "শেষ",
  cancelled: "বাতিল করা",
};

export default function PurchaseHistoryTab({
  purchases,
  selectedSupplier,
  setSelectedSupplier,
  getFilteredPurchases,
  getUniqueSuppliers,
  formatCurrency,
  formatDate,
  getStatusColor,
  onUpdatePurchase,
  onDeletePurchase,
}: PurchaseHistoryTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(
    null
  );
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuppliers = getUniqueSuppliers().filter((supplier) =>
    supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unknown statuses fall back to the colour hint the parent supplies.
  const badgeClassFor = (status: string): string =>
    STATUS_BADGE[status] ??
    (getStatusColor(status).includes("red") ? "badge-danger" : "badge-muted");

  const handleSupplierSelect = (supplier: string) => {
    setSelectedSupplier(supplier);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleStatusUpdate = async (
    purchaseId: number,
    newStatus: "pending" | "completed" | "cancelled"
  ) => {
    if (!onUpdatePurchase) return;

    setUpdating(true);
    try {
      await onUpdatePurchase(purchaseId, { status: newStatus });
      setEditingPurchaseId(null);
    } catch (error) {
      console.error("Failed to update purchase status:", error);
      // You might want to show an error notification here
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (purchaseId: number) => {
    if (!onDeletePurchase) return;

    try {
      await onDeletePurchase(purchaseId);
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      // Error handling is done in the parent component
    }
  };

  const downloadCSV = () => {
    const filteredData = getFilteredPurchases();
    const headers = ["Date", "Supplier", "Products", "Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((purchase) =>
        [
          formatDate(purchase.date),
          `"${purchase.supplier.name}"`,
          `"${purchase.products}"`,
          purchase.amount,
          purchase.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `purchase-history-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const filteredData = getFilteredPurchases();
    const currentDate = new Date().toLocaleDateString();
    const totalAmount = sumBy(filteredData, (p) => p.amount);

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0891b2; padding-bottom: 15px; }
            .title { font-size: 24px; font-weight: bold; color: #0891b2; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #666; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #0891b2; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #e0f2fe; }
            .amount { font-weight: bold; color: #059669; }
            .status { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .completed { background-color: #d1fae5; color: #065f46; }
            .pending { background-color: #fef3c7; color: #92400e; }
            .cancelled { background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Purchase History Report</div>
            <div class="subtitle">Generated on ${currentDate}</div>
          </div>
          <div class="summary">
            <strong>Summary:</strong> ${
              filteredData.length
            } purchases | Total Amount: ${formatCurrency(totalAmount)}
            ${
              selectedSupplier !== "all"
                ? ` | Filtered by: ${selectedSupplier}`
                : ""
            }
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (purchase) => `
                <tr>
                  <td>${formatDate(purchase.date)}</td>
                  <td>${purchase.supplier.name}</td>
                  <td>${purchase.products}</td>
                  <td class="amount">${formatCurrency(purchase.amount)}</td>
                  <td><span class="status ${purchase.status}">${
                    purchase.status
                  }</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            This report was generated automatically from the supplier management system.
          </div>
        </body>
      </html>
    `;

    // Open print dialog with the formatted content
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const visiblePurchases = getFilteredPurchases();

  return (
    <>
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">মোট কেনাকাটা</div>
          <div className="stat-value num">{purchases.length}</div>
          <div className="stat-meta">সব মিলিয়ে</div>
        </div>
        <div className="stat">
          <div className="stat-label">দেখাচ্ছে</div>
          <div className="stat-value num">{visiblePurchases.length}</div>
          <div className="stat-meta">
            {purchases.length} টার মধ্যে {visiblePurchases.length} টা
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">মোট টাকা</div>
          <div className="stat-value num">
            {formatCurrency(
              sumBy(visiblePurchases, (p) => p.amount)
            )}
          </div>
          <div className="stat-meta">
            {selectedSupplier === "all" ? "সব সাপ্লায়ার" : selectedSupplier}
          </div>
        </div>
      </div>

      <div className="plane-section">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="btn btn-ghost w-full sm:w-56 justify-between"
            >
              <span className="truncate">
                {selectedSupplier === "all" ? "সব সাপ্লায়ার" : selectedSupplier}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="p-2 border-b border-slate-200">
                  <input
                    type="text"
                    placeholder="সাপ্লায়ার খুঁজুন…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleSupplierSelect("all")}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 truncate ${
                      selectedSupplier === "all"
                        ? "text-cyan-600"
                        : "text-slate-600"
                    }`}
                  >
                    সব সাপ্লায়ার
                  </button>
                  {filteredSuppliers.map((supplier) => (
                    <button
                      type="button"
                      key={supplier}
                      onClick={() => handleSupplierSelect(supplier)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 truncate ${
                        selectedSupplier === supplier
                          ? "text-cyan-600"
                          : "text-slate-600"
                      }`}
                    >
                      {supplier}
                    </button>
                  ))}
                  {filteredSuppliers.length === 0 && searchTerm && (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      কিছু পাওয়া যায়নি
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedSupplier !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedSupplier("all")}
              className="btn btn-ghost btn-sm"
            >
              ফিল্টার মুছে দিন
            </button>
          )}

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={downloadCSV}
              className="btn btn-ghost btn-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV নামান
            </button>
            <button
              type="button"
              onClick={downloadPDF}
              className="btn btn-ghost btn-sm"
            >
              <FileText className="h-4 w-4" />
              PDF নামান
            </button>
          </div>
        </div>
      </div>

      {visiblePurchases.length === 0 ? (
        <div className="empty">
          {purchases.length === 0
            ? "এখনো কোনো কেনাকাটা যোগ করা হয়নি"
            : "কিছু পাওয়া যায়নি"}
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>সাপ্লায়ার</th>
                <th>প্রোডাক্ট</th>
                <th className="cell-num">টাকার পরিমাণ</th>
                <th>অবস্থা</th>
                <th>প্রমাণ</th>
              </tr>
            </thead>
            <tbody>
              {visiblePurchases.map((purchase) => (
                <tr key={purchase.id} className="group">
                  <td className="whitespace-nowrap">
                    {formatDate(purchase.date)}
                  </td>
                  <td className="cell-strong whitespace-nowrap">
                    {purchase.supplier.name}
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={purchase.products}>
                      {purchase.products}
                    </div>
                  </td>
                  <td className="cell-num whitespace-nowrap">
                    {formatCurrency(purchase.amount)}
                  </td>
                  <td>
                    {editingPurchaseId === purchase.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={purchase.status}
                          onChange={(e) =>
                            handleStatusUpdate(
                              purchase.id,
                              e.target.value as
                                | "pending"
                                | "completed"
                                | "cancelled"
                            )
                          }
                          disabled={updating}
                          className="select w-auto"
                        >
                          <option value="pending">বাকি আছে</option>
                          <option value="completed">শেষ</option>
                          <option value="cancelled">বাতিল করা</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditingPurchaseId(null)}
                          disabled={updating}
                          className="text-slate-500 hover:text-cyan-600"
                          title="বাতিল"
                          aria-label="বাতিল"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${badgeClassFor(purchase.status)}`}
                        >
                          {STATUS_LABEL[purchase.status] ?? purchase.status}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onUpdatePurchase && (
                            <button
                              type="button"
                              onClick={() => setEditingPurchaseId(purchase.id)}
                              className="text-slate-500 hover:text-cyan-600"
                              title="অবস্থা বদলান"
                              aria-label="অবস্থা বদলান"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {onDeletePurchase && (
                            <button
                              type="button"
                              onClick={() => handleDelete(purchase.id)}
                              className="text-slate-500 hover:text-rose-600"
                              title="ডিলিট করুন"
                              aria-label="ডিলিট করুন"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {purchase.proof_url ? (
                      purchase.proof_url.toLowerCase().includes(".pdf") ? (
                        <a
                          href={purchase.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-600"
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(purchase.proof_url, "_blank")
                          }
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-600"
                        >
                          <ImageIcon className="h-4 w-4" />
                          ছবি
                        </button>
                      )
                    ) : (
                      <span className="text-slate-500">প্রমাণ নেই</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
