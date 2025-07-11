// Banking Types
export interface BankAccount {
  id: string;
  name: string;
  owner: number;
  owner_name: string;
  owner_username: string;
  balance: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  transaction_count: number;
  total_credits: number;
  total_debits: number;
}

export interface Transaction {
  id: string;
  account: string;
  type: "debit" | "credit";
  amount: number;
  purpose: string;
  verified_by: string | null;
  status: "pending" | "verified" | "cancelled";
  date: string;
  updated_at: string;
  reference_number: string;
  verified_by_details?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  account_name: string;
}

export interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

export interface Employee {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface AccountSummary {
  account_id: string;
  account_name: string;
  current_balance: number;
  total_credits: number;
  total_debits: number;
  transaction_count: number;
  created_at: string;
}

export interface DashboardStats {
  total_transactions: number;
  verified_transactions: number;
  pending_transactions: number;
  total_credits: number;
  total_debits: number;
  net_amount: number;
}

export interface TransactionFilters {
  type?: "credit" | "debit" | "all";
  status?: "pending" | "verified" | "cancelled" | "all";
  date_from?: string;
  date_to?: string;
  search?: string;
  verified_by?: string;
}

export interface CreateTransactionData {
  account: string;
  type: "credit" | "debit";
  amount: number;
  purpose: string;
  verified_by: string | null;
  status?: "pending" | "verified";
}

export interface CreateAccountData {
  name: string;
  balance?: number;
}

export interface UpdateAccountData {
  name: string;
}
