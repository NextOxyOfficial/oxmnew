import { ApiService } from "@/lib/api";
import { useEffect, useState } from "react";

export interface SmsCreditsData {
  sms_credits?: number;
  credits?: number;
  balance?: number;
}

export const useSmsCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const creditsData = await ApiService.getSmsCredits();
      console.log("SMS Credits response:", creditsData);

      // Handle different response formats
      let parsedCredits = 0;
      if (typeof creditsData === "number") {
        parsedCredits = creditsData;
      } else if (creditsData && typeof creditsData.credits === "number") {
        parsedCredits = creditsData.credits;
      } else if (creditsData && typeof creditsData.sms_credits === "number") {
        parsedCredits = creditsData.sms_credits;
      } else if (creditsData && typeof creditsData.balance === "number") {
        parsedCredits = creditsData.balance;
      }

      setCredits(parsedCredits);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch SMS credits"
      );
      console.error("Error fetching SMS credits:", err);
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const refetch = () => {
    fetchCredits();
  };

  return {
    credits,
    isLoading,
    error,
    refetch,
  };
};
