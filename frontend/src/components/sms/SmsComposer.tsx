"use client";

import { useState, useCallback, useEffect } from "react";
import { calculateSmsSegments, formatSmsInfo } from "@/lib/utils/sms";
import { useSmsCredits } from "@/hooks/useSmsCredits";
import { useToast } from "@/components/ui/Feedback";

interface SmsComposerProps {
  recipientName?: string;
  recipientPhone: string;
  initialMessage?: string;
  onSend: (message: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SmsComposer({
  recipientName,
  recipientPhone,
  initialMessage = "",
  onSend,
  onCancel,
  isLoading = false,
}: SmsComposerProps) {
  const [message, setMessage] = useState(initialMessage);
  const toast = useToast();
  const { credits, isLoading: creditsLoading, refetch: refetchCredits } = useSmsCredits();
  const smsInfo = calculateSmsSegments(message);

  // Update message when initialMessage changes
  useEffect(() => {
    setMessage(initialMessage);
    console.log("SMS Composer initialized with message:", initialMessage);
  }, [initialMessage]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    console.log("Message changed to:", newMessage);
    setMessage(newMessage);
  }, []);

  const handleSend = useCallback(async () => {
    if (!message.trim()) {
      toast.error("আগে মেসেজটা লিখুন");
      return;
    }

    // Check if user has enough credits
    if (credits < smsInfo.segments) {
      toast.error(`এসএমএস ক্রেডিট কম পড়ে গেছে। লাগবে ${smsInfo.segments}টা, আছে মাত্র ${credits}টা।`);
      return;
    }

    try {
      await onSend(message);
      // Refresh credits after successful send
      refetchCredits();
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  }, [message, recipientName, recipientPhone, smsInfo, onSend, credits, refetchCredits, toast]);

  const getCharacterCountColor = () => {
    if (smsInfo.segments === 1) {
      const remaining = smsInfo.charactersPerSegment - smsInfo.characters;
      if (remaining <= 10) return "text-amber-700";
      return "text-slate-500";
    } else {
      return "text-cyan-600";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="min-w-0">
            <h3 className="modal-title flex items-center gap-2">
              <svg
                className="h-4 w-4 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              এসএমএস পাঠান
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              যাকে পাঠাবেন: {recipientName ? `${recipientName} (${recipientPhone})` : recipientPhone}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 text-xs">
            <span className="text-slate-500">ক্রেডিট আছে:</span>
            {creditsLoading ? (
              <span className="text-slate-500">লোড হচ্ছে…</span>
            ) : (
              <span className={`num font-semibold ${credits < smsInfo.segments ? 'text-rose-600' : 'text-emerald-700'}`}>
                {credits}
              </span>
            )}
          </div>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <label className="label">মেসেজ (নিজে থেকেই লেখা হয়েছে)</label>
            <textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="এখানে মেসেজ লিখুন…"
              rows={6}
              disabled={isLoading}
              readOnly={true}
              className="textarea resize-none disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Character counter */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className={`num font-medium ${getCharacterCountColor()}`}>
              {formatSmsInfo(message)}
            </div>
            {smsInfo.encoding === 'Unicode' && (
              <div className="text-slate-500">
                ইউনিকোড (বাংলা)
              </div>
            )}
          </div>

          {/* SMS cost information */}
          <div className={`rounded-lg border p-3 ${
            credits < smsInfo.segments
              ? 'border-rose-200 bg-rose-50'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <svg
                className={`h-4 w-4 flex-shrink-0 ${credits < smsInfo.segments ? 'text-rose-600' : 'text-cyan-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-slate-600">
                খরচ হবে{" "}
                <span className={`num font-semibold ${credits < smsInfo.segments ? 'text-rose-600' : 'text-cyan-600'}`}>
                  {smsInfo.segments}
                </span>{" "}
                টা এসএমএস ক্রেডিট
              </span>
            </div>
            {smsInfo.segments > 1 && (
              <p className="mt-1 text-xs text-slate-500">
                লম্বা মেসেজ কয়েক ভাগে ভেঙে যায়, তাই ক্রেডিটও বেশি লাগে
              </p>
            )}
            {credits < smsInfo.segments && (
              <p className="mt-1 text-xs text-rose-600">
                ক্রেডিট কম পড়ে গেছে! আরও {smsInfo.segments - credits}টা ক্রেডিট লাগবে।
              </p>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            বাতিল
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim() || credits < smsInfo.segments}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                পাঠানো হচ্ছে…
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                এসএমএস পাঠান
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
