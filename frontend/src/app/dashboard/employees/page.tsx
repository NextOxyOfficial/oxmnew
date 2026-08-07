"use client";

import Link from "next/link";
import SmsReminderButton from "@/components/ui/SmsReminderButton";
import { printSheet } from "@/lib/printSheet";

import { num, sumBy } from "@/lib/money";

import { useConfirm, useToast } from "@/components/ui/Feedback";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import employeeAPI from "@/lib/employeeAPI";
import { ApiService } from "@/lib/api";
import {
  CreateEmployeeData,
  Employee,
  Incentive,
  IncentiveWithdrawal,
} from "@/types/employee";
import {
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Presentation-only label/badge maps (no behaviour attached)
const EMPLOYEE_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  suspended: "সাসপেন্ড",
  resigned: "চাকরি ছেড়েছে",
  corrupted: "সমস্যা আছে",
};

const EMPLOYEE_STATUS_BADGE: Record<string, string> = {
  active: "badge-success",
  suspended: "badge-warn",
  resigned: "badge-muted",
  corrupted: "badge-danger",
};

const INCENTIVE_STATUS_LABEL: Record<string, string> = {
  paid: "পরিশোধ",
  approved: "অনুমোদিত",
  pending: "বাকি আছে",
};

const INCENTIVE_STATUS_BADGE: Record<string, string> = {
  paid: "badge-success",
  approved: "badge-info",
  pending: "badge-warn",
};

const INCENTIVE_TYPE_LABEL: Record<string, string> = {
  bonus: "বোনাস",
  commission: "কমিশন",
  achievement: "অর্জন",
  performance: "পারফরম্যান্স",
};

