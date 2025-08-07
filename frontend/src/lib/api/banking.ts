import { BankAccount, Transaction } from "@/types/banking";
import { AuthToken } from "../api";
import { API_BASE_URL } from "./config";

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
    try {
      const response = await fetch(`${API_BASE_URL}/banking/accounts/`, {
        headers: bankingAPI.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bank accounts: ${response.status}`);
      }

      const data = await response.json();

      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      return []; // Return empty array on error
    }
  },

  // Get user's accounts (triggers account creation if needed)
  getMyAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/banking/accounts/my_accounts/`,
        {
          headers: bankingAPI.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch my bank accounts: ${response.status}`);
      }

      const data = await response.json();

      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching my bank accounts:", error);
      return []; // Return empty array on error
    }
  },

  // Get banking overview statistics
  getBankingOverview: async (): Promise<BankingOverviewStats> => {
    try {
      // Use getMyAccounts to ensure main account is created
      const accounts = await bankingAPI.getMyAccounts();

      // Ensure accounts is an array
      const accountsArray = Array.isArray(accounts) ? accounts : [];

      const totalBalance = accountsArray.reduce((sum, account) => {
        // Handle balance as string or number
        const balance =
          typeof account.balance === "string"
            ? parseFloat(account.balance)
            : account.balance || 0;
        return sum + balance;
      }, 0);

      return {
        total_accounts: accountsArray.length,
        total_balance: totalBalance,
        accounts: accountsArray.slice(0, 4), // Show first 4 accounts
        monthly_change_percentage: 2.3, // Mock value for now
      };
    } catch (error) {
      console.error("Error fetching banking overview:", error);
      // Return default values if API call fails
      return {
        total_accounts: 0,
        total_balance: 0,
        accounts: [],
        monthly_change_percentage: 0,
      };
    }
  },

  // Get a specific bank account
  getAccount: async (id: string): Promise<BankAccount> => {
    const response = await fetch(`${API_BASE_URL}/banking/accounts/${id}/`, {
      headers: bankingAPI.getHeaders(),
    });

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
    const response = await fetch(`${API_BASE_URL}/banking/accounts/${id}/`, {
      method: "PATCH",
      headers: bankingAPI.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update bank account");
    }

    return response.json();
  },

  // Delete a bank account
  deleteAccount: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/banking/accounts/${id}/`, {
      method: "DELETE",
      headers: bankingAPI.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete bank account");
    }
  },
};
