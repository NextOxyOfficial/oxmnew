"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, User, Award, ClipboardList, FileText, X, Upload, Download, Trash2, Star, Gift, TrendingUp, Clock, CheckCircle2, StickyNote, MessageSquare } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: string;
  department: string;
  salary: number;
  hiring_date: string;
  photo?: string;
  status: 'active' | 'suspended' | 'resigned' | 'corrupted';
  tasks_assigned: number;
  tasks_completed: number;
  manager?: string;
  employee_id: string;
}

interface Incentive {
  id: number;
  title: string;
  description: string;
  amount: number;
  date_awarded: string;
  type: 'bonus' | 'commission' | 'achievement' | 'performance';
  status: 'pending' | 'approved' | 'paid';
}

interface SalaryRecord {
  id: number;
  month: string;
  year: number;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  status: 'pending' | 'paid' | 'processing';
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_date: string;
  due_date: string;
  completed_date?: string;
  assigned_by: string;
  project?: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  upload_date: string;
  category: 'contract' | 'id_document' | 'certificate' | 'performance' | 'other';
  url: string;
}

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    department: '',
    salary: '',
    manager: '',
    employee_id: '',
    status: 'active' as 'active' | 'suspended' | 'resigned' | 'corrupted'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [newIncentive, setNewIncentive] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'bonus' as 'bonus' | 'commission' | 'achievement' | 'performance'
  });
  const [isAddingIncentive, setIsAddingIncentive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incentiveToDelete, setIncentiveToDelete] = useState<number | null>(null);
  const [isDeletingIncentive, setIsDeletingIncentive] = useState(false);
  const [showSalaryDeleteModal, setShowSalaryDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<number | null>(null);
  const [isDeletingSalary, setIsDeletingSalary] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    base_salary: '',
    overtime_hours: '',
    overtime_rate: '',
    bonuses: '',
    deductions: ''
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [markingTaskDone, setMarkingTaskDone] = useState<number | null>(null);
  const [newDocument, setNewDocument] = useState({
    name: '',
    category: 'other' as Document['category'],
    file: null as File | null
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEmployeeId = () => {
    return Array.isArray(params.id) ? params.id[0] : params.id;
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const employeeId = getEmployeeId();
      
      // Mock data
      const mockEmployee: Employee = {
        id: parseInt(employeeId || '1'),
        name: "Alice Johnson",
        email: "alice.johnson@company.com", 
        phone: "+1 (555) 123-4567",
        address: "123 Main St, City, State 12345",
        role: "Software Engineer",
        department: "Development",
        salary: 6250,
        hiring_date: "2023-01-15",
        photo: "/avatars/alice.jpg",
        status: "active",
        tasks_assigned: 24,
        tasks_completed: 22,
        manager: "Bob Smith",
        employee_id: "EMP001"
      };

      const mockIncentives: Incentive[] = [
        { id: 1, title: "Q1 Performance Bonus", description: "Exceeded quarterly targets", amount: 2500, date_awarded: "2025-04-01", type: "performance", status: "paid" },
        { id: 2, title: "Project Completion Bonus", description: "Successfully delivered major project", amount: 1500, date_awarded: "2025-03-15", type: "bonus", status: "approved" },
        { id: 3, title: "Innovation Award", description: "Implemented new efficiency tool", amount: 1000, date_awarded: "2025-02-20", type: "achievement", status: "pending" },
      ];

      const mockSalaryRecords: SalaryRecord[] = [
        { id: 1, month: "June", year: 2025, base_salary: 6250, overtime_hours: 10, overtime_rate: 45, bonuses: 500, deductions: 200, net_salary: 6900, payment_date: "2025-06-30", status: "paid" },
        { id: 2, month: "May", year: 2025, base_salary: 6250, overtime_hours: 8, overtime_rate: 45, bonuses: 0, deductions: 150, net_salary: 6460, payment_date: "2025-05-31", status: "paid" },
        { id: 3, month: "April", year: 2025, base_salary: 6250, overtime_hours: 12, overtime_rate: 45, bonuses: 1000, deductions: 180, net_salary: 7610, payment_date: "2025-04-30", status: "paid" },
      ];

      const mockTasks: Task[] = [
        { id: 1, title: "API Development", description: "Develop REST API for user management", priority: "high", status: "in_progress", assigned_date: "2025-06-20", due_date: "2025-07-05", assigned_by: "Bob Smith", project: "User Portal v2.0" },
        { id: 2, title: "Code Review", description: "Review pull requests for feature branch", priority: "medium", status: "completed", assigned_date: "2025-06-25", due_date: "2025-06-27", completed_date: "2025-06-26", assigned_by: "Bob Smith", project: "Feature Release" },
        { id: 3, title: "Database Optimization", description: "Optimize queries for better performance", priority: "urgent", status: "pending", assigned_date: "2025-06-28", due_date: "2025-07-02", assigned_by: "Bob Smith", project: "Performance Improvement" },
      ];

      const mockDocuments: Document[] = [
        { id: 1, name: "Employment_Contract.pdf", type: "pdf", size: 245760, upload_date: "2023-01-15", category: "contract", url: "/documents/contract.pdf" },
        { id: 2, name: "ID_Copy.pdf", type: "pdf", size: 156432, upload_date: "2023-01-15", category: "id_document", url: "/documents/id.pdf" },
        { id: 3, name: "Certification_AWS.pdf", type: "pdf", size: 189273, upload_date: "2024-03-10", category: "certificate", url: "/documents/aws_cert.pdf" },
        { id: 4, name: "Performance_Review_2024.pdf", type: "pdf", size: 123456, upload_date: "2025-01-15", category: "performance", url: "/documents/review.pdf" },
      ];

      setEmployee(mockEmployee);
      setEmployeeForm({
        name: mockEmployee.name,
        email: mockEmployee.email,
        phone: mockEmployee.phone,
        address: mockEmployee.address || '',
        role: mockEmployee.role,
        department: mockEmployee.department,
        salary: mockEmployee.salary.toString(),
        manager: mockEmployee.manager || '',
        employee_id: mockEmployee.employee_id,
        status: mockEmployee.status
      });
      setIncentives(mockIncentives);
      setSalaryRecords(mockSalaryRecords);
      setTasks(mockTasks);
      setDocuments(mockDocuments);
      setIsLoading(false);
    };

    fetchEmployeeData();
  }, []);

  const handleSaveEmployee = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update employee data
      if (employee) {
        setEmployee({
          ...employee,
          name: employeeForm.name,
          email: employeeForm.email,
          phone: employeeForm.phone,
          address: employeeForm.address,
          role: employeeForm.role,
          department: employeeForm.department,
          salary: parseFloat(employeeForm.salary),
          manager: employeeForm.manager,
          employee_id: employeeForm.employee_id,
          status: employeeForm.status
        });
      }
      
      alert('Employee details updated successfully!');
    } catch (error) {
      alert('Failed to update employee details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!newDocument.file || !newDocument.name) {
      alert('Please select a file and enter a name.');
      return;
    }

    setUploadingFile(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDoc: Document = {
        id: Date.now(),
        name: newDocument.name,
        type: newDocument.file.type,
        size: newDocument.file.size,
        upload_date: new Date().toISOString(),
        category: newDocument.category,
        url: URL.createObjectURL(newDocument.file)
      };

      setDocuments(prev => [newDoc, ...prev]);
      setNewDocument({ name: '', category: 'other', file: null });
      setShowUploadModal(false);
      alert('Document uploaded successfully!');
    } catch (error) {
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      alert('Document deleted successfully!');
    } catch (error) {
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleAddIncentive = async () => {
    if (!newIncentive.title || !newIncentive.amount) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsAddingIncentive(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const incentive: Incentive = {
        id: Date.now(),
        title: newIncentive.title,
        description: newIncentive.description,
        amount: parseFloat(newIncentive.amount),
        date_awarded: new Date().toISOString(),
        type: newIncentive.type,
        status: 'pending'
      };

      setIncentives(prev => [incentive, ...prev]);
      setNewIncentive({ title: '', description: '', amount: '', type: 'bonus' });
      setShowIncentiveModal(false);
      alert('Incentive added successfully!');
    } catch (error) {
      alert('Failed to add incentive. Please try again.');
    } finally {
      setIsAddingIncentive(false);
    }
  };

  const handleDeleteIncentive = async () => {
    if (!incentiveToDelete) return;

    setIsDeletingIncentive(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIncentives(prev => prev.filter(incentive => incentive.id !== incentiveToDelete));
      setShowDeleteModal(false);
      setIncentiveToDelete(null);
      alert('Incentive deleted successfully!');
    } catch (error) {
      alert('Failed to delete incentive. Please try again.');
    } finally {
      setIsDeletingIncentive(false);
    }
  };

  const openDeleteModal = (incentiveId: number) => {
    setIncentiveToDelete(incentiveId);
    setShowDeleteModal(true);
  };

  const handleDeleteSalary = async () => {
    if (!salaryToDelete) return;

    setIsDeletingSalary(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSalaryRecords(prev => prev.filter(record => record.id !== salaryToDelete));
      setShowSalaryDeleteModal(false);
      setSalaryToDelete(null);
      alert('Salary record deleted successfully!');
    } catch (error) {
      alert('Failed to delete salary record. Please try again.');
    } finally {
      setIsDeletingSalary(false);
    }
  };

  const openSalaryDeleteModal = (salaryId: number) => {
    setSalaryToDelete(salaryId);
    setShowSalaryDeleteModal(true);
  };

  const handleAddTransaction = async () => {
    // Check if at least one meaningful field has a value
    const hasBaseSalary = newTransaction.base_salary && parseFloat(newTransaction.base_salary) > 0;
    const hasOvertime = newTransaction.overtime_hours && newTransaction.overtime_rate && 
                       parseFloat(newTransaction.overtime_hours) > 0 && parseFloat(newTransaction.overtime_rate) > 0;
    const hasBonuses = newTransaction.bonuses && parseFloat(newTransaction.bonuses) > 0;
    const hasDeductions = newTransaction.deductions && parseFloat(newTransaction.deductions) > 0;
    
    const hasValues = hasBaseSalary || hasOvertime || hasBonuses || hasDeductions;
    
    if (!newTransaction.month || !hasValues) {
      alert('Please select a month and add at least one complete transaction value.');
      return;
    }

    setIsAddingTransaction(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const baseSalary = parseFloat(newTransaction.base_salary) || 0;
      const overtimeHours = parseFloat(newTransaction.overtime_hours) || 0;
      const overtimeRate = parseFloat(newTransaction.overtime_rate) || 0;
      const bonuses = parseFloat(newTransaction.bonuses) || 0;
      const deductions = parseFloat(newTransaction.deductions) || 0;
      const overtimePay = overtimeHours * overtimeRate;
      const netSalary = baseSalary + overtimePay + bonuses - deductions;

      const transaction: SalaryRecord = {
        id: Date.now(),
        month: newTransaction.month,
        year: parseInt(newTransaction.year),
        base_salary: baseSalary,
        overtime_hours: overtimeHours,
        overtime_rate: overtimeRate,
        bonuses: bonuses,
        deductions: deductions,
        net_salary: netSalary,
        payment_date: new Date().toISOString(),
        status: 'pending'
      };

      setSalaryRecords(prev => [transaction, ...prev]);
      setNewTransaction({
        month: '',
        year: new Date().getFullYear().toString(),
        base_salary: '',
        overtime_hours: '',
        overtime_rate: '',
        bonuses: '',
        deductions: ''
      });
      setShowAddTransactionModal(false);
      alert('Transaction added successfully!');
    } catch (error) {
      alert('Failed to add transaction. Please try again.');
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleMarkTaskDone = async (taskId: number) => {
    setMarkingTaskDone(taskId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed' as const,
              completed_date: new Date().toISOString()
            }
          : task
      ));

      // Update employee's task completion count
      if (employee) {
        setEmployee(prev => prev ? {
          ...prev,
          tasks_completed: prev.tasks_completed + 1
        } : null);
      }

      alert('Task marked as completed!');
    } catch (error) {
      alert('Failed to mark task as completed. Please try again.');
    } finally {
      setMarkingTaskDone(null);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'paid': 
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'in_progress': 
      case 'processing': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
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
            <h3 className="text-lg font-medium text-slate-100 mb-2">Employee Not Found</h3>
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

  const totalIncentives = incentives.reduce((sum, incentive) => sum + incentive.amount, 0);
  const completionRate = employee.tasks_assigned > 0 ? (employee.tasks_completed / employee.tasks_assigned) * 100 : 0;
  const pendingTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length;

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Back Button and Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Employees</span>
          </button>
        </div>

        {/* Employee Header */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{employee.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{employee.role}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{employee.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 max-w-5xl">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 text-sm">Monthly Salary</p>
                <p className="text-xl font-bold text-white mt-1">{formatCurrency(employee.salary)}</p>
              </div>
              <DollarSign className="h-7 w-7 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300/80 text-sm">Task Completion</p>
                <p className="text-xl font-bold text-purple-400 mt-1">
                  {completionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-purple-300/60 mt-1">
                  {pendingTasks} pending tasks
                </p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300/80 text-sm">Total Incentives</p>
                <p className="text-xl font-bold text-yellow-400 mt-1">
                  {formatCurrency(totalIncentives)}
                </p>
              </div>
              <TrendingUp className="h-7 w-7 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl">
          <div className="flex border-b border-slate-700/50 mb-6 overflow-x-auto">
            {[
              { key: 'details', label: 'Employee Details', icon: <User className="w-4 h-4" /> },
              { key: 'incentives', label: 'Incentives', icon: <Gift className="w-4 h-4" /> },
              { key: 'salary', label: 'Salary', icon: <DollarSign className="w-4 h-4" /> },
              { key: 'tasks', label: 'Task Assigned', icon: <ClipboardList className="w-4 h-4" /> },
              { key: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {employee.photo ? (
                      <img src={employee.photo} alt={employee.name} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-slate-100">Profile Photo</h4>
                      <p className="text-sm text-slate-400">Upload or change employee photo</p>
                      <button className="mt-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors">
                        Change Photo
                      </button>
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, employee_id: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter department"
                      />
                    </div>

                    {/* Manager */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Manager
                      </label>
                      <input
                        type="text"
                        value={employeeForm.manager}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, manager: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter manager name"
                      />
                    </div>

                    {/* Monthly Salary */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Monthly Salary
                      </label>
                      <input
                        type="number"
                        value={employeeForm.salary}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
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
                        onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as 'active' | 'suspended' | 'resigned' | 'corrupted' })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="resigned">Resigned</option>
                        <option value="corrupted">Corrupted</option>
                      </select>
                    </div>

                    {/* Hiring Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Hiring Date
                      </label>
                      <div className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-slate-400 text-sm">
                        {formatDate(employee.hiring_date)}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={employeeForm.address}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                        placeholder="Enter employee address"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveEmployee}
                      disabled={isSaving}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Incentives Tab */}
            {activeTab === 'incentives' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Incentives & Bonuses</h4>
                    <button 
                      onClick={() => setShowIncentiveModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Incentive
                    </button>
                  </div>
                  
                  <div className="max-w-6xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {incentives.length > 0 ? (
                        <>
                          {/* Table Header */}
                          <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                              <div className="col-span-3">Date</div>
                              <div className="col-span-3">Type</div>
                              <div className="col-span-3">Amount</div>
                              <div className="col-span-3">Actions</div>
                            </div>
                          </div>
                          
                          {/* Table Body */}
                          <div className="divide-y divide-white/5">
                            {incentives.map((incentive) => (
                              <div key={incentive.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                  <div className="col-span-3">
                                    <p className="text-sm font-medium text-slate-100">{formatDate(incentive.date_awarded)}</p>
                                  </div>
                                  <div className="col-span-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      incentive.type === 'bonus' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                                      incentive.type === 'commission' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                                      incentive.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                      'bg-green-500/20 text-green-300 border border-green-400/30'
                                    }`}>
                                      {incentive.type}
                                    </span>
                                  </div>
                                  <div className="col-span-3">
                                    <p className="text-sm font-semibold text-green-300">{formatCurrency(incentive.amount)}</p>
                                  </div>
                                  <div className="col-span-3">
                                    <div className="flex items-center space-x-2">
                                      <button className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer disabled:opacity-50" title="Send SMS notification">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square w-4 h-4" aria-hidden="true">
                                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span>SMS</span>
                                      </button>
                                      <button 
                                        onClick={() => openDeleteModal(incentive.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer" 
                                        title="Delete"
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
                        <div className="text-center py-12">
                          <Award className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-400 mb-2">No Incentives Yet</h3>
                          <p className="text-slate-500">Add incentives to track employee rewards.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Salary Tab */}
            {activeTab === 'salary' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Salary Records</h4>
                    <button 
                      onClick={() => setShowAddTransactionModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Transaction
                    </button>
                  </div>
                  
                  <div className="max-w-6xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="col-span-2">Period</div>
                          <div className="col-span-2">Base Salary</div>
                          <div className="col-span-2">Overtime</div>
                          <div className="col-span-2">Bonuses</div>
                          <div className="col-span-2">Net Payment</div>
                          <div className="col-span-2">Actions</div>
                        </div>
                      </div>
                      
                      {/* Table Body */}
                      <div className="divide-y divide-white/5">
                        {salaryRecords.map((record) => (
                          <div key={record.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-100">{record.month} {record.year}</p>
                                <p className="text-xs text-slate-400">{formatDate(record.payment_date)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-300">{formatCurrency(record.base_salary)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-300">{record.overtime_hours}h × {formatCurrency(record.overtime_rate)}</p>
                                <p className="text-xs text-slate-400">{formatCurrency(record.overtime_hours * record.overtime_rate)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-semibold text-green-300">{formatCurrency(record.bonuses)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-bold text-green-400">{formatCurrency(record.net_salary)}</p>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                    {record.status}
                                  </span>
                                  <button className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer" title="Edit">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => openSalaryDeleteModal(record.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer" 
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Assigned Tasks</h4>
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer">
                      Assign Task
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="text-lg font-semibold text-white mb-1">{task.title}</h5>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>

                        <p className="text-slate-300 text-sm mb-4 line-clamp-3">{task.description}</p>

                        <div className="space-y-2 text-sm mb-4">
                          {task.project && (
                            <div className="flex items-center text-slate-400">
                              <ClipboardList className="w-4 h-4 mr-2" />
                              <span>{task.project}</span>
                            </div>
                          )}
                          <div className="flex items-center text-slate-400">
                            <User className="w-4 h-4 mr-2" />
                            <span>Assigned by {task.assigned_by}</span>
                          </div>
                          <div className="flex items-center text-slate-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Due: {formatDate(task.due_date)}</span>
                          </div>
                          {task.completed_date && (
                            <div className="flex items-center text-green-400">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              <span>Completed: {formatDate(task.completed_date)}</span>
                            </div>
                          )}
                        </div>

                        {/* Mark as Done Button */}
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleMarkTaskDone(task.id)}
                              disabled={markingTaskDone === task.id}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer flex items-center gap-1.5"
                            >
                              {markingTaskDone === task.id ? (
                                <>
                                  <Clock className="w-3 h-3 animate-spin" />
                                  <span>Marking...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Mark as Done</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {tasks.length === 0 && (
                    <div className="text-center py-12">
                      <ClipboardList className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-400 mb-2">No Tasks Assigned</h3>
                      <p className="text-slate-500">Assign tasks to track employee workload.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">Employee Documents</h4>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Document</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((document) => (
                      <div key={document.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <FileText className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-white line-clamp-1">{document.name}</h5>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                document.category === 'contract' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                                document.category === 'certificate' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                                document.category === 'performance' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                                'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                              }`}>
                                {document.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center text-slate-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(document.upload_date)}</span>
                          </div>
                          <div className="flex items-center text-slate-400">
                            <FileText className="w-4 h-4 mr-2" />
                            <span>{formatFileSize(document.size)}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => window.open(document.url, '_blank')}
                            className="flex-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(document.id)}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 p-2 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {documents.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-400 mb-2">No Documents Uploaded</h3>
                      <p className="text-slate-500">Upload employee documents to keep records organized.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Document Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Upload Document</h2>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Document Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      value={newDocument.name}
                      onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter document name"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({ ...newDocument, category: e.target.value as Document['category'] })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="contract">Contract</option>
                      <option value="id_document">ID Document</option>
                      <option value="certificate">Certificate</option>
                      <option value="performance">Performance Review</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Choose File *
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files?.[0] || null })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploadingFile || !newDocument.file || !newDocument.name}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {uploadingFile ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Incentive Modal */}
        {showIncentiveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Add Incentive</h2>
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
                      Incentive Title *
                    </label>
                    <input
                      type="text"
                      value={newIncentive.title}
                      onChange={(e) => setNewIncentive({ ...newIncentive, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter incentive title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newIncentive.description}
                      onChange={(e) => setNewIncentive({ ...newIncentive, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                      placeholder="Enter description (optional)"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newIncentive.amount}
                      onChange={(e) => setNewIncentive({ ...newIncentive, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter amount"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={newIncentive.type}
                      onChange={(e) => setNewIncentive({ ...newIncentive, type: e.target.value as 'bonus' | 'commission' | 'achievement' | 'performance' })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="bonus">Bonus</option>
                      <option value="commission">Commission</option>
                      <option value="achievement">Achievement</option>
                      <option value="performance">Performance</option>
                    </select>
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
                    disabled={isAddingIncentive || !newIncentive.title || !newIncentive.amount}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isAddingIncentive ? 'Adding...' : 'Add Incentive'}
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
                  <h2 className="text-xl font-semibold text-slate-100">Delete Incentive</h2>
                  <button 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setIncentiveToDelete(null);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-100">Are you sure?</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        This action cannot be undone. This will permanently delete the incentive from the employee's record.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setIncentiveToDelete(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteIncentive}
                    disabled={isDeletingIncentive}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isDeletingIncentive ? 'Deleting...' : 'Delete Incentive'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddTransactionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Add Transaction</h2>
                  <button 
                    onClick={() => setShowAddTransactionModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Info Note */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">
                      💡 You can add individual transaction components (e.g., just overtime, bonuses, or deductions) by filling only the relevant fields.
                    </p>
                  </div>

                  {/* Month and Year */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Month *
                      </label>
                      <select
                        value={newTransaction.month}
                        onChange={(e) => setNewTransaction({ ...newTransaction, month: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                      >
                        <option value="">Select Month</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        value={newTransaction.year}
                        onChange={(e) => setNewTransaction({ ...newTransaction, year: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="2025"
                      />
                    </div>
                  </div>

                  {/* Base Salary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Base Salary
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.base_salary}
                      onChange={(e) => setNewTransaction({ ...newTransaction, base_salary: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter base salary (optional)"
                    />
                  </div>

                  {/* Overtime */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Overtime Hours
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTransaction.overtime_hours}
                        onChange={(e) => setNewTransaction({ ...newTransaction, overtime_hours: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Hours"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Overtime Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTransaction.overtime_rate}
                        onChange={(e) => setNewTransaction({ ...newTransaction, overtime_rate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Rate/hr"
                      />
                    </div>
                  </div>

                  {/* Bonuses and Deductions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bonuses
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTransaction.bonuses}
                        onChange={(e) => setNewTransaction({ ...newTransaction, bonuses: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Bonus amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Deductions
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newTransaction.deductions}
                        onChange={(e) => setNewTransaction({ ...newTransaction, deductions: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Deduction amount"
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
                    disabled={isAddingTransaction || !newTransaction.month || !(
                      (newTransaction.base_salary && parseFloat(newTransaction.base_salary) > 0) ||
                      (newTransaction.overtime_hours && newTransaction.overtime_rate && parseFloat(newTransaction.overtime_hours) > 0 && parseFloat(newTransaction.overtime_rate) > 0) ||
                      (newTransaction.bonuses && parseFloat(newTransaction.bonuses) > 0) ||
                      (newTransaction.deductions && parseFloat(newTransaction.deductions) > 0)
                    )}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isAddingTransaction ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Salary Confirmation Modal */}
        {showSalaryDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Delete Salary Record</h2>
                  <button 
                    onClick={() => {
                      setShowSalaryDeleteModal(false);
                      setSalaryToDelete(null);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-100">Are you sure?</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        This action cannot be undone. This will permanently delete the salary record from the employee's financial history.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowSalaryDeleteModal(false);
                      setSalaryToDelete(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSalary}
                    disabled={isDeletingSalary}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isDeletingSalary ? 'Deleting...' : 'Delete Record'}
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
