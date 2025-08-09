"use client";

import { useState, useCallback, useEffect } from "react";
import { calculateSmsSegments, formatSmsInfo } from "@/lib/utils/sms";
import { useSmsCredits } from "@/hooks/useSmsCredits";

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
      alert("Please enter a message");
      return;
    }

    // Check if user has enough credits
    if (credits < smsInfo.segments) {
      alert(`Insufficient SMS credits. You need ${smsInfo.segments} credits but only have ${credits}.`);
      return;
    }

    try {
      await onSend(message);
      // Refresh credits after successful send
      refetchCredits();
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  }, [message, recipientName, recipientPhone, smsInfo, onSend, credits, refetchCredits]);

  const getCharacterCountColor = () => {
    if (smsInfo.segments === 1) {
      const remaining = smsInfo.charactersPerSegment - smsInfo.characters;
      if (remaining <= 10) return "text-orange-400";
      return "text-slate-400";
    } else {
      return "text-cyan-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-cyan-400"
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
            Send SMS
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            To: {recipientName ? `${recipientName} (${recipientPhone})` : recipientPhone}
          </p>
          <div className="flex items-center gap-2 text-xs mt-2">
            <span className="text-slate-500">Available credits:</span>
            {creditsLoading ? (
              <span className="text-slate-400">Loading...</span>
            ) : (
              <span className={`font-semibold ${credits < smsInfo.segments ? 'text-red-400' : 'text-green-400'}`}>
                {credits}
              </span>
            )}
          </div>
        </div>

        {/* Message Composer */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Text Area */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message (Auto-generated)
              </label>
              <textarea
                value={message}
                onChange={handleMessageChange}
                placeholder="Type your message here..."
                rows={6}
                disabled={isLoading}
                readOnly={true}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed cursor-not-allowed"
                autoFocus
              />
            </div>

            {/* Character Counter */}
            <div className="flex justify-between items-center text-sm">
              <div className={`font-medium ${getCharacterCountColor()}`}>
                {formatSmsInfo(message)}
              </div>
              {smsInfo.encoding === 'Unicode' && (
                <div className="text-slate-500 text-xs">
                  Unicode (Bengali)
                </div>
              )}
            </div>

            {/* SMS Cost Information */}
            <div className={`border rounded-lg p-3 ${
              credits < smsInfo.segments 
                ? 'bg-red-900/20 border-red-500/50' 
                : 'bg-slate-800/30 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <svg
                  className={`w-4 h-4 ${credits < smsInfo.segments ? 'text-red-400' : 'text-cyan-400'}`}
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
                <span className="text-slate-300">
                  Cost: <span className={`font-semibold ${credits < smsInfo.segments ? 'text-red-400' : 'text-cyan-400'}`}>
                    {smsInfo.segments}
                  </span> SMS credit{smsInfo.segments > 1 ? 's' : ''}
                </span>
              </div>
              {smsInfo.segments > 1 && (
                <p className="text-xs text-slate-400 mt-1">
                  Long messages are split into multiple SMS segments
                </p>
              )}
              {credits < smsInfo.segments && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Insufficient credits! You need {smsInfo.segments - credits} more credit{smsInfo.segments - credits > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim() || credits < smsInfo.segments}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Sending...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                Send SMS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
