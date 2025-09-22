import { ApiService } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface RecentSmsMessage {
  id: number;
  recipient: string;
  message: string;
  status: string;
  sms_count: number;
  sent_at: string;
}

interface UseRecentSmsReturn {
  recentSms: RecentSmsMessage | null;
  isLoadingRecentSms: boolean;
  recentSmsError: string | null;
  refetchRecentSms: () => void;
}

export const useRecentSms = (): UseRecentSmsReturn => {
  const [recentSms, setRecentSms] = useState<RecentSmsMessage | null>(null);
  const [isLoadingRecentSms, setIsLoadingRecentSms] = useState(true);
  const [recentSmsError, setRecentSmsError] = useState<string | null>(null);

  const fetchRecentSms = useCallback(async () => {
    try {
      setIsLoadingRecentSms(true);
      setRecentSmsError(null);

      // Fetch the first page of SMS history to get the most recent SMS
      const smsHistoryData = await ApiService.getSmsHistory(1);
      console.log("Recent SMS data received:", smsHistoryData);

      // Extract the most recent SMS from the results
      if (smsHistoryData && smsHistoryData.results && smsHistoryData.results.length > 0) {
        const mostRecentSms = smsHistoryData.results[0];
        setRecentSms(mostRecentSms);
      } else {
        setRecentSms(null);
      }
    } catch (error) {
      console.error("Error fetching recent SMS:", error);
      setRecentSmsError("Failed to load recent SMS");
      setRecentSms(null);
    } finally {
      setIsLoadingRecentSms(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSms();
  }, [fetchRecentSms]);

  return {
    recentSms,
    isLoadingRecentSms,
    recentSmsError,
    refetchRecentSms: fetchRecentSms,
  };
};
