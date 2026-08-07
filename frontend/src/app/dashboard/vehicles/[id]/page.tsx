"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ShoppingCart,
  FileText,
  RotateCcw,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast, useConfirm } from "@/components/ui/Feedback";
import VehicleDocuments from "@/components/vehicles/VehicleDocuments";
import SellVehicleModal from "@/components/vehicles/SellVehicleModal";
import {
  Vehicle,
  VehicleDocument,
  conditionLabel,
  toNumber,
  vehicleStatusBadge,
  vehicleStatusLabel,
  vehicleTypeLabel,
  paymentMethodLabel,
} from "@/lib/vehicles";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("bn-BD") : "—";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setVehicle(await ApiService.getVehicle(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "বাইকের তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!vehicle) return;
    const ok = await confirm({
      title: "বাইকটা মুছে দেবেন?",
      message: `${vehicle.product_name} (চেসিস ${vehicle.chassis_number}) মুছে গেলে আর ফেরানো যাবে না।`,
      confirmLabel: "মুছে দিন",
      danger: true,
    });
    if (!ok) return;

    setBusy(true);
    try {
      await ApiService.deleteVehicle(vehicle.id);
      toast.success("বাইকটা মুছে দেওয়া হয়েছে");
      router.push("/dashboard/vehicles");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "মুছে দেওয়া গেল না");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelSale = async () => {
    if (!vehicle) return;
    const ok = await confirm({
      title: "বিক্রি বাতিল করবেন?",
      message:
        "বাইকটা আবার স্টকে ফিরে যাবে। আগের ইনভয়েস আর জমা টাকার হিস্ট্রি বিক্রির লিস্টে থেকে যাবে।",
      confirmLabel: "বাতিল করুন",
      danger: true,
    });
    if (!ok) return;

    setBusy(true);
    try {
      await ApiService.cancelVehicleSale(vehicle.id);
      toast.success("বিক্রি বাতিল হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বাতিল করা গেল না");
    } finally {
      setBusy(false);
    }
  };

  const handleDocumentsChange = (documents: VehicleDocument[]) => {
    setVehicle((prev) => (prev ? { ...prev, documents } : prev));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="plane">
          <div className="plane-section">
            <div className="empty">বাইকের তথ্য লোড হচ্ছে…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-4 sm:p-6">
        <div className="plane">
          <div className="plane-section">
            <div className="empty">
              <p>{error || "বাইকটা পাওয়া যায়নি"}</p>
              <Link href="/dashboard/vehicles" className="btn btn-ghost btn-sm mt-2">
                বাইকের লিস্টে ফিরুন
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSold = vehicle.status === "sold";
  const due = toNumber(vehicle.due_amount);
  const paid = toNumber(vehicle.paid_amount);
  const payments = vehicle.payments ?? [];
  const documents = vehicle.documents ?? [];

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: "মডেল", value: vehicle.product_name },
    { label: "টাইপ", value: vehicleTypeLabel(vehicle.vehicle_type) },
    { label: "কন্ডিশন", value: conditionLabel(vehicle.condition) },
    { label: "ইঞ্জিন নম্বর", value: <span className="num">{vehicle.engine_number}</span> },
    { label: "চেসিস নম্বর", value: <span className="num">{vehicle.chassis_number}</span> },
    { label: "রেজিস্ট্রেশন", value: vehicle.registration_number || "—" },
    { label: "রঙ", value: vehicle.color || "—" },
    { label: "মডেল ইয়ার", value: vehicle.model_year || "—" },
    ...(vehicle.condition === "used"
      ? [{ label: "চলেছে", value: vehicle.odometer_km ? `${vehicle.odometer_km} কিমি` : "—" }]
      : []),
    { label: "কোথায় রাখা", value: vehicle.location || "—" },
    { label: "সাপ্লায়ার", value: vehicle.supplier_name || "—" },
    { label: "কেনার তারিখ", value: formatDate(vehicle.purchase_date) },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="page-head">
        <div className="min-w-0">
          <Link
            href="/dashboard/vehicles"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            বাইকের লিস্ট
          </Link>
          <h1 className="page-title mt-1 flex flex-wrap items-center gap-2">
            {vehicle.product_name}
            <span className={vehicleStatusBadge(vehicle.status)}>
              {vehicleStatusLabel(vehicle.status)}
            </span>
          </h1>
          <p className="page-sub num">
            চেসিস {vehicle.chassis_number} · ইঞ্জিন {vehicle.engine_number}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit stays available after a sale on purpose: registration papers
              and BRTA numbers usually arrive weeks later, and the record has to
              be correctable. Only the sale itself is locked. */}
          <Link
            href={`/dashboard/vehicles/${vehicle.id}/edit`}
            className="btn btn-ghost"
          >
            <Pencil className="h-4 w-4" />
            এডিট
          </Link>

          {!isSold ? (
            <>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="btn btn-ghost text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                মুছে দিন
              </button>
              <button
                onClick={() => setShowSellModal(true)}
                className="btn btn-primary"
              >
                <ShoppingCart className="h-4 w-4" />
                বিক্রি করুন
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelSale}
                disabled={busy}
                className="btn btn-ghost text-rose-600 hover:bg-rose-50"
              >
                <RotateCcw className="h-4 w-4" />
                বিক্রি বাতিল
              </button>
              {vehicle.order && (
                <Link href={`/invoice/${vehicle.order}`} className="btn btn-primary">
                  <FileText className="h-4 w-4" />
                  ইনভয়েস দেখুন
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="plane">
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">কেনা দাম</div>
            <div className="stat-value num">{formatCurrency(toNumber(vehicle.buy_price))}</div>
          </div>
          <div className="stat">
            <div className="stat-label">{isSold ? "বিক্রি হয়েছে" : "বিক্রির দাম"}</div>
            <div className="stat-value num">
              {formatCurrency(toNumber(isSold ? vehicle.sold_price : vehicle.sell_price))}
            </div>
            <div className="stat-meta">{isSold ? formatDate(vehicle.sold_at) : "চাওয়া দাম"}</div>
          </div>
          <div className="stat">
            <div className="stat-label">জমা হয়েছে</div>
            <div className="stat-value num money-pos">
              {isSold ? formatCurrency(paid) : "—"}
            </div>
            <div className="stat-meta">{isSold ? `${payments.length} বার` : "বিক্রি হয়নি"}</div>
          </div>
          <div className="stat">
            <div className="stat-label">বাকি</div>
            <div className={`stat-value num ${due > 0 ? "money-neg" : "money-pos"}`}>
              {isSold ? formatCurrency(due) : "—"}
            </div>
            <div className="stat-meta">
              {isSold ? (due > 0 ? "এখনো পাওনা" : "পুরো পরিশোধ") : "—"}
            </div>
          </div>
        </div>

        <div className="plane-section">
          <div className="section-title">বাইকের তথ্য</div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {infoRows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5"
              >
                <dt className="text-xs text-slate-500">{row.label}</dt>
                <dd className="text-sm text-slate-900 text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
          {vehicle.notes && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {vehicle.notes}
            </p>
          )}
        </div>

        {isSold && (
          <div className="plane-section">
            <div className="section-title">বিক্রির তথ্য</div>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5">
                <span className="text-xs text-slate-500">কাস্টমার</span>
                <span className="text-sm">
                  {vehicle.customer ? (
                    <Link
                      href={`/dashboard/customers/${vehicle.customer}`}
                      className="text-cyan-700 hover:underline"
                    >
                      {vehicle.customer_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5">
                <span className="text-xs text-slate-500">ইনভয়েস</span>
                <span className="text-sm">
                  {vehicle.order ? (
                    <Link
                      href={`/invoice/${vehicle.order}`}
                      className="num text-cyan-700 hover:underline"
                    >
                      {vehicle.order_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5">
                <span className="text-xs text-slate-500">বিক্রির তারিখ</span>
                <span className="text-sm num">{formatDate(vehicle.sold_at)}</span>
              </div>
            </div>
          </div>
        )}

        {isSold && (
          <div className="plane-section">
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
                          {new Date(p.created_at).toLocaleString("bn-BD")}
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
            {vehicle.order && (
              <p className="mt-2 text-xs text-slate-500">
                নতুন টাকা জমা{" "}
                <Link
                  href={`/dashboard/orders/${vehicle.order}`}
                  className="text-cyan-700 hover:underline"
                >
                  বিক্রির পেজ
                </Link>{" "}
                থেকে যোগ করতে পারবেন।
              </p>
            )}
          </div>
        )}

        <VehicleDocuments
          vehicleId={vehicle.id}
          documents={documents}
          onChange={handleDocumentsChange}
        />
      </div>

      {showSellModal && (
        <SellVehicleModal
          vehicle={vehicle}
          onClose={() => setShowSellModal(false)}
          onSold={(updated) => {
            setVehicle(updated);
            setShowSellModal(false);
          }}
        />
      )}
    </div>
  );
}