export default function EmployeesPage() {
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    department: "",
    salary: "",
  });

  // Pagination state for employees
  const [employeesPagination, setEmployeesPagination] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    hasNextPage: boolean;
    isLoadingMore: boolean;
  }>({
    count: 0,
    next: null,
    previous: null,
    hasNextPage: false,
    isLoadingMore: false,
  });

  // Incentives state
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [isLoadingIncentives, setIsLoadingIncentives] = useState(true);
  const [incentivesPagination, setIncentivesPagination] = useState({
    hasNext: false,
    currentPage: 1,
    isLoadingMore: false,
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<"employees" | "incentives">(
    "employees",
  );

  // Withdrawal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<
    IncentiveWithdrawal[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    hasNext: false,
    currentPage: 1,
    isLoadingMore: false,
  });

  // Ensure component is mounted before rendering dates
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    if (!mounted) return ""; // Return empty string during SSR
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching employees data...");
        const data = await employeeAPI.getEmployees();
        console.log("Employees fetched successfully:", data);

        // Handle different response formats (array vs paginated response)
        let employeesData: Employee[] = [];
        if (data && typeof data === "object" && !Array.isArray(data)) {
          // Check if it's a paginated response with results field
          if ("results" in data && Array.isArray(data.results)) {
            employeesData = data.results;

            // Update pagination state
            setEmployeesPagination({
              count: data.count || 0,
              next: data.next || null,
              previous: data.previous || null,
              hasNextPage: !!data.next,
              isLoadingMore: false,
            });
          } else {
            // Invalid response format
            console.error("Unexpected response format:", data);
            employeesData = [];
            setEmployeesPagination({
              count: 0,
              next: null,
              previous: null,
              hasNextPage: false,
              isLoadingMore: false,
            });
          }
        } else if (Array.isArray(data)) {
          // Direct array response
          employeesData = data;
          setEmployeesPagination({
            count: employeesData.length,
            next: null,
            previous: null,
            hasNextPage: false,
            isLoadingMore: false,
          });
        } else {
          // Invalid response format
          console.error("Unexpected response format:", data);
          employeesData = [];
          setEmployeesPagination({
            count: 0,
            next: null,
            previous: null,
            hasNextPage: false,
            isLoadingMore: false,
          });
        }

        setEmployees(employeesData);
      } catch (err: any) {
        console.error("Error fetching employees:", err);
        console.error("Error details:", err.message, err.response?.data);

        // Handle 401 Unauthorized - Invalid Token
        if (err.response?.status === 401) {
          console.warn(
            "⚠️ Invalid authentication token detected. Clearing token...",
          );

          // Clear invalid token
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
          }

          // Redirect to login page
          window.location.href = "/login";
          return; // Exit early
        }

        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "কর্মচারীদের তালিকা আনা যায়নি। আবার চেষ্টা করুন।";
        setError(errorMessage);
        // Set empty array on error to prevent filter issues
        setEmployees([]);
        setEmployeesPagination({
          count: 0,
          next: null,
          previous: null,
          hasNextPage: false,
          isLoadingMore: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch incentives from backend
  const fetchIncentives = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setIsLoadingIncentives(true);
      else
        setIncentivesPagination((prev) => ({ ...prev, isLoadingMore: true }));

      console.log("Fetching incentives data...", { page });
      const data = await ApiService.getIncentives({ page, page_size: 10 });
      console.log("Incentives fetched successfully:", data);

      // Handle different response formats
      if (Array.isArray(data)) {
        setIncentives(append ? [...incentives, ...data] : data);
        setIncentivesPagination({
          hasNext: false,
          currentPage: page,
          isLoadingMore: false,
        });
      } else if (data && data.results && Array.isArray(data.results)) {
        setIncentives(append ? [...incentives, ...data.results] : data.results);
        setIncentivesPagination({
          hasNext: !!data.next,
          currentPage: page,
          isLoadingMore: false,
        });
      } else {
        console.error("Unexpected incentives response format:", data);
        if (!append) setIncentives([]);
        setIncentivesPagination({
          hasNext: false,
          currentPage: page,
          isLoadingMore: false,
        });
      }
    } catch (err) {
      console.error("Error fetching incentives:", err);
      if (!append) setIncentives([]);
      setIncentivesPagination((prev) => ({ ...prev, isLoadingMore: false }));
    } finally {
      setIsLoadingIncentives(false);
    }
  };

  const loadMoreIncentives = () => {
    if (!incentivesPagination.isLoadingMore && incentivesPagination.hasNext) {
      fetchIncentives(incentivesPagination.currentPage + 1, true);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  const loadMoreEmployees = async () => {
    if (!employeesPagination.next || employeesPagination.isLoadingMore) {
      return;
    }

    try {
      setEmployeesPagination((prev) => ({ ...prev, isLoadingMore: true }));

      // Extract the page number from the next URL
      const url = new URL(employeesPagination.next);
      const page = url.searchParams.get("page");

      const response = await employeeAPI.getEmployees(
        page ? parseInt(page) : 2,
      );
      console.log("More employees fetched:", response);

      if (
        response &&
        "results" in response &&
        Array.isArray(response.results)
      ) {
        // Append new employees to existing ones
        setEmployees((prev) => [...prev, ...response.results]);

        // Update pagination state
        setEmployeesPagination({
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          hasNextPage: !!response.next,
          isLoadingMore: false,
        });
      }
    } catch (error) {
      console.error("Error loading more employees:", error);
      setEmployeesPagination((prev) => ({ ...prev, isLoadingMore: false }));
      // Could add error notification here
    }
  };

  // Calculate stats - ensure employees is always an array
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const totalEmployees = safeEmployees.length;
  const activeEmployees = safeEmployees.filter(
    (e) => e.status === "active",
  ).length;
  const totalSalary = sumBy(safeEmployees, (emp) => emp.salary);

  // Calculate total incentives
  const safeIncentives = Array.isArray(incentives) ? incentives : [];
  const totalIncentives = sumBy(safeIncentives, (i) => i.amount);

  // Get unique departments for filter
  const departments = Array.from(
    new Set(safeEmployees.map((emp) => emp.department)),
  ).filter(Boolean);

  // Handle view employee details
  const handleViewEmployee = (employee: Employee) => {
    router.push(`/dashboard/employees/${employee.id}`);
  };

  // Handle edit employee
  const handleEditEmployee = async (employee: Employee) => {
    try {
      setEditingEmployeeId(employee.id);
      // Navigate to the employee details page
      await router.push(`/dashboard/employees/${employee.id}`);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      // Reset the editing state after navigation
      setTimeout(() => setEditingEmployeeId(null), 1000);
    }
  };

  // Handle delete employee
  const showDeleteConfirmation = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setEmployeeToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setIsDeleting(true);

      await employeeAPI.deleteEmployee(employeeToDelete.id);

      // Remove employee from list
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));

      // Close modal
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("কর্মচারী ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.phone ||
      !newEmployee.role ||
      !newEmployee.department ||
      !newEmployee.salary
    ) {
      toast.error("তারকা দেওয়া ঘরগুলো পূরণ করতেই হবে");
      return;
    }

    // Validate salary is a positive number
    const salaryValue = parseFloat(newEmployee.salary);
    if (isNaN(salaryValue) || salaryValue <= 0) {
      toast.error("বেতনের অঙ্কটা 0 এর বেশি একটা ঠিকঠাক সংখ্যা দিন");
      return;
    }

    try {
      setIsCreating(true);

      // Generate unique employee ID
      const employee_id = `EMP${Date.now().toString().slice(-6)}`;

      const createData: CreateEmployeeData = {
        employee_id,
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim(),
        phone: newEmployee.phone.trim(),
        address: newEmployee.address?.trim() || "",
        role: newEmployee.role.trim(),
        department: newEmployee.department.trim(),
        salary: salaryValue,
        hiring_date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
        status: "active",
      };

      console.log("Creating employee with data:", createData);

      const createdEmployee = await employeeAPI.createEmployee(createData);

      // Add to employees list
      setEmployees((prev) => [createdEmployee, ...prev]);

      // Reset form and close modal
      setNewEmployee({
        name: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        department: "",
        salary: "",
      });
      setShowCreateModal(false);

      // Show success message with option to view details
      const viewDetails = await confirm({
        title: `"${createdEmployee.name}" যোগ হয়ে গেছে!`,
        message: "এখনই তার বিস্তারিত দেখবেন?",
        confirmLabel: "দেখি",
        cancelLabel: "পরে দেখব",
      });

      if (viewDetails) {
        router.push(`/dashboard/employees/${createdEmployee.id}`);
      }
    } catch (error) {
      console.error("Error creating employee:", error);

      // Show more specific error message
      let errorMessage = "কর্মচারী যোগ করা যায়নি। আবার চেষ্টা করুন।";

      if (error instanceof Error) {
        // Try to extract meaningful error from the response
        if (error.message.includes("employee_id")) {
          errorMessage = "এই আইডিতে একজন কর্মচারী আগেই আছে। অন্য আইডি দিন।";
        } else if (error.message.includes("email")) {
          errorMessage = "এই ইমেইলে একজন কর্মচারী আগেই আছে। অন্য ইমেইল দিন।";
        } else if (error.message.includes("required")) {
          errorMessage = "সব দরকারি ঘর ঠিকমতো পূরণ করুন।";
        } else if (error.message) {
          errorMessage = `সমস্যা: ${error.message}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      address: "",
      role: "",
      department: "",
      salary: "",
    });
    setShowCreateModal(false);
  };

  // Handle incentive withdrawal
  const handleWithdrawTotal = () => {
    setWithdrawalAmount("");
    setWithdrawalReason("");
    setShowWithdrawModal(true);
  };

  const processWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("তোলার অঙ্কটা 0 এর বেশি একটা ঠিকঠাক সংখ্যা দিন");
      return;
    }

    const totalAvailable = incentives
      .filter((inc) => inc.status === "paid" && inc.amount > 0)
      .reduce((sum, inc) => sum + num(inc.amount), 0);

    if (amount > totalAvailable) {
      toast.error("যত টাকা জমা আছে, তার বেশি তোলা যাবে না");
      return;
    }

    try {
      setIsWithdrawing(true);

      // Get the logged-in user (assuming we're using the current user's ID)
      // For now, we'll use the first employee's ID as placeholder
      // In a real app, you'd get this from auth context
      const employeeId = employees.length > 0 ? employees[0].id : null;

      if (!employeeId) {
        toast.error("টাকা তোলার জন্য কোনো কর্মচারী পাওয়া যায়নি");
        return;
      }

      await ApiService.withdrawFromEmployee(employeeId, {
        amount: amount,
        reason:
          withdrawalReason || `${formatCurrency(amount)} ইনসেনটিভ তোলা হয়েছে`,
      });

      // Refresh incentives and withdrawal history
      await fetchIncentives();
      await fetchWithdrawalHistory();

      // Close modal and reset state
      setShowWithdrawModal(false);
      setWithdrawalAmount("");
      setWithdrawalReason("");

      toast.success(`ইনসেনটিভ থেকে ${formatCurrency(amount)} তোলা হয়ে গেছে`);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("টাকা তোলা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const cancelWithdrawal = () => {
    setShowWithdrawModal(false);
    setWithdrawalAmount("");
    setWithdrawalReason("");
  };

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async (
    page: number = 1,
    append: boolean = false,
  ) => {
    if (employees.length === 0) return;

    try {
      if (!append) setIsLoadingHistory(true);
      else setHistoryPagination((prev) => ({ ...prev, isLoadingMore: true }));

      const employeeId = employees[0].id; // Replace with actual logged-in employee
      const history = await ApiService.getWithdrawalHistory(employeeId, {
        page,
        page_size: 10,
      });

      if (Array.isArray(history)) {
        setWithdrawalHistory(
          append ? [...withdrawalHistory, ...history] : history,
        );
        setHistoryPagination({
          hasNext: false,
          currentPage: page,
          isLoadingMore: false,
        });
      } else if (history && history.results) {
        setWithdrawalHistory(
          append ? [...withdrawalHistory, ...history.results] : history.results,
        );
        setHistoryPagination({
          hasNext: !!history.next,
          currentPage: page,
          isLoadingMore: false,
        });
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      setHistoryPagination((prev) => ({ ...prev, isLoadingMore: false }));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadMoreHistory = () => {
    if (!historyPagination.isLoadingMore && historyPagination.hasNext) {
      fetchWithdrawalHistory(historyPagination.currentPage + 1, true);
    }
  };

  // Load withdrawal history when incentives are loaded
  useEffect(() => {
    if (
      activeTab === "incentives" &&
      !isLoadingIncentives &&
      incentives.length > 0
    ) {
      fetchWithdrawalHistory();
    }
  }, [activeTab, isLoadingIncentives, incentives.length]);

  // Filter and sort employees - ensure employees is always an array
  const safeEmployeesForFilter = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployeesForFilter
    .filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone.includes(searchTerm);
      const matchesStatus =
        filterStatus === "all" || employee.status === filterStatus;
      const matchesDepartment =
        filterDepartment === "all" || employee.department === filterDepartment;
      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "salary-high":
          return b.salary - a.salary;
        case "salary-low":
          return a.salary - b.salary;
        case "recent":
          return (
            new Date(b.hiring_date).getTime() -
            new Date(a.hiring_date).getTime()
          );
        default:
          return 0;
      }
    });

  // Download employees list as PDF
  const downloadEmployeesList = () => {
    const totalSalary = sumBy(filteredEmployees, (emp) => emp.salary);
    const activeCount = filteredEmployees.filter(
      (emp) => emp.status === "active"
    ).length;

    const opened = printSheet({
      title: "কর্মচারীর তালিকা",
      cards: [
        { label: "মোট কর্মচারী", value: String(filteredEmployees.length) },
        { label: "Active", value: String(activeCount) },
        {
          label: "মাসিক বেতন",
          value: `${currencySymbol}${totalSalary.toLocaleString("bn-BD-u-nu-latn")}`,
        },
        {
          label: "ইনসেনটিভ",
          value: `${currencySymbol}${totalIncentives.toLocaleString("bn-BD-u-nu-latn")}`,
        },
      ],
      head: ["#", "কর্মচারী", "পদ ও ডিপার্টমেন্ট", "জয়েন", "অবস্থা", "বেতন"],
      numericColumns: [0, 5],
      rows: filteredEmployees.map((emp, index) => [
        index + 1,
        `${emp.name}\n${emp.phone || ""}`,
        `${emp.role}\n${emp.department}`,
        emp.hiring_date
          ? new Date(emp.hiring_date).toLocaleDateString("bn-BD-u-nu-latn")
          : "—",
        emp.status === "active" ? "Active" : "Inactive",
        `${currencySymbol}${num(emp.salary).toLocaleString("bn-BD-u-nu-latn")}`,
      ]),
      footNote: `মোট মাসিক বেতন: ${currencySymbol}${totalSalary.toLocaleString(
        "bn-BD-u-nu-latn"
      )}`,
    });

    if (!opened) {
      toast.error(
        "প্রিন্ট উইন্ডো খোলা যায়নি — ব্রাউজারে পপ-আপ চালু করে আবার চেষ্টা করুন"
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কর্মচারী</h1>
            <p className="page-sub">তালিকা আনা হচ্ছে…</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কর্মচারী</h1>
          </div>
        </header>
        <div className="plane">
          <div className="empty">
            <p className="mb-1 font-medium text-slate-900">
              কর্মচারীদের তালিকা আনা যায়নি
            </p>
            <p className="mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">কর্মচারী</h1>
          <p className="page-sub">
            কর্মচারীদের তালিকা, বেতন আর ইনসেনটিভের হিসাব
          </p>
        </div>
      </header>

      <div className="plane">
        {/* Stats */}
        <div className="stat-strip">
          {/* Total Employees */}
          <div className="stat">
            <div className="stat-label">মোট কর্মচারী</div>
            <div className="stat-value num">{totalEmployees}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>

          {/* Active Employees */}
          <div className="stat">
            <div className="stat-label">Active কর্মচারী</div>
            <div className="stat-value num">{activeEmployees}</div>
            <div className="stat-meta">এখন কাজ করছে</div>
          </div>

          {/* Total Salary */}
          <div className="stat">
            <div className="stat-label">মোট বেতন</div>
            <div className="stat-value num">{formatCurrency(totalSalary)}</div>
            <div className="stat-meta">সব কর্মচারী মিলিয়ে</div>
          </div>

          {/* Total Incentives */}
          <div className="stat">
            <div className="stat-label">মোট ইনসেনটিভ</div>
            <div className="stat-value num money-pos">
              {isLoadingIncentives
                ? "লোড হচ্ছে…"
                : formatCurrency(totalIncentives)}
            </div>
            <div className="stat-meta">সব পুরস্কার মিলিয়ে</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="plane-section">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("employees")}
              className={`btn btn-sm ${
                activeTab === "employees" ? "btn-primary" : "btn-ghost"
              }`}
            >
              কর্মচারী
            </button>
            <button
              onClick={() => setActiveTab("incentives")}
              className={`btn btn-sm ${
                activeTab === "incentives" ? "btn-primary" : "btn-ghost"
              }`}
            >
              ইনসেনটিভ
            </button>
          </div>
        </div>

        {/* Controls and Filters */}
        {activeTab === "employees" && (
          <>
            <div className="plane-section">
              <div className="flex flex-wrap items-center gap-2">
                {/* Add Employee Button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  নতুন কর্মচারী
                </button>

                {/* Payroll lives here rather than in the sidebar: it is a
                    thing you do *to* this list, not a separate destination. */}
                <Link
                  href="/dashboard/employees/payroll"
                  className="btn btn-ghost"
                >
                  <Wallet className="w-4 h-4" />
                  বেতন ম্যানেজমেন্ট
                </Link>

                {/* Download Button */}
                <button
                  onClick={downloadEmployeesList}
                  className="btn btn-ghost"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>

                {/* Search */}
                <input
                  type="text"
                  placeholder="নাম, ইমেইল, পদ বা ফোন দিয়ে খুঁজুন"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input max-w-xs"
                />

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="select w-auto"
                >
                  <option value="all">সব অবস্থা</option>
                  <option value="active">Active</option>
                  <option value="suspended">সাসপেন্ড</option>
                  <option value="resigned">চাকরি ছেড়েছে</option>
                  <option value="corrupted">সমস্যা আছে</option>
                </select>

                {/* Department Filter */}
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="select w-auto"
                >
                  <option value="all">সব ডিপার্টমেন্ট</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select w-auto"
                >
                  <option value="name">নাম অনুযায়ী</option>
                  <option value="salary-high">বেতন: বেশি থেকে কম</option>
                  <option value="salary-low">বেতন: কম থেকে বেশি</option>
                  <option value="recent">নতুন জয়েন করা</option>
                </select>
              </div>
            </div>

            {/* Employee List */}
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>কর্মচারী</th>
                    <th>পদ আর ডিপার্টমেন্ট</th>
                    <th className="cell-num">বেতন</th>
                    <th>অবস্থা</th>
                    <th>লগইন</th>
                    <th>জয়েন করেছে</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="block w-full text-left"
                        >
                          <div className="cell-strong hover:text-cyan-700">
                            {employee.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {employee.email}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <div>{employee.role}</div>
                        <div className="text-xs text-slate-500">
                          {employee.department}
                        </div>
                      </td>
                      <td className="cell-num money-pos">
                        {formatCurrency(employee.salary)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            EMPLOYEE_STATUS_BADGE[employee.status] ??
                            "badge-muted"
                          }`}
                        >
                          {EMPLOYEE_STATUS_LABEL[employee.status] ??
                            employee.status}
                        </span>
                      </td>
                      <td>
                        {/* Whether this person can sign in. Managed on the
                            রোল সেটিংস tab, shown here so the owner does not
                            have to go looking. */}
                        {employee.login_status === "enabled" ? (
                          <span className="badge badge-success">চালু</span>
                        ) : employee.login_status === "disabled" ? (
                          <span className="badge badge-danger">বন্ধ</span>
                        ) : (
                          <span className="text-xs text-slate-400">দেওয়া হয়নি</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {formatDate(employee.hiring_date)}
                      </td>
                      <td className="text-right">
                        <div className="row-actions">
                          <SmsReminderButton
                            name={employee.name}
                            phone={employee.phone}
                            mode="message"
                            label=""
                            title={`${employee.name}-কে এসএমএস`}
                            className="text-slate-500 hover:text-cyan-600"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEmployee(employee);
                            }}
                            className="text-slate-500 hover:text-cyan-600"
                            title="বিস্তারিত দেখুন"
                            aria-label="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(employee);
                            }}
                            disabled={editingEmployeeId === employee.id}
                            className="text-slate-500 hover:text-cyan-600 disabled:opacity-50"
                            title="এডিট করুন"
                            aria-label="এডিট করুন"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(employee);
                            }}
                            className="text-slate-500 hover:text-rose-600"
                            title="ডিলিট করুন"
                            aria-label="ডিলিট করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty">
                          <p className="mb-1 font-medium text-slate-900">
                            কোনো কর্মচারী পাওয়া যায়নি
                          </p>
                          <p>খোঁজার শব্দ বা ফিল্টার একটু বদলে দেখুন।</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {employeesPagination.hasNextPage && (
              <div className="plane-section flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  {employeesPagination.count} জনের মধ্যে {employees.length} জন
                  দেখাচ্ছে
                </p>
                <button
                  onClick={loadMoreEmployees}
                  disabled={employeesPagination.isLoadingMore}
                  className="btn btn-ghost"
                >
                  {employeesPagination.isLoadingMore
                    ? "আরও লোড হচ্ছে…"
                    : "আরও দেখুন"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Incentives Tab Content */}
        {activeTab === "incentives" && (
          <>
            {/* Total Available Balance */}
            {!isLoadingIncentives &&
              incentives.length > 0 &&
              (() => {
                const totalAvailableForWithdrawal = incentives
                  .filter((inc) => inc.status === "paid" && inc.amount > 0)
                  .reduce((sum, inc) => sum + num(inc.amount), 0);

                return (
                  <div className="plane-section flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="section-title">এখন তোলা যাবে</div>
                      <div className="stat-value num money-pos">
                        {formatCurrency(totalAvailableForWithdrawal)}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        পরিশোধ হওয়া সব ইনসেনটিভ একসাথে তুলে নিন
                      </p>
                    </div>
                    <button
                      onClick={handleWithdrawTotal}
                      disabled={totalAvailableForWithdrawal <= 0}
                      className="btn btn-primary"
                    >
                      <TrendingDown className="w-4 h-4" />
                      টাকা তুলুন
                    </button>
                  </div>
                );
              })()}

            {/* Incentives List */}
            <div className="plane-section border-t border-slate-200">
              <div className="section-title">আপনার ইনসেনটিভ</div>
              <p className="text-sm text-slate-500">
                সব ইনসেনটিভের বিস্তারিত আর অবস্থা
              </p>
            </div>

            {isLoadingIncentives ? (
              <div className="empty">ইনসেনটিভ লোড হচ্ছে…</div>
            ) : incentives.length === 0 ? (
              <div className="empty">
                <p className="mb-1 font-medium text-slate-900">
                  কোনো ইনসেনটিভ নেই
                </p>
                <p>এখন পর্যন্ত কোনো ইনসেনটিভ যোগ করা হয়নি।</p>
              </div>
            ) : (
              <>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>ইনসেনটিভ</th>
                        <th>টাইপ</th>
                        <th>তারিখ</th>
                        <th>অবস্থা</th>
                        <th className="cell-num">টাকার পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incentives.map((incentive) => (
                        <tr key={incentive.id}>
                          <td>
                            <div className="cell-strong">{incentive.title}</div>
                            {incentive.description && (
                              <div className="text-xs text-slate-500">
                                {incentive.description}
                              </div>
                            )}
                          </td>
                          <td>
                            {INCENTIVE_TYPE_LABEL[incentive.type] ??
                              incentive.type}
                          </td>
                          <td className="whitespace-nowrap">
                            {formatDate(incentive.date_awarded)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                INCENTIVE_STATUS_BADGE[incentive.status] ??
                                "badge-muted"
                              }`}
                            >
                              {INCENTIVE_STATUS_LABEL[incentive.status] ??
                                incentive.status}
                            </span>
                          </td>
                          <td className="cell-num money-pos">
                            {formatCurrency(incentive.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load More Incentives Button */}
                {incentivesPagination.hasNext && (
                  <div className="plane-section border-t border-slate-200">
                    <button
                      onClick={loadMoreIncentives}
                      disabled={incentivesPagination.isLoadingMore}
                      className="btn btn-ghost w-full"
                    >
                      {incentivesPagination.isLoadingMore
                        ? "আরও লোড হচ্ছে…"
                        : "আরও ইনসেনটিভ দেখুন"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Withdrawal History */}
            <div className="plane-section border-t border-slate-200">
              <div className="section-title">টাকা তোলার হিস্ট্রি</div>
              <p className="text-sm text-slate-500">আগে যত টাকা তুলেছেন</p>
            </div>

            {isLoadingHistory ? (
              <div className="empty">হিস্ট্রি লোড হচ্ছে…</div>
            ) : withdrawalHistory.length === 0 ? (
              <div className="empty">
                <p className="mb-1">এখনো কোনো টাকা তোলা হয়নি।</p>
                <p>টাকা তুললে এখানে দেখা যাবে।</p>
              </div>
            ) : (
              <>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>তারিখ</th>
                        <th>কারণ</th>
                        <th className="cell-num">টাকার পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalHistory.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td className="cell-strong whitespace-nowrap">
                            {formatDate(withdrawal.withdrawal_date)}
                          </td>
                          <td>
                            <div>
                              {withdrawal.reason || "ইনসেনটিভ থেকে তোলা"}
                            </div>
                            {withdrawal.notes && (
                              <div className="text-xs text-slate-500">
                                {withdrawal.notes}
                              </div>
                            )}
                          </td>
                          <td className="cell-num money-neg">
                            {formatCurrency(withdrawal.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load More History Button */}
                {historyPagination.hasNext && (
                  <div className="plane-section border-t border-slate-200">
                    <button
                      onClick={loadMoreHistory}
                      disabled={historyPagination.isLoadingMore}
                      className="btn btn-ghost w-full"
                    >
                      {historyPagination.isLoadingMore
                        ? "আরও লোড হচ্ছে…"
                        : "আরও হিস্ট্রি দেখুন"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "28rem" }}>
            <div className="modal-head">
              <h2 className="modal-title">কর্মচারী ডিলিট করবেন?</h2>
              <button
                onClick={cancelDelete}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                &quot;{employeeToDelete.name}&quot; কে ডিলিট করবেন? এটা আর
                ফেরানো যাবে না, তার সব তথ্যও মুছে যাবে।
              </p>
            </div>
            <div className="modal-foot">
              <button onClick={cancelDelete} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? "ডিলিট হচ্ছে…" : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">নতুন কর্মচারী যোগ করুন</h2>
              <button
                onClick={handleCloseCreateModal}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee Name */}
                <div>
                  <label className="label">কর্মচারীর নাম *</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    className="input"
                    placeholder="নাম লিখুন"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label">ইমেইল *</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        email: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="ইমেইল লিখুন"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        phone: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="ফোন নম্বর লিখুন"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="label">পদ *</label>
                  <input
                    type="text"
                    value={newEmployee.role}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value })
                    }
                    className="input"
                    placeholder="কী কাজ করবে"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="label">ডিপার্টমেন্ট *</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        department: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="ডিপার্টমেন্ট লিখুন"
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="label">মাসিক বেতন *</label>
                  <input
                    type="number"
                    value={newEmployee.salary}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        salary: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="মাসে কত টাকা"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="label">ঠিকানা</label>
                  <textarea
                    rows={3}
                    value={newEmployee.address}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        address: e.target.value,
                      })
                    }
                    className="textarea resize-none"
                    placeholder="ঠিকানা লিখুন (না দিলেও চলবে)"
                  />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                onClick={handleCloseCreateModal}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={handleCreateEmployee}
                disabled={
                  isCreating ||
                  !newEmployee.name ||
                  !newEmployee.email ||
                  !newEmployee.phone ||
                  !newEmployee.role ||
                  !newEmployee.department ||
                  !newEmployee.salary
                }
                className="btn btn-primary"
              >
                {isCreating ? "যোগ হচ্ছে…" : "কর্মচারী যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "28rem" }}>
            <div className="modal-head">
              <h2 className="modal-title">ইনসেনটিভ থেকে টাকা তুলুন</h2>
              <button
                onClick={cancelWithdrawal}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-500">এখন জমা আছে</span>
                <span className="num money-pos font-semibold">
                  {formatCurrency(
                    incentives
                      .filter((inc) => inc.status === "paid" && inc.amount > 0)
                      .reduce((sum, inc) => sum + num(inc.amount), 0),
                  )}
                </span>
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
                  placeholder="টাকার অঙ্ক লিখুন"
                  min="0"
                  max={incentives
                    .filter((inc) => inc.status === "paid" && inc.amount > 0)
                    .reduce((sum, inc) => sum + num(inc.amount), 0)}
                  step="0.01"
                  className="input"
                />
                <p className="mt-1 text-xs text-slate-500">
                  সর্বোচ্চ:{" "}
                  {formatCurrency(
                    incentives
                      .filter((inc) => inc.status === "paid" && inc.amount > 0)
                      .reduce((sum, inc) => sum + num(inc.amount), 0),
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="withdrawalReason" className="label">
                  কারণ (না দিলেও চলবে)
                </label>
                <textarea
                  id="withdrawalReason"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  placeholder="কেন তুলছেন লিখুন (না দিলেও চলবে)"
                  rows={3}
                  className="textarea resize-none"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                onClick={cancelWithdrawal}
                disabled={isWithdrawing}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={processWithdrawal}
                disabled={
                  isWithdrawing ||
                  !withdrawalAmount ||
                  parseFloat(withdrawalAmount) <= 0
                }
                className="btn btn-primary"
              >
                {isWithdrawing ? "হচ্ছে…" : "টাকা তুলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
