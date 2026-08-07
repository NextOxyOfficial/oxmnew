"use client";

import { ApiService } from "@/lib/api";
import SmsReminderButton from "@/components/ui/SmsReminderButton";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Gift,
  DollarSign,
  ClipboardList,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  Employee,
  Incentive,
  SalaryRecord,
  Task,
  Document,
} from "@/types/employee";
import employeeAPI from "@/lib/employeeAPI";
import { useToast } from "@/components/ui/Feedback";

// Import the new components
import EmployeeHeader from "@/components/employees/details/EmployeeHeader";
import RoleSettingsTab from "@/components/settings/RoleSettingsTab";
import EmployeeDetailsTab from "@/components/employees/details/EmployeeDetailsTab";
import IncentivesTab from "@/components/employees/details/IncentivesTab";
import SalaryTab from "@/components/employees/details/SalaryTab";
import TasksAndDocumentsTab from "@/components/employees/details/TasksAndDocumentsTab";

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mounted, setMounted] = useState(false);

  // Photo upload state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getEmployeeId = useCallback(() => {
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params.id]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const employeeId = getEmployeeId();

      if (!employeeId) {
        setIsLoading(false);
        return;
      }

      try {
        const id = parseInt(employeeId);

        // Fetch all employee data in parallel
        const [
          employeeData,
          incentivesData,
          salaryRecordsData,
          tasksData,
          documentsData,
        ] = await Promise.all([
          employeeAPI.getEmployee(id),
          employeeAPI.getEmployeeIncentives(id),
          employeeAPI.getEmployeeSalaryRecords(id),
          employeeAPI.getEmployeeTasks(id),
          employeeAPI.getEmployeeDocuments(id),
        ]);

        setEmployee(employeeData);
        setIncentives(
          Array.isArray(incentivesData) ? incentivesData : []
        );
        setSalaryRecords(
          Array.isArray(salaryRecordsData) ? salaryRecordsData : []
        );
        setTasks(
          Array.isArray(tasksData) ? tasksData : []
        );
        setDocuments(
          Array.isArray(documentsData) ? documentsData : []
        );
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [getEmployeeId]);

  // Function to refresh incentives data
  const refreshIncentives = async () => {
    const employeeId = getEmployeeId();
    if (!employeeId) return;
    
    try {
      const id = parseInt(employeeId);
      const incentivesData = await employeeAPI.getEmployeeIncentives(id);
      setIncentives(Array.isArray(incentivesData) ? incentivesData : []);
    } catch (error) {
      console.error("Error refreshing incentives:", error);
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setShowPhotoModal(true);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !employee) return;

    setIsUploadingPhoto(true);
    try {
      const updated = await ApiService.uploadEmployeePhoto(
        employee.id,
        selectedPhoto
      );
      // Reflect the saved URL straight away so the avatar updates without a
      // page reload.
      setEmployee((prev) => (prev ? { ...prev, photo: updated?.photo } : prev));
      setShowPhotoModal(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      toast.success("প্রোফাইল ছবি আপডেট হয়েছে");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ছবি আপলোড করা যায়নি। আরেকবার চেষ্টা করুন।"
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPhotoUpload = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কর্মচারী</h1>
            <p className="page-sub">তথ্য আনা হচ্ছে…</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কর্মচারী</h1>
          </div>
        </header>
        <div className="plane">
          <div className="empty">
            <p className="mb-3">
              এই কর্মচারীকে পাওয়া যায়নি — হয়তো ডিলিট হয়ে গেছে।
            </p>
            <button onClick={() => router.back()} className="btn btn-ghost">
              ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="min-w-0">
          <button
            onClick={() => router.back()}
            className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-cyan-600"
          >
            <ArrowLeft className="h-4 w-4" />
            কর্মচারীর তালিকায় ফিরে যান
          </button>
          <h1 className="page-title truncate" title={employee.name}>
            {employee.name}
          </h1>
          <p className="page-sub truncate">
            {employee.email} · {employee.phone}
          </p>
        </div>

        <SmsReminderButton
          name={employee.name}
          phone={employee.phone}
          mode="message"
          label="এসএমএস"
          title={`${employee.name}-কে এসএমএস`}
          className="btn btn-ghost"
        />
      </header>

      <div className="plane">
        {/* Employee KPI strip */}
        <EmployeeHeader
          employee={employee}
          incentives={incentives}
          tasks={tasks}
        />

        {/* Tabs */}
        <div className="plane-section">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              {
                key: "details",
                label: "কর্মচারীর তথ্য",
                icon: <User className="w-4 h-4" />,
              },
              {
                key: "incentives",
                label: "ইনসেনটিভ",
                icon: <Gift className="w-4 h-4" />,
              },
              {
                key: "salary",
                label: "বেতন",
                icon: <DollarSign className="w-4 h-4" />,
              },
              {
                key: "tasks",
                label: "কাজ আর কাগজপত্র",
                icon: <ClipboardList className="w-4 h-4" />,
              },
              {
                key: "roles",
                label: "রোল সেটিংস",
                icon: <ShieldCheck className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`btn btn-sm ${
                  activeTab === tab.key ? "btn-primary" : "btn-ghost"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee Details Tab */}
        {activeTab === "details" && (
          <EmployeeDetailsTab
            employee={employee}
            onEmployeeUpdate={setEmployee}
            onPhotoSelect={handlePhotoSelect}
          />
        )}

        {/* Incentives Tab */}
        {activeTab === "incentives" && (
          <IncentivesTab
            incentives={incentives}
            employeeId={getEmployeeId() || ''}
            onIncentivesUpdate={setIncentives}
            onRefresh={refreshIncentives}
          />
        )}

        {/* Salary Tab */}
        {activeTab === "salary" && (
          <SalaryTab
            salaryRecords={salaryRecords}
            employeeId={getEmployeeId() || ''}
            onSalaryRecordsUpdate={setSalaryRecords}
          />
        )}

        {/* Tasks & Documents Tab */}
        {activeTab === "tasks" && (
          <TasksAndDocumentsTab
            tasks={tasks}
            documents={documents}
            employeeId={getEmployeeId() || ''}
            onTasksUpdate={setTasks}
            onDocumentsUpdate={setDocuments}
          />
        )}

        {/* Role settings — the same screen as সেটিংস, narrowed to this person */}
        {activeTab === "roles" && (
          <RoleSettingsTab employeeId={Number(getEmployeeId())} />
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "28rem" }}>
            <div className="modal-head">
              <h2 className="modal-title">প্রোফাইল ছবি বদলান</h2>
              <button
                onClick={handleCancelPhotoUpload}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              {photoPreview && (
                <div className="mb-4">
                  <p className="label">যেমন দেখাবে</p>
                  <div className="flex justify-center">
                    <img
                      src={photoPreview}
                      alt="নতুন ছবির প্রিভিউ"
                      className="w-32 h-32 rounded-lg object-cover border border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="text-sm text-slate-500 space-y-1">
                <p>• যেসব ফরম্যাট চলবে: JPEG, PNG, WebP</p>
                <p>• ফাইলের সাইজ সর্বোচ্চ ৫ MB</p>
                <p>• সবচেয়ে ভালো হয় ৪০০x৪০০ পিক্সেল</p>
              </div>
            </div>

            <div className="modal-foot">
              <button
                onClick={handleCancelPhotoUpload}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={handlePhotoUpload}
                disabled={isUploadingPhoto || !selectedPhoto}
                className="btn btn-primary"
              >
                {isUploadingPhoto ? "আপলোড হচ্ছে…" : "ছবি আপলোড করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
