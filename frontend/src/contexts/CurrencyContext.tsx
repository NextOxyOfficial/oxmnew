"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  setCurrency: (currency: string, symbol: string) => void;
  isLoading: boolean;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

// Currency code to symbol mapping (fallback for when backend doesn't provide symbol)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  BDT: "৳",
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<string>("USD");
  const [currencySymbol, setCurrencySymbolState] = useState<string>("$");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const fetchCurrencySettings = async () => {
    // Only fetch settings if user is authenticated
    if (!isAuthenticated) {
      // Use default values when not authenticated
      setCurrencyState("USD");
      setCurrencySymbolState("$");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await ApiService.getSettings();
      const settings = response.settings;

      const currencyCode = settings.currency || "USD";
      const symbol =
        settings.currency_symbol || CURRENCY_SYMBOLS[currencyCode] || "$";

      setCurrencyState(currencyCode);
      setCurrencySymbolState(symbol);
    } catch (error) {
      console.error("Failed to fetch currency settings:", error);
      // Use defaults on error
      setCurrencyState("USD");
      setCurrencySymbolState("$");
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = (newCurrency: string, newSymbol: string) => {
    setCurrencyState(newCurrency);
    setCurrencySymbolState(newSymbol);
  };

  const refreshCurrency = async () => {
    await fetchCurrencySettings();
  };

  useEffect(() => {
    // Only fetch currency settings after auth is loaded
    if (!authLoading) {
      fetchCurrencySettings();
    }
  }, [isAuthenticated, authLoading]);

  const value: CurrencyContextType = {
    currency,
    currencySymbol,
    setCurrency,
    isLoading,
    refreshCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

// Hook to get a currency formatter with the current symbol
export function useCurrencyFormatter() {
  const { currencySymbol } = useCurrency();

  return (amount: number | string | null | undefined): string => {
    // Handle null, undefined, or empty values
    if (amount === null || amount === undefined || amount === "") {
      return `${currencySymbol}0.00`;
    }

    const numAmount =
      typeof amount === "string" ? parseFloat(amount) || 0 : amount;

    // Ensure we have a valid number
    const validAmount =
      typeof numAmount === "number" && !isNaN(numAmount) ? numAmount : 0;

    // Format number with 2 decimal places
    const formattedAmount = validAmount.toFixed(2);

    return `${currencySymbol}${formattedAmount}`;
  };
}

// Utility function to format currency with the current symbol
export function formatCurrency(
  amount: number | string | null | undefined,
  symbol?: string
): string {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === "") {
    return `${symbol || "$"}0.00`;
  }

  const numAmount =
    typeof amount === "string" ? parseFloat(amount) || 0 : amount;

  // Ensure we have a valid number
  const validAmount =
    typeof numAmount === "number" && !isNaN(numAmount) ? numAmount : 0;

  // Format number with 2 decimal places
  const formattedAmount = validAmount.toFixed(2);

  return `${symbol || "$"}${formattedAmount}`;
}
