"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, MessageSquare, X } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";

interface Props {
  name: string;
  phone?: string | null;
  /** Outstanding amount, used to draft the message. */
  due?: number;
  /** Extra context for the default text, e.g. "৩ টা অর্ডার". */
  note?: string;
  label?: string;
  className?: string;
  /** `reminder` drafts a due-collection text; `message` starts blank. */
  mode?: "reminder" | "message";
  title?: string;
}

const MAX_CHARS = 300;

/**
 * Sends a collection reminder to one customer.
 *
 * Lives as its own button so any list showing a debt — analytics, the due book,
 * a customer profile — can offer the same reminder without duplicating the
 * drafting rules or the "no phone number" guard.
 */
export default function SmsReminderButton({
  name,
  phone,
  due,
  note,
  label = "তাগাদা",
  className = "btn btn-ghost btn-sm",
  mode = "reminder",
  title,
}: Props) {
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  // Shown inside the dialog rather than as a toast: running out of
  // credits is a fixable state, and the fix (buy credits) belongs next
  // to the message the user was about to send.
  const [error, setError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);

  const draft = () =>
    mode === "message"
      ? ""
      : [
      `প্রিয় ${name},`,
      due
        ? `আপনার কাছে আমাদের ${formatCurrency(due)} টাকা বাকি আছে${
            note ? ` (${note})` : ""
          }।`
        : "আপনার বাকি টাকাটা পরিশোধ করার অনুরোধ রইল।",
      "সুবিধামতো সময়ে পরিশোধ করে দিলে কৃতজ্ঞ থাকব। ধন্যবাদ।",
        ].join(" ");

  const handleOpen = () => {
    if (!phone) {
      toast.error(`${name}-এর ফোন নম্বর দেওয়া নেই, তাই এসএমএস পাঠানো যাবে না`, {
        label: "নম্বর যোগ করুন",
        href: "/dashboard/customers",
      });
      return;
    }
    setMessage(draft());
    setError(null);
    setOutOfCredits(false);
    setOpen(true);
  };

  const handleSend = async () => {
    if (!phone || !message.trim()) return;
    setSending(true);
    setError(null);
    setOutOfCredits(false);
    try {
      await ApiService.sendSmsNotification(phone, message.trim());
      toast.success(`${name}-কে এসএমএস পাঠানো হয়েছে`);
      setOpen(false);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      // The API returns 402 with a Bangla explanation for this case; older
      // deployments still send the English text, so both are recognised.
      const noCredit =
        text.includes("ক্রেডিট") ||
        text.toLowerCase().includes("insufficient sms credit") ||
        text.toLowerCase().includes("no sms credits");
      setOutOfCredits(noCredit);
      setError(text || "এসএমএস পাঠানো গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className}
        title={phone ? `${phone} নম্বরে তাগাদা দিন` : "ফোন নম্বর নেই"}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {label}
      </button>

      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">
                {title ?? (mode === "message" ? "এসএমএস পাঠান" : "তাগাদার এসএমএস")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="বন্ধ করুন"
                className="btn btn-ghost btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-3">
              {error && (
                <div
                  className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                    outOfCredits
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="block">{error}</span>
                    {outOfCredits && (
                      <Link
                        href="/dashboard/subscriptions"
                        className="mt-1.5 inline-flex font-medium underline"
                      >
                        ক্রেডিট কিনুন
                      </Link>
                    )}
                  </span>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="font-medium text-slate-900">{name}</div>
                <div className="num text-xs text-slate-500">
                  {phone}
                  {due ? ` · ${formatCurrency(due)} বাকি` : ""}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="sms-reminder-text">
                  মেসেজ
                </label>
                <textarea
                  id="sms-reminder-text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                  className="input min-h-28"
                  placeholder={
                    mode === "message"
                      ? "যা লিখতে চান লিখুন…"
                      : undefined
                  }
                />
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  {mode === "reminder" ? (
                    <button
                      type="button"
                      onClick={() => setMessage(draft())}
                      className="font-medium hover:text-slate-900"
                    >
                      আগের লেখাটা ফিরিয়ে আনুন
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="num">
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
                disabled={sending}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="btn btn-primary"
                disabled={sending || !message.trim()}
              >
                {sending ? "পাঠানো হচ্ছে…" : "পাঠান"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
