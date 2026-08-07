"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, FileText } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";
import {
  Vehicle,
  VEHICLE_TYPES,
  vehicleStatusBadge,
  vehicleStatusLabel,
  vehicleTypeLabel,
  toNumber,
} from "@/lib/vehicles";

interface VehicleStats {
  total: number;
  in_stock: number;
  reserved: number;
  sold: number;
  stock_value: string | number;
  sold_value: string | number;
}

export default function VehiclesPage() {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters. `searchTerm` is what the user types; `search` is the debounced
  // value we actually query with, so typing doesn't fire a request per keypress.
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  // Tabs, not a dropdown — "which bikes are still on the floor" and "what did
  // we sell" are two different jobs, so they get two places to stand.
  const [statusFilter, setStatusFilter] = useState("in_stock");
  const [typeFilter, setTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, itemsPerPage]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getVehicles({
        page: currentPage,
        page_size: itemsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        vehicle_type: typeFilter || undefined,
      });
      // The API paginates, but tolerate a bare array so the page still renders
      // if pagination is ever turned off server-side.
      const rows = Array.isArray(response) ? response : response?.results ?? [];
      setVehicles(rows);
      setTotalItems(
        Array.isArray(response) ? rows.length : response?.count ?? rows.length
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "বাইকের লিস্ট লোড করা যায়নি";
      setError(message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search, statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await ApiService.getVehicleStats());
    } catch {
      // Stats are decoration — a failure here must not blank the list.
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  const handleRefresh = async () => {
    await Promise.all([loadVehicles(), loadStats()]);
    toast.success("লিস্ট আপডেট হয়েছে");
  };

  // The sold tab answers a different question than the stock tabs, so it shows
  // customer/date/due instead of registration/status/cost.
  const showSoldColumns = statusFilter === "sold";
  const hasFilters = Boolean(search || typeFilter);

  const TABS = [
    { value: "in_stock", label: "স্টকে আছে", count: stats?.in_stock },
    { value: "reserved", label: "বুকিং", count: stats?.reserved },
    { value: "sold", label: "বিক্রি হয়ে গেছে", count: stats?.sold },
    { value: "", label: "সব", count: stats?.total },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="page-head">
        <div>
          <h1 className="page-title">মোটর বাইক</h1>
          <p className="page-sub">
            প্রতিটা বাইক আলাদা — ইঞ্জিন আর চেসিস নম্বর ধরে হিসাব থাকে
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn btn-ghost"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
          <Link href="/dashboard/vehicles/add" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            নতুন বাইক
          </Link>
        </div>
      </div>

      <div className="plane">
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">স্টকে আছে</div>
            <div className="stat-value num">{stats?.in_stock ?? "—"}</div>
            <div className="stat-meta">এখনো বিক্রি হয়নি</div>
          </div>
          <div className="stat">
            <div className="stat-label">বিক্রি হয়েছে</div>
            <div className="stat-value num">{stats?.sold ?? "—"}</div>
            <div className="stat-meta">মোট {stats?.total ?? 0} টার মধ্যে</div>
          </div>
          <div className="stat">
            <div className="stat-label">স্টকের দাম</div>
            <div className="stat-value num">
              {stats ? formatCurrency(toNumber(stats.stock_value)) : "—"}
            </div>
            <div className="stat-meta">কেনা দামে</div>
          </div>
          <div className="stat">
            <div className="stat-label">বিক্রির টাকা</div>
            <div className="stat-value num">
              {stats ? formatCurrency(toNumber(stats.sold_value)) : "—"}
            </div>
            <div className="stat-meta">সব বিক্রি মিলিয়ে</div>
          </div>
        </div>

        <div className="plane-section">
          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="বাইকের স্ট্যাটাস"
          >
            {TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`btn btn-sm ${
                  statusFilter === tab.value ? "btn-primary" : "btn-ghost"
                }`}
              >
                {tab.label}
                {typeof tab.count === "number" && (
                  <span className="num opacity-70">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="plane-section">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ইঞ্জিন, চেসিস, রেজিস্ট্রেশন, বাইকের নাম বা কাস্টমারের নাম দিয়ে খুঁজুন"
                className="input pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select sm:w-40"
            >
              <option value="">সব রকম টাইপ</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="plane-section">
            <div className="empty">
              <p>{error}</p>
              <button onClick={loadVehicles} className="btn btn-ghost btn-sm mt-2">
                আবার চেষ্টা করুন
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="plane-section">
            <div className="empty">বাইকের লিস্ট লোড হচ্ছে…</div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="plane-section">
            <div className="empty">
              <p>
                {hasFilters
                  ? "কোনো বাইক পাওয়া যায়নি"
                  : statusFilter === "sold"
                  ? "এখনো কোনো বাইক বিক্রি হয়নি"
                  : statusFilter === "reserved"
                  ? "এখন কোনো বাইক বুকিং হয়ে নেই"
                  : "এখনো কোনো বাইক যোগ করা হয়নি"}
              </p>
              {hasFilters ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setTypeFilter("");
                  }}
                  className="btn btn-ghost btn-sm mt-2"
                >
                  ফিল্টার মুছে দিন
                </button>
              ) : (
                <Link href="/dashboard/vehicles/add" className="btn btn-primary btn-sm mt-2">
                  <Plus className="h-3.5 w-3.5" />
                  প্রথম বাইকটা যোগ করুন
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>বাইক</th>
                  <th>চেসিস / ইঞ্জিন</th>
                  {showSoldColumns ? (
                    <>
                      <th>কাস্টমার</th>
                      <th>বিক্রির তারিখ</th>
                      <th className="cell-num">বিক্রি</th>
                      <th className="cell-num">বাকি</th>
                    </>
                  ) : (
                    <>
                      <th>রেজিস্ট্রেশন</th>
                      <th>স্ট্যাটাস</th>
                      <th className="cell-num">কেনা</th>
                      <th className="cell-num">চাওয়া দাম</th>
                    </>
                  )}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const due = toNumber(v.due_amount);
                  return (
                    <tr key={v.id}>
                      <td>
                        <Link
                          href={`/dashboard/vehicles/${v.id}`}
                          className="cell-strong hover:text-cyan-700"
                        >
                          {v.product_name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {vehicleTypeLabel(v.vehicle_type)}
                          {v.color ? ` · ${v.color}` : ""}
                          {v.model_year ? ` · ${v.model_year}` : ""}
                        </div>
                      </td>
                      <td>
                        {/* Both numbers stacked in one cell — they identify the
                            same unit, and either one may still be blank. */}
                        <div className="num text-xs text-slate-700">
                          {v.chassis_number || (
                            <span className="text-slate-400">চেসিস নেই</span>
                          )}
                        </div>
                        <div className="num text-xs text-slate-500">
                          {v.engine_number || "ইঞ্জিন নম্বর নেই"}
                        </div>
                      </td>

                      {showSoldColumns ? (
                        <>
                          <td>
                            {v.customer ? (
                              <Link
                                href={`/dashboard/customers/${v.customer}`}
                                className="hover:text-cyan-700"
                              >
                                {v.customer_name}
                              </Link>
                            ) : (
                              "—"
                            )}
                            {v.order_number && (
                              <div className="num text-xs text-slate-500">
                                {v.order_number}
                              </div>
                            )}
                          </td>
                          <td className="num text-xs">
                            {v.sold_at
                              ? new Date(v.sold_at).toLocaleDateString("bn-BD")
                              : "—"}
                          </td>
                          <td className="cell-num num">
                            {formatCurrency(toNumber(v.sold_price))}
                          </td>
                          <td className="cell-num num">
                            <span className={due > 0 ? "money-neg" : "money-pos"}>
                              {due > 0 ? formatCurrency(due) : "পরিশোধ"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{v.registration_number || "—"}</td>
                          <td>
                            <span className={vehicleStatusBadge(v.status)}>
                              {vehicleStatusLabel(v.status)}
                            </span>
                          </td>
                          <td className="cell-num num text-slate-500">
                            {formatCurrency(toNumber(v.buy_price))}
                          </td>
                          <td className="cell-num num">
                            {formatCurrency(toNumber(v.sell_price))}
                          </td>
                        </>
                      )}
                      <td className="cell-num">
                        <div className="row-actions">
                          {(v.document_count ?? 0) > 0 && (
                            <span
                              className="badge badge-muted"
                              title={`${v.document_count} টা কাগজ আপলোড করা আছে`}
                            >
                              <FileText className="h-3 w-3" />
                              {v.document_count}
                            </span>
                          )}
                          <Link
                            href={`/dashboard/vehicles/${v.id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            বিস্তারিত
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="plane-section">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
