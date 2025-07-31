"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Customer interface
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  previous_due?: number; // Customer's existing debt - calculated field
  status?: string;
  total_orders?: number;
  total_spent?: number;
}

// Employee interface
interface Employee {
  id: number;
  name: string;
  email: string;
  department?: string;
  role?: string;
  employee_id?: string;
  phone?: string;
  status?: string;
}

// Types for the order
interface OrderItem {
  id: string;
  product: number;
  variant?: number;
  quantity: number;
  unit_price: number;
  buy_price: number;
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

interface PaymentEntry {
  id: string;
  method: "Cash" | "Cheque" | "Bkash" | "Nagad" | "Bank";
  amount: number;
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
  // Payment information
  payments: PaymentEntry[];
  total_payment_received: number;
  remaining_balance: number; // total - total_payment_received
  // Internal company fields (not shown on invoice)
  employee_id?: number;
  incentive_amount: number;
  net_profit: number; // total - incentive_amount
  total_buy_price: number; // Total cost price of all items
  total_sell_price: number; // Total selling price of all items (before discounts)
  gross_profit: number; // total_sell_price - total_buy_price
}

export default function AddOrderPage() {
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "guest">(
    "existing"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isSalesIncentiveOpen, setIsSalesIncentiveOpen] = useState(false);
  const [customerValidationError, setCustomerValidationError] = useState<
    string | null
  >(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

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
    // Payment information
    payments: [],
    total_payment_received: 0,
    remaining_balance: 0,
    // Internal company fields
    employee_id: undefined,
    incentive_amount: 0,
    net_profit: 0,
    total_buy_price: 0,
    total_sell_price: 0,
    gross_profit: 0,
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
      console.log("Fetching customers from API...");
      const response = await ApiService.getCustomers();
      console.log("Customer API response:", response);
      const customers = Array.isArray(response)
        ? response
        : response?.results || [];
      console.log("Processed customers:", customers);

      // For each customer, we'll set previous_due to 0 initially
      // In a real scenario, you might want to fetch due payment info from a separate endpoint
      const customersWithDue = customers.map((customer: Customer) => ({
        ...customer,
        previous_due: customer.previous_due || 0, // Use existing value or default to 0
      }));

      setCustomers(customersWithDue);
      console.log("Customers set to state:", customersWithDue);
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
      const response = await ApiService.getEmployees();
      setEmployees(
        Array.isArray(response) ? response : response?.results || []
      );
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
    incentiveAmount: number,
    payments: PaymentEntry[]
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalBuyPrice = items.reduce(
      (sum, item) => sum + item.buy_price * item.quantity,
      0
    );
    const totalSellPrice = subtotal; // Sell price is the same as subtotal before discounts
    const discountAmount = (subtotal * discountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * vatPercentage) / 100;
    // Only subtract due amount if checkbox is checked, only add previous due if checkbox is checked
    const total =
      afterDiscount +
      vatAmount -
      (applyDueToTotal ? dueAmount : 0) +
      (applyPreviousDueToTotal ? previousDue : 0);
    const grossProfit = totalSellPrice - totalBuyPrice;
    const netProfit = grossProfit - incentiveAmount; // Net Profit = Gross Profit - Incentive
    const totalPaymentReceived = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const remainingBalance = total - totalPaymentReceived;

    return {
      subtotal,
      discountAmount,
      vatAmount,
      total,
      netProfit,
      totalBuyPrice,
      totalSellPrice,
      grossProfit,
      totalPaymentReceived,
      remainingBalance,
    };
  };

  // Update totals when items, discount, VAT, due amount, apply_due_to_total, previous due, apply_previous_due_to_total, payments, or incentive changes
  useEffect(() => {
    const {
      subtotal,
      discountAmount,
      vatAmount,
      total,
      netProfit,
      totalBuyPrice,
      totalSellPrice,
      grossProfit,
      totalPaymentReceived,
      remainingBalance,
    } = calculateTotals(
      orderForm.items,
      orderForm.discount_percentage,
      orderForm.vat_percentage,
      orderForm.due_amount,
      orderForm.apply_due_to_total,
      orderForm.previous_due,
      orderForm.apply_previous_due_to_total,
      orderForm.incentive_amount,
      orderForm.payments
    );

    setOrderForm((prev) => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      vat_amount: vatAmount,
      total,
      net_profit: netProfit,
      total_buy_price: totalBuyPrice,
      total_sell_price: totalSellPrice,
      gross_profit: grossProfit,
      total_payment_received: totalPaymentReceived,
      remaining_balance: remainingBalance,
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
    orderForm.payments,
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
    // Only validate if the field has a value (since these fields are optional for new customers)
    if ((field === "email" || field === "phone") && value.trim()) {
      const existingCustomer = customers.find(
        (c) =>
          (field === "email" &&
            c.email &&
            c.email.toLowerCase() === value.toLowerCase()) ||
          (field === "phone" && c.phone && c.phone === value)
      );

      if (existingCustomer) {
        setCustomerValidationError(
          `A customer with this ${field} already exists: ${existingCustomer.name}. You may want to select them from existing customers instead, or use a different ${field}.`
        );
      }
    }
  };

  // Handle customer selection
  const handleCustomerSelection = (customerId: number) => {
    if (customerId) {
      setCustomerType("existing");
      setSelectedCustomerId(customerId);
      const selectedCustomer = customers.find((c) => c.id === customerId);
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
    const unitPrice = selectedVariant
      ? selectedVariant.sell_price || 0
      : selectedProduct.sell_price || 0;
    const buyPrice = selectedVariant
      ? selectedVariant.buy_price || 0
      : selectedProduct.buy_price || 0;

    const item: OrderItem = {
      id: Date.now().toString(),
      product: parseInt(newItem.product),
      variant: newItem.variant ? parseInt(newItem.variant) : undefined,
      quantity: quantity,
      unit_price: unitPrice,
      buy_price: buyPrice,
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

  // Update item unit price
  const updateItemUnitPrice = (itemId: string, unitPrice: number) => {
    if (unitPrice < 0) return;

    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, unit_price: unitPrice, total: item.quantity * unitPrice }
          : item
      ),
    }));
  };

  // Payment management functions
  const addPayment = () => {
    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      method: "Cash",
      amount: 0,
    };

    setOrderForm((prev) => ({
      ...prev,
      payments: [...prev.payments, newPayment],
    }));
  };

