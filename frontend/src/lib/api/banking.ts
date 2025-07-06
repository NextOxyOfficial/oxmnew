import { API_BASE_URL } from "./config";
import { AuthToken } from "../api";
import { BankAccount, Transaction } from "@/types/banking";

export interface BankingOverviewStats {
  total_accounts: number;
  total_balance: number;
  accounts: BankAccount[];
  monthly_change_percentage: number;
}

// API functions
export const bankingAPI = {
  // Helper function to get headers with auth
  getHeaders: () => {
    const token = AuthToken.get();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Token ${token}` }),
    };
  },

  // Get all bank accounts
  getAccounts: async (): Promise<BankAccount[]> => {
    const response = await fetch(`${API_BASE_URL}/banking/accounts/`, {
      headers: bankingAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bank accounts");
    }

    return response.json();
  },

  // Get banking overview statistics
  getBankingOverview: async (): Promise<BankingOverviewStats> => {
    // Since there's no overview endpoint, we'll calculate from accounts
    const accounts = await bankingAPI.getAccounts();
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    return {
      total_accounts: accounts.length,
      total_balance: totalBalance,
      accounts: accounts.slice(0, 4), // Show first 4 accounts
      monthly_change_percentage: 2.3, // Mock value for now
    };
  },

  // Get a specific bank account
  getAccount: async (id: string): Promise<BankAccount> => {
    const response = await fetch(
      `${API_BASE_URL}/banking/accounts/${id}/`,
      {
        headers: bankingAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bank account");
    }

    return response.json();
  },

  // Get all transactions
  getTransactions: async (params?: {
    account?: string;
    type?: string;
    status?: string;
    search?: string;
  }): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams();
    if (params?.account) queryParams.append("account", params.account);
    if (params?.type && params.type !== "all")
      queryParams.append("type", params.type);
    if (params?.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(
      `${API_BASE_URL}/banking/transactions/?${queryParams}`,
      {
        headers: bankingAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    return response.json();
  },

  // Create a new bank account
  createAccount: async (data: {
    name: string;
    balance?: number;
  }): Promise<BankAccount> => {
    const response = await fetch(`${API_BASE_URL}/banking/accounts/`, {
      method: "POST",
      headers: bankingAPI.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create bank account");
    }

    return response.json();
  },

  // Create a new transaction
  createTransaction: async (data: {
    account: string;
    type: "credit" | "debit";
    amount: number;
    purpose: string;
    verified_by?: string;
    status?: "pending" | "verified";
  }): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/banking/transactions/`, {
      method: "POST",
      headers: bankingAPI.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }

    return response.json();
  },

  // Update a bank account
  updateAccount: async (
    id: string,
    data: { name: string }
  ): Promise<BankAccount> => {
    const response = await fetch(
      `${API_BASE_URL}/banking/accounts/${id}/`,
      {
        method: "PATCH",
        headers: bankingAPI.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update bank account");
    }

    return response.json();
  },

  // Delete a bank account
  deleteAccount: async (id: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/banking/accounts/${id}/`,
      {
        method: "DELETE",
        headers: bankingAPI.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete bank account");
    }
  },
};
