"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import type { BankAccount } from "@/types/banking";
import {
  Building2,
  Crown,
  DollarSign,
  Loader2,
  Plus,
  Shield,
  X,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function BankingNewPage() {
  const { isAuthenticated, loading: authLoading, user, profile } = useAuth();
  const { currency } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
  const router = useRouter();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // User subscription state
  const [userSubscription, setUserSubscription] = useState<string>("free");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Function to load user subscription status
  const loadUserSubscription = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const subscriptionData = await ApiService.getMySubscription();

      if (subscriptionData?.success && subscriptionData?.subscription?.plan?.name) {
        setUserSubscription(subscriptionData.subscription.plan.name.toLowerCase());
      } else {
        setUserSubscription("free");
      }
    } catch (error) {
      console.error("Failed to load user subscription:", error);
      setUserSubscription("free");
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Check if user is premium
  const isPremiumUser = userSubscription !== "free" && userSubscription !== "";

  // Generate 10-digit account number
  const generateAccountNumber = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  // Load bank accounts
  const loadAccounts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getBankAccounts();
      console.log("Bank accounts loaded:", response);
      setAccounts(response || []);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      setError("অ্যাকাউন্টগুলো লোড করা যায়নি");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Load user subscription on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSubscription();
    }
  }, [isAuthenticated, user, loadUserSubscription]);

  // Debug profile data in main component
  useEffect(() => {
    console.log('Main Component Profile:', profile);
    console.log('Main Profile properties:', profile ? Object.keys(profile) : 'null');
    console.log('User Subscription:', userSubscription);
    console.log('Is Premium User:', isPremiumUser);
    console.log('User:', user);
  }, [profile, user, userSubscription, isPremiumUser]);

  // Create new bank account
  const handleCreateAccount = async (accountData: any) => {
    try {
      const accountNumber = generateAccountNumber();

      // Convert initial_balance to balance and ensure it's a number
      const payload = {
        name: accountData.name,
        account_number: accountNumber,
        balance: parseFloat(accountData.initial_balance) || 0,
        is_active: accountData.is_active !== undefined ? accountData.is_active : true,
      };

      console.log("Creating account with payload:", payload);

      const newAccount = await ApiService.createBankAccount(payload);

      console.log("Account created successfully:", newAccount);

      await loadAccounts();
      setShowCreateModal(false);
      setError(null); // Clear any previous errors

      // Navigate to the new account page
      router.push(`/dashboard/banking/${accountNumber}`);
    } catch (error: any) {
      console.error("Error creating bank account:", error);

      // Extract error message from response
      let errorMessage = "অ্যাকাউন্ট খোলা যায়নি";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    }
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter((account) =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance?.toString() || "0"),
    0
  );

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="empty">ব্যাংকিং দেখতে হলে আগে লগইন করুন।</div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">ব্যাংকিং</h1>
          <p className="page-sub">অ্যাকাউন্ট আর টাকার হিসাব এক জায়গায়</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/banking/loans" className="btn btn-ghost">
          <Landmark className="h-4 w-4" /> লোন ও কিস্তি
        </Link>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" /> নতুন অ্যাকাউন্ট
        </button>
        </div>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট অ্যাকাউন্ট</div>
            <div className="stat-value num">{accounts.length}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">Active অ্যাকাউন্ট</div>
            <div className="stat-value num">
              {accounts.filter((acc) => acc.is_active).length}
            </div>
            <div className="stat-meta">এখন চালু আছে</div>
          </div>
          <div className="stat">
            <div className="stat-label">মোট ব্যালেন্স</div>
            <div className="stat-value num">{formatCurrency(totalBalance)}</div>
            <div className="stat-meta">সব অ্যাকাউন্ট মিলিয়ে</div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="plane-section flex items-start gap-2">
            <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
            <p className="text-sm font-medium text-rose-600">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="plane-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input max-w-xs"
            placeholder="অ্যাকাউন্টের নাম বা নম্বর দিয়ে খুঁজুন"
            aria-label="অ্যাকাউন্ট খুঁজুন"
          />
        </div>

        {/* Accounts table */}
        {filteredAccounts.length > 0 ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>অ্যাকাউন্ট</th>
                  <th>অ্যাকাউন্ট নম্বর</th>
                  <th className="cell-num">ব্যালেন্স</th>
                  <th>অবস্থা</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="cell-strong">
                      {/* The name is the natural thing to click — the দেখুন
                          button at the far right is a long mouse trip away. */}
                      <Link
                        href={`/dashboard/banking/${account.id}`}
                        className="flex items-center gap-2 hover:text-cyan-700"
                      >
                        <Building2 className="h-4 w-4 flex-shrink-0 text-slate-500" />
                        <span className="truncate" title={account.name}>
                          {account.name}
                        </span>
                      </Link>
                    </td>
                    <td className="num">
                      #{account.account_number || account.id}
                    </td>
                    <td className="cell-num">
                      {formatCurrency(
                        parseFloat(account.balance?.toString() || "0")
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          account.is_active ? "badge-success" : "badge-muted"
                        }`}
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/banking/${
                          account.account_number || account.id
                        }`}
                        className="btn btn-ghost btn-sm"
                      >
                        দেখুন
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="mb-3">
              {searchTerm
                ? "খোঁজার সাথে মেলে এমন কোনো অ্যাকাউন্ট নেই।"
                : "এখনো কোনো অ্যাকাউন্ট খোলা হয়নি।"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" /> প্রথম অ্যাকাউন্ট খুলুন
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateBankAccountModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAccount}
          isPremium={isPremiumUser}
          accounts={accounts}
          currency={currency}
        />
      )}
    </div>
  );
}

