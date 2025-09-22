"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { SalaryRecord, CreateSalaryRecordData } from "@/types/employee";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

interface SalaryTabProps {
  salaryRecords: SalaryRecord[];
  employeeId: string;
  onSalaryRecordsUpdate: (records: SalaryRecord[]) => void;
}

export default function SalaryTab({ salaryRecords, employeeId, onSalaryRecordsUpdate }: SalaryTabProps) {
  const formatCurrencyWithSymbol = useCurrencyFormatter();
  const [mounted, setMounted] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showSalaryDeleteModal, setShowSalaryDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<number | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isDeletingSalary, setIsDeletingSalary] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    month: "",
    year: new Date().getFullYear().toString(),
    base_salary: "",
    overtime_hours: "",
    overtime_rate: "",
    bonuses: "",
    deductions: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
      case "approved":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "in_progress":
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.month || !newTransaction.year || !newTransaction.base_salary) return;
    
    setIsAddingTransaction(true);
    try {
      // API call would go here
      console.log("Adding salary transaction:", newTransaction);
      // const createdRecord = await employeeAPI.createSalaryRecord(employeeId, newTransaction);
      // onSalaryRecordsUpdate([...salaryRecords, createdRecord]);
      
      setShowAddTransactionModal(false);
      setNewTransaction({
        month: "",
        year: new Date().getFullYear().toString(),
        base_salary: "",
        overtime_hours: "",
        overtime_rate: "",
        bonuses: "",
        deductions: "",
      });
    } catch (error) {
      console.error("Error adding salary transaction:", error);
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleDeleteSalaryRecord = async () => {
    if (!salaryToDelete) return;
    
    setIsDeletingSalary(true);
    try {
      // API call would go here
      console.log("Deleting salary record:", salaryToDelete);
      // await employeeAPI.deleteSalaryRecord(salaryToDelete);
      // onSalaryRecordsUpdate(salaryRecords.filter(r => r.id !== salaryToDelete));
      
      setShowSalaryDeleteModal(false);
      setSalaryToDelete(null);
    } catch (error) {
      console.error("Error deleting salary record:", error);
    } finally {
      setIsDeletingSalary(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-slate-100">
              Salary History
            </h4>
            <button
              onClick={() => setShowAddTransactionModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
            >
              Add Transaction
            </button>
          </div>

          <div className="max-w-6xl">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
              {salaryRecords.length > 0 ? (
                <>
                  {/* Table Header */}
                  <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <div className="col-span-2">Period</div>
                      <div className="col-span-2">Base Salary</div>
                      <div className="col-span-2">Overtime</div>
                      <div className="col-span-2">Bonuses</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-white/5">
                    {salaryRecords.map((record) => (
                      <div
                        key={record.id}
                        className="px-6 py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-slate-100">
                              {record.month} {record.year}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-slate-200">
                              {formatCurrencyWithSymbol(record.base_salary)}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm text-slate-300">
                              {record.overtime_hours > 0 ? (
                                <>
                                  <p>{record.overtime_hours}h</p>
                                  <p className="text-xs text-slate-400">
                                    @ {formatCurrencyWithSymbol(record.overtime_rate)}/h
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-green-300">
                              {record.bonuses > 0 ? formatCurrencyWithSymbol(record.bonuses) : "-"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSalaryToDelete(record.id);
                                  setShowSalaryDeleteModal(true);
                                }}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete salary record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional details row */}
                        <div className="mt-2 grid grid-cols-12 gap-4 text-xs text-slate-400">
                          <div className="col-span-2">
                            <span>Net: {formatCurrencyWithSymbol(record.net_salary)}</span>
                          </div>
                          <div className="col-span-4">
                            {record.deductions > 0 && (
                              <span>Deductions: -{formatCurrencyWithSymbol(record.deductions)}</span>
                            )}
                          </div>
                          <div className="col-span-3">
                            <span>Paid: {formatDate(record.payment_date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-400">No salary records found.</p>
                  <button
                    onClick={() => setShowAddTransactionModal(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 cursor-pointer"
                  >
                    Add First Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-lg w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Add Salary Transaction
                </h2>
                <button
                  onClick={() => setShowAddTransactionModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Month */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Month *
                    </label>
                    <select
                      value={newTransaction.month}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          month: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="">Select month</option>
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ].map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={newTransaction.year}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          year: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="2024"
                    />
                  </div>
                </div>

                {/* Base Salary */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Base Salary *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.base_salary}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        base_salary: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter base salary amount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Overtime Hours */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Overtime Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newTransaction.overtime_hours}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          overtime_hours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="0"
                    />
                  </div>

                  {/* Overtime Rate */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Overtime Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.overtime_rate}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          overtime_rate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Bonuses */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bonuses
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.bonuses}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          bonuses: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Deductions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Deductions
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.deductions}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          deductions: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowAddTransactionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  disabled={isAddingTransaction || !newTransaction.month || !newTransaction.year || !newTransaction.base_salary}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isAddingTransaction ? "Adding..." : "Add Transaction"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Salary Record Confirmation Modal */}
      {showSalaryDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Delete Salary Record
                </h2>
                <button
                  onClick={() => setShowSalaryDeleteModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-slate-300">
                  Are you sure you want to delete this salary record? This action cannot be undone.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowSalaryDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSalaryRecord}
                  disabled={isDeletingSalary}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isDeletingSalary ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
