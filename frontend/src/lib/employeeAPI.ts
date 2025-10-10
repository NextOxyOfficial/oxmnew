import {
  CreateEmployeeData,
  CreateIncentiveData,
  CreateSalaryRecordData,
  CreateTaskData,
  Document,
  Employee,
  Incentive,
  PaymentInformation,
  SalaryRecord,
  Task,
  UpdateEmployeeData,
  UpdatePaymentInformationData,
} from "@/types/employee";

// Import the AuthToken from the main API service
import { AuthToken } from "./api";

// Interface for paginated employee response
interface PaginatedEmployeeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Employee[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

class EmployeeAPI {
  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = AuthToken.get();

    const defaultHeaders: HeadersInit = {};

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      (defaultHeaders as Record<string, string>)["Content-Type"] =
        "application/json";
    }

    // Add authorization header if token exists
    if (token) {
      (defaultHeaders as Record<string, string>)[
        "Authorization"
      ] = `Token ${token}`;
    }

    const config: RequestInit = {
      headers: defaultHeaders,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: "Network error" };
        }

        console.error(`API Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          url,
          errorData,
        });

        // Try to extract a meaningful error message
        let errorMessage = `HTTP error! status: ${response.status}`;

        if (errorData) {
          if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors.join(", ")
              : errorData.non_field_errors;
          } else {
            // Try to extract field-specific errors
            const fieldErrors = [];
            for (const [field, errors] of Object.entries(errorData)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(", ")}`);
              } else if (typeof errors === "string") {
                fieldErrors.push(`${field}: ${errors}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join("; ");
            }
          }
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Employee endpoints
  async getEmployees(
    page?: number
  ): Promise<PaginatedEmployeeResponse | Employee[]> {
    const url = page ? `/employees/?page=${page}` : "/employees/";
    return this.fetchAPI(url);
  }

  async getEmployee(id: number): Promise<Employee> {
    return this.fetchAPI(`/employees/${id}/`);
  }

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "photo" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return this.fetchAPI("/employees/", {
      method: "POST",
      body: formData,
    });
  }

  async updateEmployee(
    id: number,
    data: Partial<UpdateEmployeeData>
  ): Promise<Employee> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "photo" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return this.fetchAPI(`/employees/${id}/`, {
      method: "PATCH",
      body: formData,
    });
  }

  async deleteEmployee(id: number): Promise<void> {
    await this.fetchAPI(`/employees/${id}/`, {
      method: "DELETE",
    });
  }

  // Employee-related data endpoints
  async getEmployeeIncentives(employeeId: number): Promise<Incentive[]> {
    return this.fetchAPI(`/employees/${employeeId}/incentives/`);
  }

  async getEmployeeSalaryRecords(employeeId: number): Promise<SalaryRecord[]> {
    return this.fetchAPI(`/employees/${employeeId}/salary_records/`);
  }

  async getEmployeeTasks(employeeId: number): Promise<Task[]> {
    return this.fetchAPI(`/employees/${employeeId}/tasks/`);
  }

  async getEmployeeDocuments(employeeId: number): Promise<Document[]> {
    return this.fetchAPI(`/employees/${employeeId}/documents/`);
  }

  async getEmployeePaymentInfo(
    employeeId: number
  ): Promise<PaymentInformation> {
    return this.fetchAPI(`/employees/${employeeId}/payment_info/`);
  }

  // Incentive endpoints
  async getIncentives(): Promise<Incentive[]> {
    return this.fetchAPI("/incentives/");
  }

  async createIncentive(
    employeeId: number,
    data: CreateIncentiveData
  ): Promise<Incentive> {
    return this.fetchAPI(`/incentives/`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        employee: employeeId
      }),
    });
  }

  async updateIncentive(
    id: number,
    data: Partial<CreateIncentiveData>
  ): Promise<Incentive> {
    return this.fetchAPI(`/incentives/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteIncentive(id: number): Promise<void> {
    await this.fetchAPI(`/incentives/${id}/`, {
      method: "DELETE",
    });
  }

  // Task endpoints
  async getTasks(): Promise<Task[]> {
    return this.fetchAPI("/tasks/");
  }

  async createTask(employeeId: number, data: CreateTaskData): Promise<Task> {
    return this.fetchAPI(`/employees/${employeeId}/tasks/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(
    id: number,
    data: Partial<
      CreateTaskData & { status?: Task["status"]; completed_date?: string }
    >
  ): Promise<Task> {
    return this.fetchAPI(`/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async markTaskCompleted(id: number): Promise<Task> {
    return this.updateTask(id, {
      status: "completed",
      completed_date: new Date().toISOString(),
    });
  }

  async deleteTask(id: number): Promise<void> {
    await this.fetchAPI(`/tasks/${id}/`, {
      method: "DELETE",
    });
  }

  // Salary Record endpoints
  async getSalaryRecords(): Promise<SalaryRecord[]> {
    return this.fetchAPI("/salary-records/");
  }

  async createSalaryRecord(
    employeeId: number,
    data: CreateSalaryRecordData
  ): Promise<SalaryRecord> {
    return this.fetchAPI(`/employees/${employeeId}/salary_records/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSalaryRecord(
    id: number,
    data: Partial<CreateSalaryRecordData>
  ): Promise<SalaryRecord> {
    return this.fetchAPI(`/salary-records/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSalaryRecord(id: number): Promise<void> {
    await this.fetchAPI(`/salary-records/${id}/`, {
      method: "DELETE",
    });
  }

  // Payment Information endpoints
  async updatePaymentInformation(
    employeeId: number,
    data: UpdatePaymentInformationData
  ): Promise<PaymentInformation> {
    return this.fetchAPI(`/employees/${employeeId}/payment_info/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Document endpoints
  async uploadDocument(
    employeeId: number,
    file: File,
    name: string,
    category: Document["category"]
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("category", category);
    formData.append("employee", String(employeeId));

    return this.fetchAPI("/documents/", {
      method: "POST",
      body: formData,
    });
  }

  async deleteDocument(id: number): Promise<void> {
    await this.fetchAPI(`/documents/${id}/`, {
      method: "DELETE",
    });
  }

  // Utility methods for statistics
  async getEmployeeStats() {
    const response = await this.getEmployees();

    // Handle both direct array and paginated response
    let employees: Employee[] = [];
    if (Array.isArray(response)) {
      employees = response;
    } else if (response && "results" in response) {
      employees = response.results;
    }

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(
      (e: Employee) => e.status === "active"
    ).length;
    const averageSalary =
      employees.reduce((sum: number, emp: Employee) => sum + emp.salary, 0) /
        employees.length || 0;
    const departments = Array.from(
      new Set(employees.map((emp: Employee) => emp.department))
    ).filter(Boolean);

    return {
      totalEmployees,
      activeEmployees,
      averageSalary,
      departments,
      inactiveEmployees: totalEmployees - activeEmployees,
    };
  }
}

export const employeeAPI = new EmployeeAPI();
export default employeeAPI;
