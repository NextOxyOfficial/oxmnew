export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  photo?: string;
  role: string;
  department: string;
  manager?: string;
  salary: number;
  hiring_date: string;
  status: "active" | "suspended" | "resigned" | "corrupted";
  tasks_assigned: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentInformation {
  id: number;
  employee: number;
  bank_name?: string;
  account_number?: string;
  bank_branch?: string;
  account_holder_name?: string;
  tax_id?: string;
  tax_withholding?: "single" | "married" | "married-separate" | "head";
  payment_method: "direct-deposit" | "check" | "wire" | "cash";
  pay_frequency: "weekly" | "bi-weekly" | "monthly";
  payment_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Incentive {
  id: number;
  employee: number;
  title: string;
  description?: string;
  amount: number;
  date_awarded: string;
  type: "bonus" | "commission" | "achievement" | "performance";
  status: "pending" | "approved" | "paid";
  created_at: string;
  updated_at: string;
}

export interface SalaryRecord {
  id: number;
  employee: number;
  month: string;
  year: number;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  status: "pending" | "paid" | "processing";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  employee: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_date: string;
  due_date: string;
  completed_date?: string;
  assigned_by: string;
  project?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  employee: number;
  name: string;
  category:
    | "contract"
    | "id_document"
    | "certificate"
    | "performance"
    | "other";
  file: string;
  size: number;
  upload_date: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

// Create/Update types
export interface CreateEmployeeData {
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: string;
  department: string;
  manager?: string;
  salary: number;
  hiring_date: string;
  status?: "active" | "suspended" | "resigned" | "corrupted";
  photo?: File;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id: number;
}

export interface CreateIncentiveData {
  title: string;
  description?: string;
  amount: number;
  type: "bonus" | "commission" | "achievement" | "performance";
  status?: "pending" | "approved" | "paid";
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  assigned_by: string;
  project?: string;
}

export interface CreateSalaryRecordData {
  month: string;
  year: number;
  base_salary: number;
  overtime_hours?: number;
  overtime_rate?: number;
  bonuses?: number;
  deductions?: number;
}

export interface UpdatePaymentInformationData {
  bank_name?: string;
  account_number?: string;
  bank_branch?: string;
  account_holder_name?: string;
  tax_id?: string;
  tax_withholding?: "single" | "married" | "married-separate" | "head";
  payment_method?: "direct-deposit" | "check" | "wire" | "cash";
  pay_frequency?: "weekly" | "bi-weekly" | "monthly";
  payment_notes?: string;
}
