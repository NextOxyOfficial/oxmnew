"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, RefreshCw, Sparkles } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";
import { num } from "@/lib/money";

interface SmsPackage {
  id: number;
  sms_count: number;
  price: string | number;
  is_popular?: boolean;
}

/**
 * Buy SMS credits without leaving the SMS centre.
 *
 * The purchase used to live only on the subscriptions page, which meant running
 * out mid-send sent the user off to another screen and back. The payment itself
 * still goes through the same ShurjoPay flow — this is an extra entry point,
 * not a second implementation.
 */
export default function CreditPackages({ credits }: { credits: number | null }) {
  const { user, profile } = useAuth();
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();

  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSmsPackages();
      const rows = Array.isArray(data) ? data : data?.results ?? [];
      setPackages(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "প্যাকেজ আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The gateway rejects a payment without these, so the gap is named up front
  // rather than after the user has already picked a package.
  const missing: string[] = [];
  if (!user?.first_name) missing.push("নাম");
  if (!(profile?.phone || profile?.contact_number)) missing.push("ফোন নম্বর");
  if (!profile?.address) missing.push("ঠিকানা");
  if (!profile?.city) missing.push("শহর");
  if (!profile?.post_code) missing.push("পোস্ট কোড");

  const handleBuy = async (pkg: SmsPackage) => {
    if (missing.length) return;
    setBuyingId(pkg.id);
    try {
      const orderId = `SMS-${pkg.id}-Q1-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      const payment = await ApiService.makePayment({
        amount: num(pkg.price),
        order_id: orderId,
        currency: "BDT",
        customer_name: `${user!.first_name} ${user!.last_name ?? ""}`.trim(),
        customer_address: profile!.address!,
        customer_phone: (profile!.phone || profile!.contact_number)!,
        customer_city: profile!.city!,
        customer_post_code: profile!.post_code!,
      });

      if (payment?.checkout_url) {
        window.location.href = payment.checkout_url;
      } else {
        toast.error(
          payment?.error ?? "পেমেন্টের লিংক পাওয়া যায়নি। একটু পরে চেষ্টা করুন।"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "পেমেন্ট শুরু করা গেল না");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <>
      <div className="plane-section">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="section-title mb-0">এসএমএস ক্রেডিট কিনুন</span>
          <button onClick={load} className="btn btn-ghost btn-sm" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </button>
        </div>
        <p className="text-xs text-slate-500">
          এখন আছে{" "}
          <span className="num font-medium text-slate-800">
            {credits === null ? "…" : credits.toLocaleString("bn-BD")}
          </span>{" "}
          ক্রেডিট। একটা এসএমএস = একটা ক্রেডিট (১৬০ অক্ষরের বেশি হলে বেশি লাগে)।
        </p>

        {missing.length > 0 && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              কেনার আগে প্রোফাইলে {missing.join(", ")} দিতে হবে — পেমেন্ট গেটওয়ে
              এগুলো ছাড়া নেবে না।{" "}
              <Link
                href="/dashboard/settings"
                className="font-medium underline"
              >
                সেটিংসে যান
              </Link>
            </span>
          </div>
        )}
      </div>

      <div className="plane-section">
        {error ? (
          <div className="empty">
            <p>{error}</p>
            <button onClick={load} className="btn btn-ghost btn-sm mt-2">
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : loading ? (
          <div className="empty">প্যাকেজ আনা হচ্ছে…</div>
        ) : packages.length === 0 ? (
          <div className="empty">এখন কোনো প্যাকেজ নেই।</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const price = num(pkg.price);
              const perSms = pkg.sms_count > 0 ? price / pkg.sms_count : 0;
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border px-4 py-3.5 ${
                    pkg.is_popular
                      ? "border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-200"
                      : "border-slate-200"
                  }`}
                >
                  {pkg.is_popular && (
                    <span className="badge badge-info absolute -top-2 right-3">
                      <Sparkles className="h-3 w-3" />
                      সবচেয়ে জনপ্রিয়
                    </span>
                  )}

                  <div className="num text-2xl font-semibold text-slate-900">
                    {pkg.sms_count.toLocaleString("bn-BD")}
                  </div>
                  <div className="text-xs text-slate-500">এসএমএস</div>

                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="num text-lg font-semibold text-cyan-700">
                      {formatCurrency(price)}
                    </span>
                    <span className="num text-xs text-slate-500">
                      · প্রতিটা {formatCurrency(perSms)}
                    </span>
                  </div>

                  <ul className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                      মেয়াদ শেষ হয় না
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                      সাথে সাথেই যোগ হয়
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleBuy(pkg)}
                    disabled={buyingId !== null || missing.length > 0}
                    className={`mt-3 w-full btn ${
                      pkg.is_popular ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {buyingId === pkg.id ? "পেমেন্টে যাচ্ছে…" : "কিনুন"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
