"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  Gift,
  DollarSign,
  ClipboardList,
  X,
} from "lucide-react";
import {
  Employee,
  Incentive,
  SalaryRecord,
  Task,
  Document,
} from "@/types/employee";
import employeeAPI from "@/lib/employeeAPI";

// Import the new components
import EmployeeHeader from "@/components/employees/details/EmployeeHeader";
import EmployeeDetailsTab from "@/components/employees/details/EmployeeDetailsTab";
import IncentivesTab from "@/components/employees/details/IncentivesTab";
import SalaryTab from "@/components/employees/details/SalaryTab";
import TasksAndDocumentsTab from "@/components/employees/details/TasksAndDocumentsTab";

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
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
      const formData = new FormData();
      formData.append("photo", selectedPhoto);

      // For now, just simulate the upload since the API method might not exist
      console.log("Would upload photo for employee:", employee.id);
      
      setShowPhotoModal(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      alert("Profile photo would be updated (API not implemented)!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
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
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <div className="h-6 bg-slate-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-100 mb-2">
              Employee Not Found
            </h3>
            <p className="text-slate-400 mb-4">
              The employee you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Employee Header Component */}
        <EmployeeHeader
          employee={employee}
          incentives={incentives}
          tasks={tasks}
          onBack={() => router.back()}
        />

        {/* Tabs */}
        <div className="max-w-6xl">
          <div className="flex border-b border-slate-700/50 mb-6 overflow-x-auto">
            {[
              {
                key: "details",
                label: "Employee Details",
                icon: <User className="w-4 h-4" />,
              },
              {
                key: "incentives",
                label: "Incentives",
                icon: <Gift className="w-4 h-4" />,
              },
              {
                key: "salary",
                label: "Salary",
                icon: <DollarSign className="w-4 h-4" />,
              },
              {
                key: "tasks",
                label: "Tasks & Documents",
                icon: <ClipboardList className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-6xl">
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
          </div>
        </div>

        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Update Profile Photo
                  </h2>
                  <button
                    onClick={handleCancelPhotoUpload}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {photoPreview && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-300 mb-2">
                        Preview:
                      </p>
                      <div className="flex justify-center">
                        <img
                          src={photoPreview}
                          alt="Photo preview"
                          className="w-32 h-32 rounded-lg object-cover border border-slate-600"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-slate-400 space-y-1">
                    <p>• Supported formats: JPEG, PNG, WebP</p>
                    <p>• Maximum file size: 5MB</p>
                    <p>• Recommended size: 400x400 pixels</p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCancelPhotoUpload}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePhotoUpload}
                    disabled={isUploadingPhoto || !selectedPhoto}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