// Create Bank Account Modal Component
function CreateBankAccountModal({ isOpen, onClose, onSubmit, isPremium, accounts, currency }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPremium: boolean;
  accounts: BankAccount[];
  currency: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    initial_balance: "" as string | number,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Debug subscription data
  console.log('Modal isPremium:', isPremium);
  console.log('Modal accounts length:', accounts.length);

  const handleSubscriptionRedirect = () => {
    onClose();
    setModalError(null);
    // Redirect to subscription page
    window.location.href = '/dashboard/subscriptions';
  };

  // Reset form and error when modal opens/closes
  const handleClose = () => {
    setFormData({ name: "", initial_balance: "", is_active: true });
    setModalError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("অ্যাকাউন্টের নাম দিতে হবে");
      return;
    }

    setLoading(true);
    setModalError(null);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error("Error in modal submit:", error);
      // Extract error message
      let errorMessage = "অ্যাকাউন্ট খোলা যায়নি";
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setModalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">নতুন অ্যাকাউন্ট খুলুন</h2>
          <button
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {modalError && (
              <p className="text-sm font-medium text-rose-600">{modalError}</p>
            )}

            <div>
              <label className="label" htmlFor="account-name">
                অ্যাকাউন্টের নাম *
              </label>
              <input
                id="account-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="যেমন: মেইন অ্যাকাউন্ট"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="account-initial-balance">
                শুরুর ব্যালেন্স
              </label>
              <input
                id="account-initial-balance"
                type="number"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                onFocus={(e) => {
                  if (e.target.value === "0" || e.target.value === "") {
                    setFormData({ ...formData, initial_balance: "" });
                  }
                }}
                className="input num"
                placeholder={currency === 'USD' ? '$0.00' : currency === 'EUR' ? '€0.00' : currency === 'GBP' ? '£0.00' : currency === 'BDT' ? '৳0.00' : '0.00'}
                step="0.01"
                min="0"
              />
              <p className="mt-1 text-xs text-slate-500">
                নতুন অ্যাকাউন্টে শুরুতে কত টাকা আছে
              </p>
            </div>

            {/* User plan status */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-start gap-2">
                {isPremium ? (
                  <Crown className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                ) : (
                  <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-600">
                      আপনি একজন {isPremium ? 'প্রো ইউজার' : 'ফ্রি ইউজার'}
                    </p>
                    <span className={`badge ${isPremium ? 'badge-warn' : 'badge-info'}`}>
                      {isPremium ? 'প্রো' : 'ফ্রি'}
                    </span>
                  </div>
                  {isPremium ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {accounts.length >= 15 ? (
                        <span className="text-rose-600">
                          প্রো প্ল্যানের লিমিট শেষ (15/15 অ্যাকাউন্ট)
                        </span>
                      ) : (
                        `আর ${15 - accounts.length}টা অ্যাকাউন্ট খুলতে পারবেন (${accounts.length}/15 হয়ে গেছে)`
                      )}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {accounts.length >= 1
                        ? 'ফ্রি প্ল্যানের লিমিট শেষ (1/1 অ্যাকাউন্ট)'
                        : 'ফ্রি প্ল্যান — একটা মেইন অ্যাকাউন্ট খুলতে পারবেন'}
                    </p>
                  )}
                </div>
              </div>

              {!isPremium && (
                <p className="mt-3 text-xs text-slate-500">
                  প্রো নিলে 15টা পর্যন্ত অ্যাকাউন্ট খোলা যাবে, সাথে বাড়তি ব্যাংকিং সুবিধা আর আগে সাপোর্ট।
                </p>
              )}

              {isPremium && accounts.length >= 13 && (
                <p className="mt-3 text-xs text-amber-700">
                  সাবধান — 15টা অ্যাকাউন্টের লিমিটের কাছাকাছি চলে এসেছেন ({accounts.length}/15)।
                </p>
              )}
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" onClick={handleClose} className="btn btn-ghost">
              বাতিল
            </button>

            {(!isPremium && accounts.length >= 1) ? (
              <button
                type="button"
                onClick={handleSubscriptionRedirect}
                className="btn btn-primary"
              >
                <DollarSign className="h-4 w-4" /> প্রো নিন
              </button>
            ) : (isPremium && accounts.length >= 15) ? (
              <button type="button" disabled={true} className="btn btn-primary">
                <X className="h-4 w-4" /> লিমিট শেষ
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> খোলা হচ্ছে…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> অ্যাকাউন্ট খুলুন
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
