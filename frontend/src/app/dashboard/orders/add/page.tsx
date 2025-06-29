"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import { Product } from "@/types/product";

// Customer interface
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  previous_due?: number; // Customer's existing debt
}

// Employee interface
interface Employee {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

// Types for the order
interface OrderItem {
  id: string;
  product: number;
  variant?: number;
  quantity: number;
  unit_price: number;
  total: number;
  product_name: string;
  variant_details?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
}

interface OrderForm {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  vat_percentage: number;
  vat_amount: number;
  due_amount: number;
  apply_due_to_total: boolean; // Whether to subtract due amount from total
  previous_due: number; // Customer's existing debt
  apply_previous_due_to_total: boolean; // Whether to add previous due amount to total
  total: number;
  due_date: string;
  notes: string;
  status: "draft" | "pending" | "confirmed";
  // Internal company fields (not shown on invoice)
  employee_id?: number;
  incentive_amount: number;
  net_profit: number; // total - incentive_amount
}

export default function AddOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "guest">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isSalesIncentiveOpen, setIsSalesIncentiveOpen] = useState(false);
  const [customerValidationError, setCustomerValidationError] = useState<string | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  // Order form state
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
    },
    items: [],
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    vat_percentage: 0,
    vat_amount: 0,
    due_amount: 0,
    apply_due_to_total: true, // Default to true - include due in total calculation
    previous_due: 0,
    apply_previous_due_to_total: true, // Default to true - include previous due in total calculation
    total: 0,
    due_date: "",
    notes: "",
    status: "draft",
    // Internal company fields
    employee_id: undefined,
    incentive_amount: 0,
    net_profit: 0,
  });

  // State for adding new items
  const [newItem, setNewItem] = useState({
    product: "",
    variant: "",
    quantity: 1,
    unit_price: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchEmployees();
    // Set default due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    setOrderForm((prev) => ({
      ...prev,
      due_date: dueDate.toISOString().split("T")[0],
    }));
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await ApiService.getProducts();
      setProducts(Array.isArray(response) ? response : response?.results || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      // Mock customer data - replace with actual API call when available
      const mockCustomers: Customer[] = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Main St, New York, NY 10001",
          previous_due: 150.75 // Has existing debt
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "+1 (555) 234-5678",
          address: "456 Oak Ave, Los Angeles, CA 90210",
          previous_due: 0 // No existing debt
        },
        {
          id: 3,
          name: "Bob Wilson",
          email: "bob@example.com",
          phone: "+1 (555) 345-6789",
          address: "789 Pine St, Chicago, IL 60601",
          previous_due: 89.50 // Has existing debt
        },
        {
          id: 4,
          name: "Alice Johnson",
          email: "alice@example.com",
          phone: "+1 (555) 456-7890",
          address: "321 Elm Dr, Miami, FL 33101",
          previous_due: 0 // No existing debt
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      // Mock employee data - replace with actual API call when available
      const mockEmployees: Employee[] = [
        {
          id: 1,
          name: "Sarah Johnson",
          email: "sarah@company.com",
          department: "Sales",
          position: "Sales Manager"
        },
        {
          id: 2,
          name: "Mike Chen",
          email: "mike@company.com",
          department: "Sales",
          position: "Sales Representative"
        },
        {
          id: 3,
          name: "Emily Davis",
          email: "emily@company.com",
          department: "Sales",
          position: "Account Executive"
        },
        {
          id: 4,
          name: "James Wilson",
          email: "james@company.com",
          department: "Sales",
          position: "Sales Associate"
        },
        {
          id: 5,
          name: "Lisa Brown",
          email: "lisa@company.com",
          department: "Marketing",
          position: "Marketing Coordinator"
        }
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Calculate totals
  const calculateTotals = (
    items: OrderItem[],
    discountPercentage: number,
    vatPercentage: number,
    dueAmount: number,
    applyDueToTotal: boolean,
    previousDue: number,
    applyPreviousDueToTotal: boolean,
    incentiveAmount: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * vatPercentage) / 100;
    // Only subtract due amount if checkbox is checked, only add previous due if checkbox is checked
    const total = afterDiscount + vatAmount - (applyDueToTotal ? dueAmount : 0) + (applyPreviousDueToTotal ? previousDue : 0);
    const netProfit = total - incentiveAmount;

    return {
      subtotal,
      discountAmount,
      vatAmount,
      total,
      netProfit,
    };
  };

  // Update totals when items, discount, VAT, due amount, apply_due_to_total, previous due, apply_previous_due_to_total, or incentive changes
  useEffect(() => {
    const { subtotal, discountAmount, vatAmount, total, netProfit } = calculateTotals(
      orderForm.items,
      orderForm.discount_percentage,
      orderForm.vat_percentage,
      orderForm.due_amount,
      orderForm.apply_due_to_total,
      orderForm.previous_due,
      orderForm.apply_previous_due_to_total,
      orderForm.incentive_amount
    );

    setOrderForm((prev) => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      vat_amount: vatAmount,
      total,
      net_profit: netProfit,
    }));
  }, [
    orderForm.items,
    orderForm.discount_percentage,
    orderForm.vat_percentage,
    orderForm.due_amount,
    orderForm.apply_due_to_total,
    orderForm.previous_due,
    orderForm.apply_previous_due_to_total,
    orderForm.incentive_amount,
  ]);

  // Handle customer info changes
  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setOrderForm((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));

    // Clear validation error when user starts typing
    if (customerValidationError) {
      setCustomerValidationError(null);
    }

    // Check for existing customer if email or phone is being changed
    if ((field === 'email' || field === 'phone') && value.trim()) {
      const existingCustomer = customers.find(c => 
        (field === 'email' && c.email.toLowerCase() === value.toLowerCase()) ||
        (field === 'phone' && c.phone === value)
      );
      
      if (existingCustomer) {
        setCustomerValidationError(`A customer with this ${field} already exists: ${existingCustomer.name}`);
      }
    }
  };

  // Handle customer selection
  const handleCustomerSelection = (customerId: number) => {
    if (customerId) {
      setCustomerType("existing");
      setSelectedCustomerId(customerId);
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        setOrderForm((prev) => ({
          ...prev,
          customer: {
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            address: selectedCustomer.address || "",
            company: "",
          },
          previous_due: selectedCustomer.previous_due || 0,
          apply_previous_due_to_total: true, // Default to true when selecting customer
        }));
      }
    } else {
      // If no customer selected, reset to neutral state (no customer type selected)
      setCustomerType("existing");
      setSelectedCustomerId(null);
      setOrderForm((prev) => ({
        ...prev,
        customer: {
          name: "",
          email: "",
          phone: "",
          address: "",
          company: "",
        },
        previous_due: 0,
        apply_previous_due_to_total: true,
      }));
    }
  };

  // Handle customer type change
  const handleCustomerTypeChange = (type: "existing" | "guest") => {
    setCustomerType(type);
    if (type === "guest") {
      setSelectedCustomerId(null);
      setOrderForm((prev) => ({
        ...prev,
        customer: {
          name: "",
          email: "",
          phone: "",
          address: "",
          company: "",
        },
        previous_due: 0,
        apply_previous_due_to_total: true,
      }));
    }
  };

  // Handle new customer selection
  const handleGuestCustomer = () => {
    setCustomerType("guest");
    setSelectedCustomerId(null);
    setOrderForm((prev) => ({
      ...prev,
      customer: {
        name: "",
        email: "",
        phone: "",
        address: "",
        company: "",
      },
      previous_due: 0,
      apply_previous_due_to_total: true,
    }));
  };

  // Handle new item form changes
  const handleNewItemChange = (field: string, value: string | number) => {
    setNewItem((prev) => {
      const updated = { ...prev, [field]: value };

      // Reset variant when product changes
      if (field === "product") {
        updated.variant = "";
      }

      return updated;
    });
  };

  // Add item to order
  const addItemToOrder = () => {
    if (!newItem.product) {
      setError("Please select a product");
      return;
    }

    const selectedProduct = products.find(
      (p) => p.id === parseInt(newItem.product)
    );
    if (!selectedProduct) return;

    const selectedVariant = selectedProduct.variants?.find(
      (v) => v.id === parseInt(newItem.variant)
    );

    // Use default quantity of 1 and unit price from product/variant
    const quantity = 1;
    const unitPrice = selectedVariant ? selectedVariant.sell_price || 0 : selectedProduct.sell_price || 0;

    const item: OrderItem = {
      id: Date.now().toString(),
      product: parseInt(newItem.product),
      variant: newItem.variant ? parseInt(newItem.variant) : undefined,
      quantity: quantity,
      unit_price: unitPrice,
      total: quantity * unitPrice,
      product_name: selectedProduct.name,
      variant_details: selectedVariant
        ? `${selectedVariant.color} - ${selectedVariant.size}${
            selectedVariant.custom_variant
              ? ` - ${selectedVariant.custom_variant}`
              : ""
          }`
        : undefined,
    };

    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));

    // Reset new item form
    setNewItem({
      product: "",
      variant: "",
      quantity: 1,
      unit_price: 0,
    });
    setError(null);
  };

  // Remove item from order
  const removeItem = (itemId: string) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      ),
    }));
  };

  // Handle form submission
  const handleSubmit = async (status: "draft" | "pending") => {
    if (orderForm.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    if (!orderForm.customer.name) {
      setError("Please enter customer name");
      return;
    }

    if (customerValidationError) {
      setError("Please fix the customer validation errors before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create individual sales for each item
      for (const item of orderForm.items) {
        const saleData = {
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customer_name: orderForm.customer.name,
          customer_phone: orderForm.customer.phone || undefined,
          customer_email: orderForm.customer.email || undefined,
          notes: `Order Status: ${status}\nDue Date: ${
            orderForm.due_date
          }\nCustomer Address: ${orderForm.customer.address}\n${
            orderForm.customer.company
              ? `Company: ${orderForm.customer.company}\n`
              : ""
          }Order Notes: ${orderForm.notes}`,
        };

        await ApiService.createProductSale(saleData);
      }

      // Navigate back to orders page
      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get selected product for new item
  const selectedProduct = products.find(
    (p) => p.id === parseInt(newItem.product)
  );
  const availableVariants = selectedProduct?.has_variants
    ? selectedProduct.variants || []
    : [];

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearch.trim()) return true;
    const search = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone.includes(search)
    );
  });

  // Filter employees based on search
  const filteredEmployees = employees.filter(employee => {
    if (!employeeSearch.trim()) return true;
    const search = employeeSearch.toLowerCase();
    return (
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      (employee.position && employee.position.toLowerCase().includes(search))
    );
  });

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
      `}</style>
      <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <div className="flex items-center gap-1 mb-4">
                  <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-slate-200">
                    Create New Order
                  </h3>
                </div>

                {/* Customer Selection Row */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Customer Selection
                  </label>
                  <div className="flex gap-4 items-center">
                    {/* Customer Dropdown with Integrated Search */}
                    <div className="flex-1 relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search and select customer..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          onFocus={() => setIsCustomerDropdownOpen(true)}
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        />
                        <svg
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      
                      {/* Dropdown Options */}
                      {isCustomerDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                          {isLoadingCustomers ? (
                            <div className="p-3 text-slate-400">Loading customers...</div>
                          ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => {
                                  handleCustomerSelection(customer.id);
                                  setCustomerSearch(`${customer.name} (${customer.email}) - ${customer.phone}`);
                                  setIsCustomerDropdownOpen(false);
                                }}
                                className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                              >
                                <div className="text-white font-medium">{customer.name}</div>
                                <div className="text-slate-400 text-sm">{customer.email} • {customer.phone}</div>
                                {customer.previous_due && customer.previous_due > 0 && (
                                  <div className="text-red-400 text-xs">Previous Due: {formatCurrency(customer.previous_due)}</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-slate-400">No customers found</div>
                          )}
                        </div>
                      )}
                      
                      {/* Click outside to close dropdown */}
                      {isCustomerDropdownOpen && (
                        <div
                          className="fixed inset-0 z-5"
                          onClick={() => setIsCustomerDropdownOpen(false)}
                        />
                      )}
                    </div>

                    {/* New Customer Checkbox */}
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={customerType === "guest"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleGuestCustomer();
                            } else {
                              // If unchecked, switch to existing customer mode and clear form
                              setCustomerType("existing");
                              setSelectedCustomerId(null);
                              setOrderForm((prev) => ({
                                ...prev,
                                customer: {
                                  name: "",
                                  email: "",
                                  phone: "",
                                  address: "",
                                  company: "",
                                },
                                previous_due: 0,
                                apply_previous_due_to_total: true,
                              }));
                            }
                          }}
                          className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2 rounded"
                        />
                        <span className="text-slate-300">New Customer</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* New Customer Form */}
                {customerType === "guest" && (
                  <div>
                    {/* Customer Validation Error */}
                    {customerValidationError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{customerValidationError}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={orderForm.customer.name}
                        onChange={(e) =>
                          handleCustomerChange("name", e.target.value)
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Company
                      </label>
                      <input
                        type="text"
                        value={orderForm.customer.company}
                        onChange={(e) =>
                          handleCustomerChange("company", e.target.value)
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Company name (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={orderForm.customer.email}
                        onChange={(e) =>
                          handleCustomerChange("email", e.target.value)
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="customer@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={orderForm.customer.phone}
                        onChange={(e) =>
                          handleCustomerChange("phone", e.target.value)
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Address
                      </label>
                      <textarea
                        value={orderForm.customer.address}
                        onChange={(e) =>
                          handleCustomerChange("address", e.target.value)
                        }
                        rows={2}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Customer address"
                      />
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Order Items
                </h3>

                {/* Order Items List */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">
                    Items in Order ({orderForm.items.length})
                  </h4>
                  {orderForm.items.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 14H6L5 9z"
                        />
                      </svg>
                      <p>No items added yet</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Use the form below to add items to your order
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Column Headers */}
                      <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700/30 mb-2">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Product
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                          Quantity
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                          Unit Price
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                          Total
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                      {orderForm.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-4 gap-4 items-center py-3 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
                        >
                          {/* Product Name */}
                          <div className="flex-1">
                            <div className="font-medium text-slate-100 text-sm">
                              {item.product_name}
                            </div>
                            {item.variant_details && (
                              <div className="text-xs text-slate-400 mt-1">
                                {item.variant_details}
                              </div>
                            )}
                            {/* Variant Selection for products with variants */}
                            {(() => {
                              const product = products.find(p => p.id === item.product);
                              return product?.has_variants && product.variants && product.variants.length > 0 ? (
                                <div className="mt-2">
                                  <select
                                    value={item.variant || ""}
                                    onChange={(e) => {
                                      const variantId = e.target.value ? parseInt(e.target.value) : undefined;
                                      const selectedVariant = product.variants?.find(v => v.id === variantId);
                                      const newUnitPrice = selectedVariant ? selectedVariant.sell_price || 0 : product.sell_price || 0;
                                      
                                      setOrderForm((prev) => ({
                                        ...prev,
                                        items: prev.items.map((orderItem) =>
                                          orderItem.id === item.id
                                            ? {
                                                ...orderItem,
                                                variant: variantId,
                                                unit_price: newUnitPrice,
                                                total: orderItem.quantity * newUnitPrice,
                                                variant_details: selectedVariant
                                                  ? `${selectedVariant.color} - ${selectedVariant.size}${
                                                      selectedVariant.custom_variant
                                                        ? ` - ${selectedVariant.custom_variant}`
                                                        : ""
                                                    }`
                                                  : undefined,
                                              }
                                            : orderItem
                                        ),
                                      }));
                                    }}
                                    className="w-full bg-slate-700/50 border border-slate-600/50 text-white text-xs rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                                  >
                                    <option value="" className="bg-slate-800">
                                      Select variant
                                    </option>
                                    {product.variants.map((variant) => (
                                      <option
                                        key={variant.id}
                                        value={variant.id}
                                        className="bg-slate-800"
                                      >
                                        {variant.color} - {variant.size}
                                        {variant.custom_variant && ` - ${variant.custom_variant}`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                              className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-slate-100 font-medium text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                              className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs"
                            >
                              +
                            </button>
                          </div>

                          {/* Unit Price */}
                          <div className="text-center">
                            <div className="text-sm text-slate-100">
                              {formatCurrency(item.unit_price)}
                            </div>
                          </div>

                          {/* Total Price & Actions */}
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-100 text-sm">
                              {formatCurrency(item.total)}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors ml-2"
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
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>

                {/* Add Item Form */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">
                    Add New Item
                  </h4>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 md:flex-[2]">
                      <select
                        value={newItem.product}
                        onChange={(e) =>
                          handleNewItemChange("product", e.target.value)
                        }
                        disabled={isLoadingProducts}
                        className={`w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                          isLoadingProducts
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="" className="bg-slate-800">
                          {isLoadingProducts
                            ? "Loading products..."
                            : "Select product"}
                        </option>
                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                            className="bg-slate-800"
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct?.has_variants && (
                      <div className="flex-1">
                        <select
                          value={newItem.variant}
                          onChange={(e) =>
                            handleNewItemChange("variant", e.target.value)
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        >
                          <option value="" className="bg-slate-800">
                            Select variant
                          </option>
                          {availableVariants.map((variant) => (
                            <option
                              key={variant.id}
                              value={variant.id}
                              className="bg-slate-800"
                            >
                              {variant.color} - {variant.size}
                              {variant.custom_variant &&
                                ` - ${variant.custom_variant}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <button
                        onClick={addItemToOrder}
                        className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg whitespace-nowrap"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bill Summary */}
          <div className="space-y-6">
              {/* Bill Summary */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
                <div className="sm:p-4 p-2">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Bill Summary
                  </h3>

                  <div className="space-y-3">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="text-slate-100">
                        {formatCurrency(orderForm.subtotal)}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Discount:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderForm.discount_percentage === 0 ? "" : orderForm.discount_percentage}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              discount_percentage:
                                parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder=""
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                        <span className="text-slate-100">
                          -{formatCurrency(orderForm.discount_amount)}
                        </span>
                      </div>
                    </div>

                    {/* VAT */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">VAT:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderForm.vat_percentage === 0 ? "" : orderForm.vat_percentage}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              vat_percentage: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                        <span className="text-slate-100">
                          {formatCurrency(orderForm.vat_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Due */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Due:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderForm.due_amount === 0 ? "" : orderForm.due_amount}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              due_amount: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">$</span>
                        <span className="text-slate-100">
                          -{formatCurrency(orderForm.due_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Previous Due - Only show if customer has previous due */}
                    {orderForm.previous_due > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Previous Due:</span>
                          <span className="text-red-400 font-medium">
                            {orderForm.apply_previous_due_to_total ? "+" : ""}{formatCurrency(orderForm.previous_due)}
                          </span>
                        </div>
                        {/* Checkbox to include previous due in total */}
                        <div className="flex items-center gap-2 ml-2">
                          <input
                            type="checkbox"
                            id="apply-previous-due-to-total"
                            checked={orderForm.apply_previous_due_to_total}
                            onChange={(e) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                apply_previous_due_to_total: e.target.checked,
                              }))
                            }
                            className="w-3 h-3 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-1 rounded"
                          />
                          <label htmlFor="apply-previous-due-to-total" className="text-xs text-slate-400 cursor-pointer">
                            Apply previous due to total
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                      <span className="text-slate-100 font-semibold">Total:</span>
                      <span className="text-cyan-400 font-semibold text-lg">
                        {formatCurrency(orderForm.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Settings */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
                <div className="sm:p-4 p-2">
                  <div className="space-y-4">
                    {/* Incentive Section - Company Internal */}
                    <div>
                      <button
                        onClick={() => setIsSalesIncentiveOpen(!isSalesIncentiveOpen)}
                        className="w-full flex items-center justify-between text-sm font-medium text-orange-400 mb-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
                      >
                        <span>Sales Incentive (Internal)</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isSalesIncentiveOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      
                      {isSalesIncentiveOpen && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Employee
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search and select employee..."
                                value={employeeSearch}
                                onChange={(e) => {
                                  setEmployeeSearch(e.target.value);
                                  setIsEmployeeDropdownOpen(true);
                                }}
                                onFocus={() => setIsEmployeeDropdownOpen(true)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                              />
                              <svg
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                              
                              {/* Dropdown Options */}
                              {isEmployeeDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto scrollbar-hide">
                                  {isLoadingEmployees ? (
                                    <div className="p-3 text-slate-400">Loading employees...</div>
                                  ) : filteredEmployees.length > 0 ? (
                                    <>
                                      <div
                                        onClick={() => {
                                          setOrderForm((prev) => ({ ...prev, employee_id: undefined }));
                                          setEmployeeSearch("");
                                          setIsEmployeeDropdownOpen(false);
                                        }}
                                        className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 text-slate-400"
                                      >
                                        No employee selected
                                      </div>
                                      {filteredEmployees.map((employee) => (
                                        <div
                                          key={employee.id}
                                          onClick={() => {
                                            setOrderForm((prev) => ({ ...prev, employee_id: employee.id }));
                                            setEmployeeSearch(`${employee.name} - ${employee.position}`);
                                            setIsEmployeeDropdownOpen(false);
                                          }}
                                          className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                        >
                                          <div className="text-white font-medium">{employee.name}</div>
                                          <div className="text-slate-400 text-sm">{employee.position} • {employee.email}</div>
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="p-3 text-slate-400">No employees found</div>
                                  )}
                                </div>
                              )}
                              
                              {/* Click outside to close dropdown */}
                              {isEmployeeDropdownOpen && (
                                <div
                                  className="fixed inset-0 z-5"
                                  onClick={() => setIsEmployeeDropdownOpen(false)}
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                              Incentive Amount
                            </label>
                            <input
                              type="number"
                              value={orderForm.incentive_amount === 0 ? "" : orderForm.incentive_amount}
                              onChange={(e) =>
                                setOrderForm((prev) => ({
                                  ...prev,
                                  incentive_amount: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          {/* Net Profit Display */}
                          {orderForm.total > 0 && (
                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Order Total:</span>
                                <span className="text-sm text-slate-100">{formatCurrency(orderForm.total)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Incentive:</span>
                                <span className="text-sm text-orange-400">-{formatCurrency(orderForm.incentive_amount)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                                <span className="text-sm font-medium text-slate-300">Net Profit:</span>
                                <span className="text-sm font-semibold text-green-400">{formatCurrency(orderForm.net_profit)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit("pending")}
                  disabled={isSubmitting || orderForm.items.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </button>

                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={isSubmitting || orderForm.items.length === 0}
                  className="flex-1 px-6 py-3 bg-slate-600 text-slate-100 text-sm font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all duration-200"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
