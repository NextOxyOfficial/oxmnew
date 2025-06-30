"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ApiService } from "@/lib/api";

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

  const fetchCurrencySettings = async () => {
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
    fetchCurrencySettings();
  }, []);

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

// Utility function to format currency with the current symbol
export function formatCurrency(
  amount: number | string,
  symbol?: string
): string {
  const numAmount =
    typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  const currentSymbol = symbol || "$"; // fallback to USD symbol

  // Format number with 2 decimal places
  const formattedAmount = numAmount.toFixed(2);

  return `${currentSymbol}${formattedAmount}`;
}
