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
    <>
      {/* Profile photo */}
      <div className="plane-section">
        <div className="section-title">প্রোফাইল ছবি</div>
        <div className="flex flex-wrap items-center gap-4">
          {employee.photo ? (
            <img
              src={employee.photo}
              alt={employee.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-slate-600 text-2xl font-semibold">
                {employee.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="text-slate-900 font-medium">
              {employee.name}
            </div>
            <p className="text-sm text-slate-500">
              কর্মচারীর ছবি আপলোড করুন বা বদলে দিন
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
                className="btn btn-ghost btn-sm cursor-pointer"
              >
                ছবি বদলান
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Personal information */}
      <div className="plane-section">
        <div className="section-title">ব্যক্তিগত তথ্য</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee ID */}
          <div>
            <label className="label">কর্মচারী আইডি</label>
            <input
              type="text"
              value={employeeForm.employee_id}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  employee_id: e.target.value,
                })
              }
              className="input"
              placeholder="কর্মচারী আইডি লিখুন"
            />
          </div>

          {/* Employee Name */}
          <div>
            <label className="label">পুরো নাম</label>
            <input
              type="text"
              value={employeeForm.name}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  name: e.target.value,
                })
              }
              className="input"
              placeholder="পুরো নাম লিখুন"
            />
          </div>

          {/* Email */}
          <div>
            <label className="label">ইমেইল</label>
            <input
              type="email"
              value={employeeForm.email}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  email: e.target.value,
                })
              }
              className="input"
              placeholder="ইমেইল লিখুন"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">ফোন</label>
            <input
              type="tel"
              value={employeeForm.phone}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  phone: e.target.value,
                })
              }
              className="input"
              placeholder="ফোন নম্বর লিখুন"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="label">ঠিকানা</label>
            <textarea
              rows={3}
              value={employeeForm.address}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  address: e.target.value,
                })
              }
              className="textarea resize-none"
              placeholder="পুরো ঠিকানা লিখুন"
            />
          </div>
        </div>
      </div>

      {/* Job information */}
      <div className="plane-section">
        <div className="section-title">চাকরির তথ্য</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Role */}
          <div>
            <label className="label">পদ</label>
            <input
              type="text"
              value={employeeForm.role}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  role: e.target.value,
                })
              }
              className="input"
              placeholder="পদ লিখুন"
            />
          </div>

          {/* Department */}
          <div>
            <label className="label">ডিপার্টমেন্ট</label>
            <input
              type="text"
              value={employeeForm.department}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  department: e.target.value,
                })
              }
              className="input"
              placeholder="ডিপার্টমেন্ট লিখুন"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="label">মাসিক বেতন</label>
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
              className="input"
              placeholder="মাসিক বেতন লিখুন"
            />
          </div>

          {/* Status */}
          <div>
            <label className="label">অবস্থা</label>
            <select
              value={employeeForm.status}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  status: e.target.value as "active" | "suspended" | "resigned" | "corrupted",
                })
              }
              className="select"
            >
              <option value="active">Active</option>
              <option value="suspended">সাসপেন্ড করা</option>
              <option value="resigned">চাকরি ছেড়েছে</option>
              <option value="corrupted">সমস্যাযুক্ত</option>
            </select>
          </div>
        </div>

        {/* Save Employee Info Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveEmployee}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? "সেভ হচ্ছে…" : "তথ্য সেভ করুন"}
          </button>
        </div>
      </div>

      {/* Bank details */}
      <div className="plane-section">
        <div className="section-title">ব্যাংকের তথ্য</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">ব্যাংকের নাম</label>
            <input
              type="text"
              value={paymentForm.bankName}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  bankName: e.target.value,
                })
              }
              placeholder="ব্যাংকের নাম লিখুন"
              className="input"
            />
          </div>

          <div>
            <label className="label">অ্যাকাউন্ট নম্বর</label>
            <input
              type="text"
              value={paymentForm.accountNumber}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  accountNumber: e.target.value,
                })
              }
              placeholder="অ্যাকাউন্ট নম্বর লিখুন"
              className="input"
            />
          </div>

          <div>
            <label className="label">ব্রাঞ্চ</label>
            <input
              type="text"
              value={paymentForm.bankBranch}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  bankBranch: e.target.value,
                })
              }
              placeholder="ব্রাঞ্চের নাম লিখুন"
              className="input"
            />
          </div>

          <div>
            <label className="label">অ্যাকাউন্টের নাম</label>
            <input
              type="text"
              value={paymentForm.accountHolderName}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  accountHolderName: e.target.value,
                })
              }
              placeholder="যার নামে অ্যাকাউন্ট"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Tax and payroll details */}
      <div className="plane-section">
        <div className="section-title">ট্যাক্স আর বেতনের নিয়ম</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">ট্যাক্স আইডি</label>
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
              className="input"
            />
          </div>

          <div>
            <label className="label">ট্যাক্স কাটার টাইপ</label>
            <select
              value={paymentForm.taxWithholding}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  taxWithholding: e.target.value,
                })
              }
              className="select"
            >
              <option value="">বেছে নিন…</option>
              <option value="single">অবিবাহিত</option>
              <option value="married">
                বিবাহিত (একসাথে)
              </option>
              <option value="married-separate">
                বিবাহিত (আলাদা)
              </option>
              <option value="head">পরিবারের প্রধান</option>
            </select>
          </div>

          <div>
            <label className="label">পেমেন্ট টাইপ</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentMethod: e.target.value,
                })
              }
              className="select"
            >
              <option value="direct-deposit">ব্যাংকে জমা</option>
              <option value="check">চেক</option>
              <option value="wire">অনলাইন ট্রান্সফার</option>
              <option value="cash">ক্যাশ</option>
            </select>
          </div>

          <div>
            <label className="label">কত দিন পরপর বেতন</label>
            <select
              value={paymentForm.payFrequency}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  payFrequency: e.target.value,
                })
              }
              className="select"
            >
              <option value="monthly">মাসে একবার</option>
              <option value="bi-weekly">দুই সপ্তাহে একবার</option>
              <option value="weekly">সপ্তাহে একবার</option>
            </select>
          </div>

          {/* Additional Payment Notes */}
          <div className="sm:col-span-2">
            <label className="label">পেমেন্টের নোট</label>
            <textarea
              rows={3}
              value={paymentForm.paymentNotes}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  paymentNotes: e.target.value,
                })
              }
              placeholder="পেমেন্ট নিয়ে বিশেষ কিছু বলার থাকলে এখানে লিখুন…"
              className="textarea resize-none"
            />
          </div>
        </div>

        {/* Save Payment Info Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSavePaymentInfo}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? "সেভ হচ্ছে…" : "পেমেন্টের তথ্য সেভ করুন"}
          </button>
        </div>
      </div>
    </>
  );
}
