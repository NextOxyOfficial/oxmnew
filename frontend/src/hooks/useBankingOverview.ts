import { useState, useEffect } from "react";
import { bankingAPI, BankingOverviewStats } from "@/lib/api/banking";

export const useBankingOverview = () => {
  const [overview, setOverview] = useState<BankingOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await bankingAPI.getBankingOverview();
      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch banking overview"
      );
      console.error("Error fetching banking overview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const refetch = () => {
    fetchOverview();
  };

  return {
    overview,
    isLoading,
    error,
    refetch,
  };
};
