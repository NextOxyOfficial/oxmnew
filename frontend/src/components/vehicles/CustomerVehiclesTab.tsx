"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import VehicleDocuments from "@/components/vehicles/VehicleDocuments";
import {
  Vehicle,
  VehicleDocument,
  toNumber,
  vehicleStatusBadge,
  vehicleStatusLabel,
  paymentMethodLabel,
} from "@/lib/vehicles";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("bn-BD") : "—";

/**
 * Every vehicle this customer has bought, with its payment history and papers
 * inline — so a shopkeeper can answer "what did they buy, what do they still
 * owe, did we hand over the papers" without leaving the profile.
 */
export default function CustomerVehiclesTab({
  customerId,
}: {
  customerId: number | string;
}) {
  const formatCurrency = useCurrencyFormatter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getCustomerVehicles(customerId);
      setVehicles(Array.isArray(response) ? response : response?.results ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "বাইকের তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDocumentsChange = (
    vehicleId: number,
    documents: VehicleDocument[]
  ) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, documents } : v))
    );
  };

  if (loading) {
    return (
      <div className="plane-section">
        <div className="empty">বাইকের তথ্য লোড হচ্ছে…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plane-section">
        <div className="empty">
          <p>{error}</p>
          <button onClick={load} className="btn btn-ghost btn-sm mt-2">
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="plane-section">
        <div className="empty">এই কাস্টমার এখনো কোনো বাইক কেনেননি।</div>
      </div>
    );
  }

  const totalPaid = vehicles.reduce((sum, v) => sum + toNumber(v.paid_amount), 0);
  const totalDue = vehicles.reduce((sum, v) => sum + toNumber(v.due_amount), 0);

  return (
    <>
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">কেনা বাইক</div>
          <div className="stat-value num">{vehicles.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">জমা দিয়েছেন</div>
          <div className="stat-value num money-pos">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">বাকি আছে</div>
          <div className={`stat-value num ${totalDue > 0 ? "money-neg" : "money-pos"}`}>
            {formatCurrency(totalDue)}
          </div>
        </div>
      </div>

      {vehicles.map((vehicle) => {
        const isOpen = expandedId === vehicle.id;
        const due = toNumber(vehicle.due_amount);
        const payments = vehicle.payments ?? [];
        const documents = vehicle.documents ?? [];

        return (
          <div key={vehicle.id} className="plane-section">
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : vehicle.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {vehicle.product_name}
                  </span>
                  <span className="block truncate text-xs text-slate-500 num">
                    চেসিস {vehicle.chassis_number} · {formatDate(vehicle.sold_at)}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {(vehicle.document_count ?? documents.length) > 0 && (
                  <span className="badge badge-muted">
                    <FileText className="h-3 w-3" />
                    {vehicle.document_count ?? documents.length}
                  </span>
                )}
                <span className={vehicleStatusBadge(vehicle.status)}>
                  {vehicleStatusLabel(vehicle.status)}
                </span>
                <span className="text-right">
                  <span className="block text-sm font-semibold num">
                    {formatCurrency(toNumber(vehicle.sold_price))}
                  </span>
                  <span className={`block text-xs num ${due > 0 ? "money-neg" : "money-pos"}`}>
                    {due > 0 ? `${formatCurrency(due)} বাকি` : "পরিশোধ"}
                  </span>
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/vehicles/${vehicle.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    বাইকের বিস্তারিত
                  </Link>
                  {vehicle.order && (
                    <Link
                      href={`/invoice/${vehicle.order}`}
                      className="btn btn-ghost btn-sm"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      ইনভয়েস {vehicle.order_number}
                    </Link>
                  )}
                </div>

                <div>
                  <div className="section-title">টাকা জমার হিস্ট্রি</div>
                  {payments.length === 0 ? (
                    <div className="empty">এখনো কোনো টাকা জমা হয়নি।</div>
                  ) : (
                    <div className="tbl-wrap">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>তারিখ</th>
                            <th>মাধ্যম</th>
                            <th>রেফারেন্স</th>
                            <th className="cell-num">টাকা</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td className="num">
                                {new Date(p.created_at).toLocaleDateString("bn-BD")}
                              </td>
                              <td>{paymentMethodLabel(p.method)}</td>
                              <td>{p.reference || "—"}</td>
                              <td className="cell-num num money-pos">
                                {formatCurrency(toNumber(p.amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Papers are managed here too — handing over documents happens
                    face to face with the buyer, so the profile is where a
                    shopkeeper looks for them. */}
                <div className="-mx-5">
                  <VehicleDocuments
                    vehicleId={vehicle.id}
                    documents={documents}
                    onChange={(docs) => handleDocumentsChange(vehicle.id, docs)}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