  const removePayment = (paymentId: string) => {
    setOrderForm((prev) => ({
      ...prev,
      payments: prev.payments.filter((payment) => payment.id !== paymentId),
    }));
  };

  const updatePayment = (
    paymentId: string,
    field: keyof PaymentEntry,
    value: string | number
  ) => {
    setOrderForm((prev) => ({
      ...prev,
      payments: prev.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, [field]: value } : payment
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

    // Only block submission for validation errors if we're dealing with existing customers
    // For guest customers, we allow them to proceed even if there might be duplicate email/phone
    if (customerValidationError && customerType === "existing") {
      setError("Please fix the customer selection issues before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create individual sales for each item
      for (const item of orderForm.items) {
        // Build payment summary for notes
        const paymentSummary =
          orderForm.payments.length > 0
            ? `\nPayments:\n${orderForm.payments
                .map((p) => `- ${p.method}: ${formatCurrency(p.amount)}`)
                .join("\n")}\nTotal Paid: ${formatCurrency(
                orderForm.total_payment_received
              )}\nRemaining Balance: ${formatCurrency(
                orderForm.remaining_balance
              )}`
            : "\nNo payments recorded";

        const saleData = {
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customer_name: orderForm.customer.name,
          customer_phone: orderForm.customer.phone?.trim() || undefined,
          customer_email: orderForm.customer.email?.trim() || undefined,
          notes: `Order Status: ${status}\nDue Date: ${
            orderForm.due_date
          }\nCustomer Address: ${
            orderForm.customer.address || "Not provided"
          }\n${
            orderForm.customer.company
              ? `Company: ${orderForm.customer.company}\n`
              : ""
          }Order Notes: ${orderForm.notes}${paymentSummary}`,
        };

        await ApiService.createProductSale(saleData);
      }

      // Create incentive record if employee is selected and incentive amount is greater than 0
      if (orderForm.employee_id && orderForm.incentive_amount > 0) {
        const selectedEmployee = employees.find(
          (e) => e.id === orderForm.employee_id
        );
        const incentiveData = {
          employee: orderForm.employee_id,
          title: `Sales Incentive - Order for ${orderForm.customer.name}`,
          description: `Sales incentive for order containing ${
            orderForm.items.length
          } items. Total order value: ${formatCurrency(
            orderForm.total
          )}. Items: ${orderForm.items
            .map(
              (item) =>
                `${item.product_name}${
                  item.variant_details ? ` (${item.variant_details})` : ""
                } x${item.quantity}`
            )
            .join(", ")}`,
          amount: orderForm.incentive_amount,
          type: "commission" as const,
          status: "pending" as const,
        };

        try {
          await ApiService.createIncentive(incentiveData);
          console.log(
            "Incentive created successfully for employee:",
            selectedEmployee?.name
          );
        } catch (incentiveError) {
          console.error("Error creating incentive:", incentiveError);
          // Don't fail the whole order creation if incentive creation fails
          setError(
            `Order created successfully, but failed to create incentive: ${
              incentiveError instanceof Error
                ? incentiveError.message
                : "Unknown error"
            }`
          );
        }
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

  // Get selected product for new item
  const selectedProduct = products.find(
    (p) => p.id === parseInt(newItem.product)
  );
  const availableVariants = selectedProduct?.has_variants
    ? selectedProduct.variants || []
    : [];

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch.trim()) return true;
    const search = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone.includes(search)
    );
  });

  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) => {
    if (!employeeSearch.trim()) return true;
    const search = employeeSearch.toLowerCase();
    return (
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      (employee.role && employee.role.toLowerCase().includes(search))
    );
  });

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!productSearch.trim()) return true;
    const search = productSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      (product.sku && product.sku.toLowerCase().includes(search))
    );
  });

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none; /* Internet Explorer 10+ */
          scrollbar-width: none; /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        .dropdown-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }
        .dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.5);
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
                            disabled={customerType === "guest"}
                            className={`w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              customerType === "guest"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                          {/* Clear button */}
                          {customerSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerSearch("");
                                setSelectedCustomerId(null);
                                setIsCustomerDropdownOpen(false);
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
                              }}
                              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
                              title="Clear search"
                            >
                              Clear
                            </button>
                          )}
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
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                            {isLoadingCustomers ? (
                              <div className="p-3 text-slate-400">
                                Loading customers...
                              </div>
                            ) : filteredCustomers.length > 0 ? (
                              filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  onClick={() => {
                                    handleCustomerSelection(customer.id);
                                    setCustomerSearch(
                                      `${customer.name} (${customer.email}) - ${customer.phone}`
                                    );
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                >
                                  <div className="text-white font-medium">
                                    {customer.name}
                                  </div>
                                  <div className="text-slate-400 text-sm">
                                    {customer.email} • {customer.phone}
                                  </div>
                                  {customer.previous_due &&
                                    customer.previous_due > 0 && (
                                      <div className="text-red-400 text-xs">
                                        Previous Due:{" "}
                                        {formatCurrency(customer.previous_due)}
                                      </div>
                                    )}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-slate-400">
                                No customers found
                              </div>
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
                                // Clear customer search input when "New Customer" is checked
                                setCustomerSearch("");
                                setSelectedCustomerId(null);
                                setIsCustomerDropdownOpen(false);
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
                      {/* Customer Validation Warning */}
                      {customerValidationError && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            <div>
                              <p className="text-amber-400 text-sm font-medium">
                                Note:
                              </p>
                              <p className="text-amber-300 text-sm">
                                {customerValidationError} You can still proceed
                                with creating this order.
                              </p>
                            </div>
                          </div>
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
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            value={orderForm.customer.email}
                            onChange={(e) =>
                              handleCustomerChange("email", e.target.value)
                            }
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                            placeholder="customer@email.com (optional)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            value={orderForm.customer.phone}
                            onChange={(e) =>
                              handleCustomerChange("phone", e.target.value)
                            }
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                            placeholder="Phone number (optional)"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Address (Optional)
                          </label>
                          <textarea
                            value={orderForm.customer.address}
                            onChange={(e) =>
                              handleCustomerChange("address", e.target.value)
                            }
                            rows={2}
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                            placeholder="Customer address (optional)"
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
                                  const product = products.find(
                                    (p) => p.id === item.product
                                  );
                                  return product?.has_variants &&
                                    product.variants &&
                                    product.variants.length > 0 ? (
                                    <div className="mt-2">
                                      <select
                                        value={item.variant || ""}
                                        onChange={(e) => {
                                          const variantId = e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined;
                                          const selectedVariant =
                                            product.variants?.find(
                                              (v) => v.id === variantId
                                            );
                                          const newUnitPrice = selectedVariant
                                            ? selectedVariant.sell_price || 0
                                            : product.sell_price || 0;
                                          const newBuyPrice = selectedVariant
                                            ? selectedVariant.buy_price || 0
                                            : product.buy_price || 0;

                                          setOrderForm((prev) => ({
                                            ...prev,
                                            items: prev.items.map((orderItem) =>
                                              orderItem.id === item.id
                                                ? {
                                                    ...orderItem,
                                                    variant: variantId,
                                                    unit_price: newUnitPrice,
                                                    buy_price: newBuyPrice,
                                                    total:
                                                      orderItem.quantity *
                                                      newUnitPrice,
                                                    variant_details:
                                                      selectedVariant
                                                        ? `${
                                                            selectedVariant.color
                                                          } - ${
                                                            selectedVariant.size
                                                          }${
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
                                        <option
                                          value=""
                                          className="bg-slate-800"
                                        >
                                          Select variant
                                        </option>
                                        {product.variants.map((variant) => (
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
                                  ) : null;
                                })()}
                              </div>

                              {/* Quantity */}
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity - 1
                                    )
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
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-6 h-6 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-xs"
                                >
                                  +
                                </button>
                              </div>

                              {/* Unit Price */}
                              <div className="text-center">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => {
                                    const newPrice =
                                      parseFloat(e.target.value) || 0;
                                    updateItemUnitPrice(item.id, newPrice);
                                  }}
                                  className="w-20 bg-slate-800/50 border border-slate-700/50 text-white text-sm text-center rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="0"
                                  step="0.01"
                                />
                              </div>

                              {/* Total Price & Actions */}
                              <div className="flex items-center justify-end gap-3">
                                <div className="font-semibold text-slate-100 text-sm">
                                  {formatCurrency(item.total)}
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors"
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
                      <div className="flex-1 md:flex-[2] relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products by name or code..."
                            value={productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              setIsProductDropdownOpen(true);
                              // Clear selected product when searching
                              if (newItem.product) {
                                handleNewItemChange("product", "");
                              }
                            }}
                            onFocus={() => setIsProductDropdownOpen(true)}
                            disabled={isLoadingProducts}
                            className={`w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              isLoadingProducts
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                          {/* Clear button */}
                          {productSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductSearch("");
                                handleNewItemChange("product", "");
                                handleNewItemChange("variant", "");
                                setIsProductDropdownOpen(false);
                              }}
                              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
                              title="Clear search"
                            >
                              Clear
                            </button>
                          )}
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
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>

                        {/* Product Dropdown Options */}
                        {isProductDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                               style={{
                                 bottom: 'auto',
                                 top: '100%'
                               }}>
                            {isLoadingProducts ? (
                              <div className="p-3 text-slate-400">
                                Loading products...
                              </div>
                            ) : filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    handleNewItemChange("product", product.id.toString());
                                    setProductSearch(
                                      `${product.name}${product.sku ? ` (${product.sku})` : ''}`
                                    );
                                    setIsProductDropdownOpen(false);
                                  }}
                                  className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                >
                                  <div className="text-white font-medium">
                                    {product.name}
                                  </div>
                                  <div className="text-slate-400 text-sm flex items-center gap-2">
                                    {product.sku && (
                                      <span>SKU: {product.sku}</span>
                                    )}
                                    <span className="text-green-400">
                                      ${product.sell_price || 0}
                                    </span>
                                  </div>
                                  {product.has_variants && (
                                    <div className="text-xs text-blue-400 mt-1">
                                      Has variants available
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-slate-400">
                                No products found
                              </div>
                            )}
                          </div>
                        )}

                        {/* Click outside to close dropdown */}
                        {isProductDropdownOpen && (
                          <div
                            className="fixed inset-0 z-5"
                            onClick={() => setIsProductDropdownOpen(false)}
                          />
                        )}
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
                          value={
                            orderForm.discount_percentage === 0
                              ? ""
                              : orderForm.discount_percentage
                          }
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
                          value={
                            orderForm.vat_percentage === 0
                              ? ""
                              : orderForm.vat_percentage
                          }
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
                          value={
                            orderForm.due_amount === 0
                              ? ""
                              : orderForm.due_amount
                          }
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
                            {orderForm.apply_previous_due_to_total ? "+" : ""}
                            {formatCurrency(orderForm.previous_due)}
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
                          <label
                            htmlFor="apply-previous-due-to-total"
                            className="text-xs text-slate-400 cursor-pointer"
                          >
                            Apply previous due to total
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                      <span className="text-slate-100 font-semibold">
                        Total:
                      </span>
                      <span className="text-cyan-400 font-semibold text-lg">
                        {formatCurrency(orderForm.total)}
                      </span>
                    </div>

                    {/* Payment Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-700/30 mt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-slate-300">
                          Payment Information
                        </h4>
                        <button
                          type="button"
                          onClick={addPayment}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 rounded hover:bg-slate-800/30"
                        >
                          + Add Payment
                        </button>
                      </div>

                      {/* Payment Entries */}
                      {orderForm.payments.length > 0 && (
                        <div className="space-y-2">
                          {orderForm.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg"
                            >
                              <select
                                value={payment.method}
                                onChange={(e) =>
                                  updatePayment(
                                    payment.id,
                                    "method",
                                    e.target.value as PaymentEntry["method"]
                                  )
                                }
                                className="bg-slate-800/50 border border-slate-700/50 text-white text-xs rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                              >
                                <option value="Cash" className="bg-slate-800">
                                  Cash
                                </option>
                                <option value="Cheque" className="bg-slate-800">
                                  Cheque
                                </option>
                                <option value="Bkash" className="bg-slate-800">
                                  Bkash
                                </option>
                                <option value="Nagad" className="bg-slate-800">
                                  Nagad
                                </option>
                                <option value="Bank" className="bg-slate-800">
                                  Bank
                                </option>
                              </select>

                              <input
                                type="number"
                                value={
                                  payment.amount === 0 ? "" : payment.amount
                                }
                                onChange={(e) =>
                                  updatePayment(
                                    payment.id,
                                    "amount",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />

                              {orderForm.payments.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePayment(payment.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20"
                                  title="Remove payment"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment Summary */}
                      {orderForm.payments.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-700/30">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">
                              Total Paid:
                            </span>
                            <span className="text-slate-100 font-medium">
                              {formatCurrency(orderForm.total_payment_received)}
                            </span>
                          </div>

                          {orderForm.remaining_balance !== 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300 font-medium">
                                Remaining Balance:
                              </span>
                              <span
                                className={`font-semibold ${
                                  orderForm.remaining_balance > 0
                                    ? "text-red-400"
                                    : orderForm.remaining_balance < 0
                                    ? "text-orange-400"
                                    : "text-green-400"
                                }`}
                              >
                                {formatCurrency(orderForm.remaining_balance)}
                              </span>
                            </div>
                          )}

                          {orderForm.remaining_balance < 0 && (
                            <div className="text-xs text-orange-400 mt-1">
                              * Overpayment of{" "}
                              {formatCurrency(
                                Math.abs(orderForm.remaining_balance)
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty state */}
                      {orderForm.payments.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-sm">
                          No payments added yet
                          <br />
                          <span className="text-xs">
                            Click &quot;Add Payment&quot; to record payments
                          </span>
                        </div>
                      )}
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
                        onClick={() =>
                          setIsSalesIncentiveOpen(!isSalesIncentiveOpen)
                        }
                        className="w-full flex items-center justify-between text-sm font-medium text-orange-400 mb-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
                      >
                        <span>Sales Incentive (Internal)</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isSalesIncentiveOpen ? "rotate-180" : ""
                          }`}
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
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                              />
                              {/* Clear button */}
                              {employeeSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEmployeeSearch("");
                                    setOrderForm((prev) => ({
                                      ...prev,
                                      employee_id: undefined,
                                    }));
                                    setIsEmployeeDropdownOpen(false);
                                  }}
                                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-slate-700/50"
                                  title="Clear search"
                                >
                                  Clear
                                </button>
                              )}
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
                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                                  {isLoadingEmployees ? (
                                    <div className="p-3 text-slate-400">
                                      Loading employees...
                                    </div>
                                  ) : filteredEmployees.length > 0 ? (
                                    <>
                                      <div
                                        onClick={() => {
                                          setOrderForm((prev) => ({
                                            ...prev,
                                            employee_id: undefined,
                                          }));
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
                                            setOrderForm((prev) => ({
                                              ...prev,
                                              employee_id: employee.id,
                                            }));
                                            setEmployeeSearch(
                                              `${employee.name} - ${
                                                employee.role ||
                                                employee.department
                                              }`
                                            );
                                            setIsEmployeeDropdownOpen(false);
                                          }}
                                          className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                        >
                                          <div className="text-white font-medium">
                                            {employee.name}
                                          </div>
                                          <div className="text-slate-400 text-sm">
                                            {employee.role ||
                                              employee.department}{" "}
                                            • {employee.email}
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="p-3 text-slate-400">
                                      No employees found
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Click outside to close dropdown */}
                              {isEmployeeDropdownOpen && (
                                <div
                                  className="fixed inset-0 z-5"
                                  onClick={() =>
                                    setIsEmployeeDropdownOpen(false)
                                  }
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
                              value={
                                orderForm.incentive_amount === 0
                                  ? ""
                                  : orderForm.incentive_amount
                              }
                              onChange={(e) =>
                                setOrderForm((prev) => ({
                                  ...prev,
                                  incentive_amount:
                                    parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                            {/* Incentive creation note */}
                            {orderForm.employee_id &&
                              orderForm.incentive_amount > 0 && (
                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-green-400 flex-shrink-0"
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
                                    <p className="text-green-400 text-xs">
                                      Incentive of{" "}
                                      {formatCurrency(
                                        orderForm.incentive_amount
                                      )}{" "}
                                      will be created for the selected employee
                                      when order is submitted.
                                    </p>
                                  </div>
                                </div>
                              )}
                            {/* Warning when employee is selected but no incentive amount */}
                            {orderForm.employee_id &&
                              orderForm.incentive_amount === 0 && (
                                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-amber-400 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                                      />
                                    </svg>
                                    <p className="text-amber-400 text-xs">
                                      Employee selected but no incentive amount
                                      set. Enter an amount above to create an
                                      incentive.
                                    </p>
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Net Profit Display */}
                          {orderForm.total > 0 && (
                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">
                                  Total Buy Price:
                                </span>
                                <span className="text-sm text-red-400">
                                  {formatCurrency(orderForm.total_buy_price)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">
                                  Total Sell Price:
                                </span>
                                <span className="text-sm text-blue-400">
                                  {formatCurrency(orderForm.total_sell_price)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-700/30">
                                <span className="text-sm text-slate-400">
                                  Gross Profit:
                                </span>
                                <span className="text-sm text-green-400">
                                  {formatCurrency(orderForm.gross_profit)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">
                                  Incentive:
                                </span>
                                <span className="text-sm text-orange-400">
                                  -{formatCurrency(orderForm.incentive_amount)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                                <span className="text-sm font-medium text-slate-300">
                                  {orderForm.net_profit < 0
                                    ? "Net Loss:"
                                    : "Net Profit:"}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    orderForm.net_profit < 0
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {orderForm.net_profit < 0
                                    ? formatCurrency(
                                        Math.abs(orderForm.net_profit)
                                      )
                                    : formatCurrency(orderForm.net_profit)}
                                </span>
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
