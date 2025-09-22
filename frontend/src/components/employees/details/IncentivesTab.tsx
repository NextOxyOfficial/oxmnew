"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X, RefreshCw } from "lucide-react";
import { Incentive, CreateIncentiveData } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import employeeAPI from "@/lib/employeeAPI";

interface IncentivesTabProps {
  incentives: Incentive[];
  employeeId: string;
  onIncentivesUpdate: (incentives: Incentive[]) => void;
  onRefresh?: () => void;
}

export default function IncentivesTab({ incentives, employeeId, onIncentivesUpdate, onRefresh }: IncentivesTabProps) {
  const formatCurrencyWithSymbol = useCurrencyFormatter();
  const [mounted, setMounted] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incentiveToDelete, setIncentiveToDelete] = useState<number | null>(null);
  const [isAddingIncentive, setIsAddingIncentive] = useState(false);
  const [isDeletingIncentive, setIsDeletingIncentive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
      alert("Incentive added successfully!");
    } catch (error) {
      console.error("Error adding incentive:", error);
      alert("Failed to add incentive. Please try again.");
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
      alert("Incentive deleted successfully!");
    } catch (error) {
      console.error("Error deleting incentive:", error);
      alert("Failed to delete incentive. Please try again.");
    } finally {
      setIsDeletingIncentive(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-slate-100">
              Incentives & Bonuses
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                title="Refresh incentives from recent orders"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowIncentiveModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
              >
                Add Incentive
              </button>
            </div>
          </div>

          <div className="max-w-6xl">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
              {incentives.length > 0 ? (
                <>
                  {/* Table Header */}
                  <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                    <div className="grid grid-cols-10 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-3">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-white/5">
                    {incentives.map((incentive) => (
                      <div
                        key={incentive.id}
                        className="px-6 py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="grid grid-cols-10 gap-4 items-center">
                          <div className="col-span-3">
                            <p className="text-sm font-medium text-slate-100">
                              {formatDate(incentive.date_awarded)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                incentive.status === "paid"
                                  ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                  : incentive.status === "approved"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30"
                              }`}
                            >
                              {incentive.status}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-semibold text-green-300">
                              {formatCurrencyWithSymbol(incentive.amount)}
                            </p>
                          </div>
                          <div className="col-span-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setIncentiveToDelete(incentive.id);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete incentive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400 mb-2">No incentives recorded yet.</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Incentives from sales orders will appear here automatically, or you can add them manually.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Checking...' : 'Check for Orders'}
                    </button>
                    <button
                      onClick={() => setShowIncentiveModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 cursor-pointer"
                    >
                      Add Manual Incentive
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Incentive Modal */}
      {showIncentiveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Add Manual Incentive
                </h2>
                <button
                  onClick={() => setShowIncentiveModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Incentive Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newIncentive.title}
                    onChange={(e) =>
                      setNewIncentive({ ...newIncentive, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter incentive title"
                    maxLength={200}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newIncentive.description}
                    onChange={(e) =>
                      setNewIncentive({ ...newIncentive, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                    placeholder="Optional description"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={newIncentive.amount}
                    onChange={(e) =>
                      setNewIncentive({ ...newIncentive, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowIncentiveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIncentive}
                  disabled={
                    isAddingIncentive ||
                    !newIncentive.title ||
                    !newIncentive.amount
                  }
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isAddingIncentive ? "Adding..." : "Add Incentive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incentive Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Delete Incentive
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-slate-300">
                  Are you sure you want to delete this incentive? This action cannot be undone.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteIncentive}
                  disabled={isDeletingIncentive}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isDeletingIncentive ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
