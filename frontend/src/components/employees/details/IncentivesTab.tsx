"use client";

import { num } from "@/lib/money";

import React, { useState, useEffect } from "react";
import { Trash2, X, RefreshCw, TrendingDown } from "lucide-react";
import { Incentive, CreateIncentiveData, IncentiveWithdrawal } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";
import employeeAPI from "@/lib/employeeAPI";
import { ApiService } from "@/lib/api";

interface IncentivesTabProps {
  incentives: Incentive[];
  employeeId: string;
  onIncentivesUpdate: (incentives: Incentive[]) => void;
  onRefresh?: () => void;
}

export default function IncentivesTab({ incentives, employeeId, onIncentivesUpdate, onRefresh }: IncentivesTabProps) {
  const formatCurrencyWithSymbol = useCurrencyFormatter();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [incentiveToDelete, setIncentiveToDelete] = useState<number | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState<IncentiveWithdrawal[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAddingIncentive, setIsAddingIncentive] = useState(false);
  const [isDeletingIncentive, setIsDeletingIncentive] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    hasNext: false,
    currentPage: 1,
    isLoadingMore: false,
  });
  
  const [newIncentive, setNewIncentive] = useState({
    title: "",
    description: "",
    amount: "",
    type: "bonus" as "bonus" | "commission" | "achievement" | "performance",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh incentives every 30 seconds to catch new ones from orders
  useEffect(() => {
    if (!onRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddIncentive = async () => {
    if (!newIncentive.title || !newIncentive.amount) return;
    
    setIsAddingIncentive(true);
    try {
      const incentiveData: CreateIncentiveData = {
        title: newIncentive.title,
        description: newIncentive.description,
        amount: parseFloat(newIncentive.amount),
        type: newIncentive.type,
        status: "pending",
      };

      const createdIncentive = await employeeAPI.createIncentive(parseInt(employeeId), incentiveData);
      onIncentivesUpdate([createdIncentive, ...incentives]);
      
      setShowIncentiveModal(false);
      setNewIncentive({
        title: "",
        description: "",
        amount: "",
        type: "bonus",
      });
      toast.success("ইনসেনটিভ যোগ হয়ে গেছে!");
    } catch (error) {
      console.error("Error adding incentive:", error);
      toast.error("ইনসেনটিভ যোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsAddingIncentive(false);
    }
  };

  const handleDeleteIncentive = async () => {
    if (!incentiveToDelete) return;
    
    setIsDeletingIncentive(true);
    try {
      await employeeAPI.deleteIncentive(incentiveToDelete);
      onIncentivesUpdate(incentives.filter(inc => inc.id !== incentiveToDelete));
      setShowDeleteModal(false);
      setIncentiveToDelete(null);
      toast.success("ইনসেনটিভ ডিলিট হয়ে গেছে!");
    } catch (error) {
      console.error("Error deleting incentive:", error);
      toast.error("ইনসেনটিভ ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsDeletingIncentive(false);
    }
  };

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setIsLoadingHistory(true);
      else setHistoryPagination(prev => ({ ...prev, isLoadingMore: true }));
      
      const data = await ApiService.getWithdrawalHistory(parseInt(employeeId), { 
        page, 
        page_size: 10 
      });
      
      if (Array.isArray(data)) {
        setWithdrawalHistory(append ? [...withdrawalHistory, ...data] : data);
        setHistoryPagination({ hasNext: false, currentPage: page, isLoadingMore: false });
      } else if (data && data.results && Array.isArray(data.results)) {
        setWithdrawalHistory(append ? [...withdrawalHistory, ...data.results] : data.results);
        setHistoryPagination({ 
          hasNext: !!data.next, 
          currentPage: page, 
          isLoadingMore: false 
        });
      } else {
        setWithdrawalHistory([]);
        setHistoryPagination({ hasNext: false, currentPage: page, isLoadingMore: false });
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      if (!append) setWithdrawalHistory([]);
      setHistoryPagination(prev => ({ ...prev, isLoadingMore: false }));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMoreHistory = () => {
    if (!historyPagination.isLoadingMore && historyPagination.hasNext) {
      fetchWithdrawalHistory(historyPagination.currentPage + 1, true);
    }
  };

  useEffect(() => {
    fetchWithdrawalHistory();
  }, [employeeId]);

  // Calculate total available for withdrawal (only paid incentives)
  const totalAvailableForWithdrawal = incentives
    .filter(inc => inc.status === 'paid' && inc.amount > 0)
    .reduce((sum, inc) => sum + num(inc.amount), 0);

  const handleOpenWithdrawModal = () => {
    setWithdrawalAmount('');
    setShowWithdrawModal(true);
  };

  const processWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("০ এর বেশি একটা ঠিকঠাক টাকার পরিমাণ দিন");
      return;
    }

    if (amount > totalAvailableForWithdrawal) {
      toast.error(`যত টাকা জমা আছে (${formatCurrencyWithSymbol(totalAvailableForWithdrawal)}) তার বেশি তোলা যাবে না`);
      return;
    }

    try {
      setIsWithdrawing(true);

      const response = await ApiService.withdrawFromEmployee(parseInt(employeeId), {
        amount: amount,
        reason: `Incentive withdrawal by employee`
      });

      // Close modal and reset state
      setShowWithdrawModal(false);
      setWithdrawalAmount('');

      toast.success(`${formatCurrencyWithSymbol(amount)} তোলা হয়েছে। বাকি আছে: ${formatCurrencyWithSymbol(response.remaining_total)}`);
      
      // Refresh the data to get the updated values from server
      if (onRefresh) {
        onRefresh();
      }

      // Refresh withdrawal history from first page
      await fetchWithdrawalHistory(1, false);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("টাকা তোলা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const cancelWithdrawal = () => {
    setShowWithdrawModal(false);
    setWithdrawalAmount('');
  };

  const statusLabel = (status: Incentive["status"]) => {
    if (status === "paid") return "পরিশোধ";
    if (status === "approved") return "অনুমোদিত";
    return "বাকি আছে";
  };

  const statusBadge = (status: Incentive["status"]) => {
    if (status === "paid") return "badge badge-success";
    if (status === "approved") return "badge badge-info";
    return "badge badge-warn";
  };

  return (
    <>
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">এখন তোলা যাবে</div>
          <div className="stat-value num">{formatCurrencyWithSymbol(totalAvailableForWithdrawal)}</div>
          <div className="stat-meta">শুধু পরিশোধ হওয়া ইনসেনটিভ থেকে</div>
        </div>
        <div className="stat">
          <div className="stat-label">মোট ইনসেনটিভ</div>
          <div className="stat-value num">{incentives.length}</div>
          <div className="stat-meta">সব মিলিয়ে</div>
        </div>
      </div>

      <div className="plane-section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="section-title mb-0">ইনসেনটিভ আর বোনাস</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenWithdrawModal}
              disabled={totalAvailableForWithdrawal <= 0}
              className="btn btn-ghost btn-sm"
            >
              <TrendingDown className="h-4 w-4" />
              টাকা তুলুন
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-ghost btn-sm"
              title="নতুন অর্ডার থেকে ইনসেনটিভ এসেছে কিনা দেখুন"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'রিফ্রেশ হচ্ছে…' : 'রিফ্রেশ'}
            </button>
            <button
              onClick={() => setShowIncentiveModal(true)}
              className="btn btn-primary btn-sm"
            >
              ইনসেনটিভ যোগ করুন
            </button>
          </div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>তারিখ</th>
              <th>কারণ / বিবরণ</th>
              <th>অবস্থা</th>
              <th className="cell-num">টাকার পরিমাণ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incentives.length > 0 ? (
              incentives.map((incentive) => (
                <tr key={incentive.id}>
                  <td className="whitespace-nowrap">{formatDate(incentive.date_awarded)}</td>
                  <td>
                    <div className="cell-strong">{incentive.title}</div>
                    {incentive.description && (
                      <div className="text-slate-500">{incentive.description}</div>
                    )}
                  </td>
                  <td>
                    <span className={statusBadge(incentive.status)}>
                      {statusLabel(incentive.status)}
                    </span>
                  </td>
                  <td className="cell-num money-pos">
                    {formatCurrencyWithSymbol(incentive.amount)}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        setIncentiveToDelete(incentive.id);
                        setShowDeleteModal(true);
                      }}
                      className="text-slate-500 hover:text-cyan-600"
                      title="ইনসেনটিভ ডিলিট করুন"
                      aria-label="ইনসেনটিভ ডিলিট করুন"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty">
                    <p>এখনো কোনো ইনসেনটিভ নেই।</p>
                    <p className="mt-1">
                      বিক্রির অর্ডার থেকে ইনসেনটিভ নিজে নিজেই এখানে চলে আসবে, চাইলে হাতেও যোগ করতে পারেন।
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="btn btn-ghost btn-sm"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'দেখা হচ্ছে…' : 'অর্ডার দেখে নিন'}
                      </button>
                      <button
                        onClick={() => setShowIncentiveModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        হাতে ইনসেনটিভ যোগ করুন
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Withdrawal History */}
      <div className="plane-section border-t border-slate-200">
        <div className="section-title mb-0">টাকা তোলার হিস্ট্রি</div>
      </div>

      {isLoadingHistory ? (
        <div className="empty">টাকা তোলার হিস্ট্রি লোড হচ্ছে…</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th className="cell-num">টাকার পরিমাণ</th>
                <th>কারণ</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalHistory.length > 0 ? (
                withdrawalHistory.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="whitespace-nowrap">{formatDate(withdrawal.withdrawal_date)}</td>
                    <td className="cell-num money-neg">
                      {formatCurrencyWithSymbol(withdrawal.amount)}
                    </td>
                    <td>
                      <div>{withdrawal.reason || 'ইনসেনটিভ থেকে তোলা'}</div>
                      {withdrawal.notes && (
                        <div className="text-slate-500">{withdrawal.notes}</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>
                    <div className="empty">
                      <p>এখনো কোনো টাকা তোলা হয়নি।</p>
                      <p className="mt-1">টাকা তুললে এখানে দেখতে পাবেন।</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More Button */}
      {!isLoadingHistory && withdrawalHistory.length > 0 && historyPagination.hasNext && (
        <div className="plane-section border-t border-slate-200">
          <button
            onClick={loadMoreHistory}
            disabled={historyPagination.isLoadingMore}
            className="btn btn-ghost btn-sm w-full"
          >
            {historyPagination.isLoadingMore ? 'আরও আসছে…' : 'আরও দেখুন'}
          </button>
        </div>
      )}

      {/* Add Incentive Modal */}
      {showIncentiveModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">হাতে ইনসেনটিভ যোগ করুন</h2>
              <button
                type="button"
                onClick={() => setShowIncentiveModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Incentive Title */}
              <div>
                <label className="label">কারণ / নাম *</label>
                <input
                  type="text"
                  value={newIncentive.title}
                  onChange={(e) =>
                    setNewIncentive({ ...newIncentive, title: e.target.value })
                  }
                  className="input"
                  placeholder="কীসের ইনসেনটিভ লিখুন"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">বিবরণ</label>
                <textarea
                  value={newIncentive.description}
                  onChange={(e) =>
                    setNewIncentive({ ...newIncentive, description: e.target.value })
                  }
                  rows={3}
                  className="textarea resize-none"
                  placeholder="চাইলে বিস্তারিত লিখতে পারেন"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="label">টাকার পরিমাণ *</label>
                <input
                  type="number"
                  value={newIncentive.amount}
                  onChange={(e) =>
                    setNewIncentive({ ...newIncentive, amount: e.target.value })
                  }
                  className="input"
                  placeholder="কত টাকা লিখুন"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowIncentiveModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAddIncentive}
                disabled={
                  isAddingIncentive ||
                  !newIncentive.title ||
                  !newIncentive.amount
                }
                className="btn btn-primary"
              >
                {isAddingIncentive ? "যোগ হচ্ছে…" : "ইনসেনটিভ যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incentive Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">ইনসেনটিভ ডিলিট করবেন?</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm text-slate-600">
                এই ইনসেনটিভটা ডিলিট করে দেবেন? এটা আর ফেরানো যাবে না।
              </p>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteIncentive}
                disabled={isDeletingIncentive}
                className="btn btn-danger"
              >
                {isDeletingIncentive ? "ডিলিট হচ্ছে…" : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h3 className="modal-title">ইনসেনটিভ থেকে টাকা তুলুন</h3>
              <button
                type="button"
                onClick={cancelWithdrawal}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div>
                <p className="text-sm text-slate-600">
                  জমা থাকা ইনসেনটিভ থেকে টাকা তুলতে পারবেন
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-600">এখন তোলা যাবে</span>
                  <span className="num font-semibold text-slate-900">
                    {formatCurrencyWithSymbol(totalAvailableForWithdrawal)}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="withdrawalAmount" className="label">
                  কত টাকা তুলবেন
                </label>
                <input
                  type="number"
                  id="withdrawalAmount"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="টাকার পরিমাণ লিখুন"
                  min="0"
                  max={totalAvailableForWithdrawal}
                  step="0.01"
                  className="input"
                />
                <p className="mt-1 text-xs text-slate-500">
                  সর্বোচ্চ: {formatCurrencyWithSymbol(totalAvailableForWithdrawal)}
                </p>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={cancelWithdrawal}
                disabled={isWithdrawing}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={processWithdrawal}
                disabled={isWithdrawing || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                className="btn btn-primary"
              >
                {isWithdrawing ? "হচ্ছে…" : "টাকা তুলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
