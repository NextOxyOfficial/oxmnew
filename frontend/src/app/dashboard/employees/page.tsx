"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { Employee, CreateEmployeeData } from "@/types/employee";
import employeeAPI from "@/lib/employeeAPI";

export default function EmployeesPage() {
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const formatCurrency = useCurrencyFormatter();
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
    null
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

        const data = await employeeAPI.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calculate stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const averageSalary =
    employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length || 0;

  // Get unique departments for filter
  const departments = Array.from(
    new Set(employees.map((emp) => emp.department))
  ).filter(Boolean);

  // Handle view employee details
  const handleViewEmployee = (employee: Employee) => {
    router.push(`/dashboard/employees/${employee.id}`);
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    // For now, just show an alert - can be replaced with navigation to edit form
    alert(
      `Edit employee: ${employee.name}\nThis would navigate to the edit form.`
    );
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
      alert("Failed to delete employee. Please try again.");
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
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsCreating(true);

      // Generate unique employee ID
      const employee_id = `EMP${Date.now().toString().slice(-6)}`;

      const createData: CreateEmployeeData = {
        employee_id,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        address: newEmployee.address || "",
        role: newEmployee.role,
        department: newEmployee.department,
        salary: parseFloat(newEmployee.salary),
        hiring_date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
        status: "active",
      };

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
      const viewDetails = window.confirm(
        `Employee "${createdEmployee.name}" created successfully!\n\nWould you like to view their details now?`
      );

      if (viewDetails) {
        router.push(`/dashboard/employees/${createdEmployee.id}`);
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      alert("Failed to create employee. Please try again.");
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

  // Filter and sort employees
  const filteredEmployees = employees
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add title and date in one row
    doc.setFontSize(18);
    doc.text("Employee List Report", 14, 22);

    // Add generation date on the same line, right-aligned
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      pageWidth - 14,
      22,
      { align: "right" }
    );

    // Prepare table data
    const tableHeaders = [
      "#",
      "Name",
      "Department",
      "Status",
      "Bank Details",
      "Salary",
    ];

    const tableData = filteredEmployees.map((emp) => [
      emp.id,
      `${emp.name}\n${emp.phone}`,
      `${emp.department}\n${emp.role}`,
      emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
      `${emp.bank_name || "N/A"} - ${emp.bank_branch || "N/A"}\n${
        emp.account_number || "N/A"
      }`,
      `${currencySymbol}${emp.salary}`,
    ]);

    // Add table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        minCellHeight: 12,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue header
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250], // Light gray for alternate rows
      },
      columnStyles: {
        0: {
          // ID column
          cellWidth: 12,
          halign: "center",
          valign: "middle",
        },
        1: {
          // Name column (with phone under it)
          cellWidth: 40,
          overflow: "linebreak",
          valign: "top",
        },
        2: {
          // Department column (with role under it)
          cellWidth: 35,
          overflow: "linebreak",
          valign: "top",
        },
        3: {
          // Status column
          cellWidth: 18,
          halign: "center",
          valign: "middle",
        },
        4: {
          // Bank Details column
          cellWidth: 45,
          overflow: "linebreak",
          valign: "top",
        },
        5: {
          // Salary column
          cellWidth: 22,
          halign: "right",
          valign: "middle",
        },
      },
      margin: { top: 40, right: 14, bottom: 25, left: 14 },
      theme: "striped",
      didDrawPage: function (data) {
        // Add page numbering
        const pageNumber = data.pageNumber;
        const totalPages = doc.getNumberOfPages();

        // Page number at bottom center
        doc.setFontSize(8);
        doc.setTextColor(100);
        const pageText = `Page ${pageNumber} of ${totalPages}`;
        doc.text(pageText, pageWidth / 2, doc.internal.pageSize.height - 10, {
          align: "center",
        });
      },
    });

    // Calculate total salary
    const totalSalary = filteredEmployees.reduce(
      (sum, emp) => sum + emp.salary,
      0
    );
    const averageSalary =
      filteredEmployees.length > 0
        ? Math.round(totalSalary / filteredEmployees.length)
        : 0;

    // Add footer with summary and credits
    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // Simple summary text at bottom
    doc.setFontSize(9);
    doc.setTextColor(0);
    (doc as any).setFont("helvetica", "normal");

    const summaryY = finalY + 15;

    // Add summary text in one line
    const summaryText = `Total Employees: ${
      filteredEmployees.length
    }    Total Monthly Salary: $${totalSalary.toLocaleString()}    Average Salary: $${averageSalary.toLocaleString()}`;
    doc.text(summaryText, 14, summaryY);

    // Credits at bottom right
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      "Generated by oxymanager.com",
      pageWidth - 14,
      doc.internal.pageSize.height - 20,
      { align: "right" }
    );

    // Save the PDF
    doc.save(`employees_list_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4"
                >
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Employees
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your workforce and employee information
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Total Employees */}
          <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-600/8 border border-cyan-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-cyan-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-300 font-medium">
                  Total Employees
                </p>
                <p className="text-base font-bold text-cyan-400">
                  {totalEmployees}
                </p>
                <p className="text-xs text-cyan-500 opacity-80">
                  All workforce
                </p>
              </div>
            </div>
          </div>

          {/* Active Employees */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">
                  Active Employees
                </p>
                <p className="text-base font-bold text-green-400">
                  {activeEmployees}
                </p>
                <p className="text-xs text-green-500 opacity-80">
                  Currently working
                </p>
              </div>
            </div>
          </div>

          {/* Average Salary */}
          <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/8 border border-yellow-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-yellow-500/20 p-1.5">
                <svg
                  className="h-7 w-7 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-yellow-300 font-medium">
                  Avg Salary
                </p>
                <p className="text-base font-bold text-yellow-400">
                  {formatCurrency(averageSalary)}
                </p>
                <p className="text-xs text-yellow-500 opacity-80">
                  Per employee
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Add Employee Button and Search */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Add Employee Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>

              {/* Download Button */}
              <button
                onClick={downloadEmployeesList}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>

              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm pl-10 pr-4"
                  />
                </div>
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[140px]"
              >
                <option value="all" className="bg-slate-800">
                  All Status
                </option>
                <option value="active" className="bg-slate-800">
                  Active
                </option>
                <option value="suspended" className="bg-slate-800">
                  Suspended
                </option>
                <option value="resigned" className="bg-slate-800">
                  Resigned
                </option>
                <option value="corrupted" className="bg-slate-800">
                  Corrupted
                </option>
              </select>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[160px]"
              >
                <option value="all" className="bg-slate-800">
                  All Departments
                </option>
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-slate-800">
                    {dept}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm min-w-[180px]"
              >
                <option value="name" className="bg-slate-800">
                  Sort by Name
                </option>
                <option value="salary-high" className="bg-slate-800">
                  Salary: High to Low
                </option>
                <option value="salary-low" className="bg-slate-800">
                  Salary: Low to High
                </option>
                <option value="recent" className="bg-slate-800">
                  Recently Hired
                </option>
              </select>
            </div>
          </div>

          {/* Employee List */}
          <div className="mt-6">
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => handleViewEmployee(employee)}
                        className="text-left w-full group"
                      >
                        <h4 className="text-slate-100 font-medium line-clamp-1 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                          {employee.name}
                        </h4>
                      </button>
                      <p className="text-slate-400 text-sm mt-1">
                        {employee.role}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {employee.department}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {employee.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Salary</p>
                      <p className="text-sm font-medium text-green-400">
                        {formatCurrency(employee.salary)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">
                      Hired: {formatDate(employee.hiring_date)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEmployee(employee);
                      }}
                      className="flex-1 bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="View Details"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEmployee(employee);
                      }}
                      className="flex-1 text-slate-300 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showDeleteConfirmation(employee);
                      }}
                      className="flex-1 text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Employee Details
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Role & Department
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Salary
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Status
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Hired Date
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="text-left group w-full"
                        >
                          <div className="text-sm font-medium text-slate-100 group-hover:text-cyan-400 cursor-pointer transition-colors">
                            {employee.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {employee.email}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-300">
                            {employee.role}
                          </div>
                          <div className="text-sm text-slate-400">
                            {employee.department}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-green-400">
                          {formatCurrency(employee.salary)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            employee.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {employee.status}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-300">
                          {formatDate(employee.hiring_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEmployee(employee);
                            }}
                            className="bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(employee);
                            }}
                            className="text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(employee);
                            }}
                            className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* No employees found */}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No employees found
                </h3>
                <p className="text-slate-400 mb-4">
                  Try adjusting your search criteria or check back later for new
                  employees.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && employeeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Delete Employee
              </h3>
              <p className="text-slate-300 mb-4">
                Are you sure you want to delete &quot;{employeeToDelete.name}
                &quot;? This action cannot be undone and will remove all
                employee data.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Employee Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Add New Employee
                  </h2>
                  <button
                    onClick={handleCloseCreateModal}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Employee Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Employee Name *
                    </label>
                    <input
                      type="text"
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter employee name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
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
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newEmployee.phone}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
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
                      Role *
                    </label>
                    <input
                      type="text"
                      value={newEmployee.role}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, role: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter job role"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={newEmployee.department}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
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
                      Monthly Salary *
                    </label>
                    <input
                      type="number"
                      value={newEmployee.salary}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          salary: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter monthly salary"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={newEmployee.address}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                      placeholder="Enter employee address (optional)"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
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
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isCreating ? "Creating..." : "Add Employee"}
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
