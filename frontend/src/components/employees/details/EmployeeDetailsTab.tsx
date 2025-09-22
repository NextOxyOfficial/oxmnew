"use client";

import React, { useState } from "react";
import { Employee } from "@/types/employee";

interface EmployeeDetailsTabProps {
  employee: Employee;
  onEmployeeUpdate: (updatedEmployee: Employee) => void;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EmployeeDetailsTab({ 
  employee, 
  onEmployeeUpdate,
  onPhotoSelect 
}: EmployeeDetailsTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    address: employee.address || "",
    role: employee.role,
    department: employee.department,
    salary: employee.salary.toString(),
    manager: employee.manager || "",
    employee_id: employee.employee_id,
    status: employee.status,
  });
  
  const [paymentForm, setPaymentForm] = useState({
    bankName: "",
    accountNumber: "",
    bankBranch: "",
    accountHolderName: "",
    taxId: "",
    taxWithholding: "",
    paymentMethod: "direct-deposit",
    payFrequency: "monthly",
    paymentNotes: "",
  });

  const handleSaveEmployee = async () => {
    // Implementation for saving employee details
    setIsSaving(true);
    try {
      // API call would go here
      console.log("Saving employee:", employeeForm);
      // onEmployeeUpdate(updatedEmployee);
    } catch (error) {
      console.error("Error saving employee:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    // Implementation for saving payment info
    setIsSaving(true);
    try {
      // API call would go here
      console.log("Saving payment info:", paymentForm);
    } catch (error) {
      console.error("Error saving payment info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          {employee.photo ? (
            <img
              src={employee.photo}
              alt={employee.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h4 className="text-lg font-medium text-slate-100">
              Profile Photo
            </h4>
            <p className="text-sm text-slate-400">
              Upload or change employee photo
            </p>
            <div className="mt-2">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={onPhotoSelect}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors cursor-pointer"
              >
                Change Photo
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeForm.employee_id}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  employee_id: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter employee ID"
            />
          </div>

          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={employeeForm.name}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  name: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={employeeForm.email}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  email: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter email address"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={employeeForm.phone}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  phone: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter phone number"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Role
            </label>
            <input
              type="text"
              value={employeeForm.role}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  role: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter job role"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Department
            </label>
            <input
              type="text"
              value={employeeForm.department}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  department: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter department"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Monthly Salary
            </label>
            <input
              type="number"
              step="0.01"
              value={employeeForm.salary}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  salary: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Enter monthly salary"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Employment Status
            </label>
            <select
              value={employeeForm.status}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  status: e.target.value as "active" | "suspended" | "resigned" | "corrupted",
                })
              }
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="resigned">Resigned</option>
              <option value="corrupted">Corrupted</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Address
          </label>
          <textarea
            rows={3}
            value={employeeForm.address}
            onChange={(e) =>
              setEmployeeForm({
                ...employeeForm,
                address: e.target.value,
              })
            }
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
            placeholder="Enter full address"
          />
        </div>

        {/* Save Employee Info Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveEmployee}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Employee Info"}
          </button>
        </div>
      </div>

      {/* Payment Information Section */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h4 className="text-lg font-medium text-slate-100 mb-6">
          Payment Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-200 border-b border-slate-700/50 pb-2">
              Bank Details
            </h4>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={paymentForm.bankName}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    bankName: e.target.value,
                  })
                }
                placeholder="Enter bank name"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={paymentForm.accountNumber}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountNumber: e.target.value,
                  })
                }
                placeholder="Enter account number"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bank Branch
              </label>
              <input
                type="text"
                value={paymentForm.bankBranch}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    bankBranch: e.target.value,
                  })
                }
                placeholder="Enter bank branch"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={paymentForm.accountHolderName}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    accountHolderName: e.target.value,
                  })
                }
                placeholder="Enter account holder name"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          {/* Tax and Payroll Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-slate-200 border-b border-slate-700/50 pb-2">
              Tax & Payroll Details
            </h4>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tax ID
              </label>
              <input
                type="text"
                value={paymentForm.taxId}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    taxId: e.target.value,
                  })
                }
                placeholder="XXX-XX-XXXX"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tax Withholding
              </label>
              <select
                value={paymentForm.taxWithholding}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    taxWithholding: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
              >
                <option value="">Select tax withholding</option>
                <option value="single">Single</option>
                <option value="married">
                  Married Filing Jointly
                </option>
                <option value="married-separate">
                  Married Filing Separately
                </option>
                <option value="head">Head of Household</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentMethod: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
              >
                <option value="direct-deposit">Bank Deposit</option>
                <option value="check">Paper Check</option>
                <option value="wire">Online Transfer</option>
                <option value="cash">Cash Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pay Frequency
              </label>
              <select
                value={paymentForm.payFrequency}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payFrequency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Payment Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Payment Notes
          </label>
          <textarea
            rows={3}
            value={paymentForm.paymentNotes}
            onChange={(e) =>
              setPaymentForm({
                ...paymentForm,
                paymentNotes: e.target.value,
              })
            }
            placeholder="Add any special payment instructions or notes..."
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
          />
        </div>

        {/* Save Payment Info Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSavePaymentInfo}
            disabled={isSaving}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Payment Info"}
          </button>
        </div>
      </div>
    </div>
  );
}
