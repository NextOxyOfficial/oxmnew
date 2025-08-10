"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Product } from "@/types/product";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Customer interface
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  previous_due?: number;
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
  apply_due_to_total: boolean;
  previous_due: number;
  apply_previous_due_to_total: boolean;
  total: number;
  due_date: string;
  notes: string;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded";
  payments: PaymentEntry[];
  total_payment_received: number;
  remaining_balance: number;
  employee_id?: number;
  incentive_amount: number;
  net_profit: number;
  total_buy_price: number;
  total_sell_price: number;
  gross_profit: number;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const formatCurrency = useCurrencyFormatter();

  // State variables
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
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
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Refs
  const isActivelyTypingRef = useRef(false);

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
    apply_due_to_total: true,
    previous_due: 0,
    apply_previous_due_to_total: true,
    total: 0,
    due_date: "",
    notes: "",
    status: "pending",
    payments: [],
    total_payment_received: 0,
    remaining_balance: 0,
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

  // Fetch order data and initialize form
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const orderId = params.id as string;
        if (!orderId) {
          setError("Order ID is required");
          setIsLoadingOrder(false);
          return;
        }

        const fetchedOrder = await ApiService.getOrder(parseInt(orderId));

        // Initialize form data from existing order
        setOrderForm({
          customer: {
            name: fetchedOrder.customer_name || "",
            email: fetchedOrder.customer_email || "",
            phone: fetchedOrder.customer_phone || "",
            address: fetchedOrder.customer_address || "",
            company: fetchedOrder.customer_company || "",
          },
          items:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fetchedOrder.items?.map((item: any) => ({
              id: item.id ? item.id.toString() : Date.now().toString(),
              product: item.product,
              variant: item.variant,
              quantity: item.quantity,
              unit_price: item.unit_price,
              buy_price: item.buy_price,
              total: item.total_price || item.unit_price * item.quantity,
              product_name: item.product_name,
              variant_details: item.variant_details,
            })) || [],
          subtotal: fetchedOrder.subtotal || 0,
          discount_percentage: fetchedOrder.discount_percentage || 0,
          discount_amount: fetchedOrder.discount_amount || 0,
          vat_percentage: fetchedOrder.vat_percentage || 0,
          vat_amount: fetchedOrder.vat_amount || 0,
          due_amount: fetchedOrder.due_amount || 0,
          apply_due_to_total: true,
          previous_due: fetchedOrder.previous_due || 0,
          apply_previous_due_to_total:
            fetchedOrder.apply_previous_due_to_total || false,
          total: fetchedOrder.total_amount || 0,
          due_date: fetchedOrder.due_date || "",
          notes: fetchedOrder.notes || "",
          status: fetchedOrder.status || "pending",
          payments:
            fetchedOrder.payments?.map((payment: PaymentEntry) => ({
              id: payment.id ? payment.id.toString() : Date.now().toString(),
              method: payment.method,
              amount: payment.amount,
            })) || [],
          total_payment_received: fetchedOrder.paid_amount || 0,
          remaining_balance:
            (fetchedOrder.total_amount || 0) - (fetchedOrder.paid_amount || 0),
          employee_id: fetchedOrder.employee?.id,
          incentive_amount: fetchedOrder.incentive_amount || 0,
          net_profit: fetchedOrder.net_profit || 0,
          total_buy_price: fetchedOrder.total_buy_price || 0,
          total_sell_price: fetchedOrder.total_sell_price || 0,
          gross_profit: fetchedOrder.gross_profit || 0,
        });

        // Set customer type and selected customer
        if (fetchedOrder.customer_name) {
          setCustomerType("existing");
          setSelectedCustomerId(fetchedOrder.customer?.id || null);
          setCustomerSearch(
            `${fetchedOrder.customer_name}${
              fetchedOrder.customer_email
                ? ` (${fetchedOrder.customer_email})`
                : ""
            }${
              fetchedOrder.customer_phone
                ? ` - ${fetchedOrder.customer_phone}`
                : ""
            }`
          );
        } else {
          setCustomerType("guest");
        }

        // Set employee search if employee is assigned
        if (fetchedOrder.employee) {
          setEmployeeSearch(
            `${fetchedOrder.employee.name} - ${
              fetchedOrder.employee.role ||
              fetchedOrder.employee.department ||
              "Employee"
            }`
          );
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to load order. Please try again.");
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchProducts();
    fetchCustomers();
    fetchEmployees();

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await ApiService.getProducts();
      const productsData = Array.isArray(response)
        ? response
        : response?.results || [];
      setProducts(productsData);
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
      const response = await ApiService.getCustomers();
      const customersData = Array.isArray(response)
        ? response
        : response?.results || [];
      setCustomers(customersData);
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
      const employeesData = Array.isArray(response)
        ? response
        : response?.results || [];
      setEmployees(employeesData);
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
    const discountAmount = (subtotal * discountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * vatPercentage) / 100;
    let total = afterDiscount + vatAmount;

    if (applyDueToTotal) {
      total -= dueAmount;
    }

    if (applyPreviousDueToTotal) {
      total += previousDue;
    }

    const totalBuyPrice = items.reduce(
      (sum, item) => sum + item.buy_price * item.quantity,
      0
    );
    const totalSellPrice = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const grossProfit = totalSellPrice - totalBuyPrice;
    const netProfit = grossProfit - incentiveAmount;
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

  // Update totals when form changes
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

  // Form submission
  const handleSubmit = async (
    status:
      | "pending"
      | "processing"
      | "shipped"
      | "delivered"
      | "completed"
      | "cancelled"
      | "refunded"
  ) => {
    if (orderForm.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    if (!orderForm.customer.name) {
      setError("Please enter customer name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const orderId = params.id as string;

      const updateData = {
        customer: selectedCustomerId || undefined,
        customer_name: orderForm.customer.name,
        customer_phone: orderForm.customer.phone?.trim() || undefined,
        customer_email: orderForm.customer.email?.trim() || undefined,
        customer_address: orderForm.customer.address?.trim() || undefined,
        customer_company: orderForm.customer.company?.trim() || undefined,
        status,
        discount_percentage: orderForm.discount_percentage,
        vat_percentage: orderForm.vat_percentage,
        due_amount: orderForm.due_amount,
        previous_due: orderForm.previous_due,
        apply_previous_due_to_total: orderForm.apply_previous_due_to_total,
        due_date: orderForm.due_date || undefined,
        notes: orderForm.notes || undefined,
        subtotal: orderForm.subtotal,
        discount_amount: orderForm.discount_amount,
        vat_amount: orderForm.vat_amount,
        total_amount: orderForm.total,
        employee: orderForm.employee_id || undefined,
        incentive_amount: orderForm.incentive_amount,
        total_buy_price: orderForm.total_buy_price,
        total_sell_price: orderForm.total_sell_price,
        gross_profit: orderForm.gross_profit,
        net_profit: orderForm.net_profit,
      };

      await ApiService.updateOrder(parseInt(orderId), updateData);
      router.push("/dashboard/orders?updated=true");
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/orders");
  };

  // Search products from backend
  const searchProducts = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 1) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearchingProducts(true);
        const response = await ApiService.searchProducts(query.trim());
        const results = Array.isArray(response)
          ? response
          : response?.results || [];

        if (results.length === 0) {
          const localResults = products.filter((product) => {
            const search = query.toLowerCase().trim();
            const safeIncludes = (field: string | null | undefined) => {
              return field && field.toString().toLowerCase().includes(search);
            };
            return (
              safeIncludes(product.name) ||
              safeIncludes(product.product_code) ||
              safeIncludes(product.category_name) ||
              safeIncludes(product.supplier_name) ||
              safeIncludes(product.details)
            );
          });
          setSearchResults(localResults);
        } else {
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Error searching products:", error);
        const localResults = products.filter((product) => {
          const search = query.toLowerCase().trim();
          const safeIncludes = (field: string | null | undefined) => {
            return field && field.toString().toLowerCase().includes(search);
          };
          return (
            safeIncludes(product.name) ||
            safeIncludes(product.product_code) ||
            safeIncludes(product.category_name) ||
            safeIncludes(product.supplier_name) ||
            safeIncludes(product.details)
          );
        });
        setSearchResults(localResults);
      } finally {
        setIsSearchingProducts(false);
      }
    },
    [products]
  );

  // Product search and selection handlers
  const handleProductSearch = useCallback(
    (query: string) => {
      setProductSearch(query);
      isActivelyTypingRef.current = true;

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        isActivelyTypingRef.current = false;
        searchProducts(query);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchProducts, searchTimeout]
  );

  const handleNewItemChange = useCallback(
    (field: string, value: string | number) => {
      setNewItem((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "product") {
          updated.variant = "";
        }
        return updated;
      });
    },
    []
  );

  // Get the selected product and its variants
  const selectedProduct = products.find(
    (product) => product.id === parseInt(newItem.product)
  );

  const availableVariants = selectedProduct?.variants || [];

  // Add item to order
  const addItemToOrder = async () => {
    if (!selectedProduct) return;

    let unitPrice = 0;
    let buyPrice = 0;
    let variantDetails = "";

    if (selectedProduct.has_variants && newItem.variant) {
      const variant = availableVariants.find(
        (v) => v.id === parseInt(newItem.variant)
      );
      if (variant) {
        unitPrice = variant.sell_price || 0;
        buyPrice = variant.buy_price || 0;
        variantDetails = `${variant.size || ""} ${variant.color || ""}`.trim();
      }
    } else {
      unitPrice = selectedProduct.sell_price || 0;
      buyPrice = selectedProduct.buy_price || 0;
    }

    try {
      const orderId = params.id as string;

      // Add item via API
      const itemData = {
        product: selectedProduct.id,
        variant: newItem.variant ? parseInt(newItem.variant) : undefined,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price || unitPrice,
        buy_price: buyPrice,
      };

      await ApiService.addOrderItem(parseInt(orderId), itemData);

      // Add to local state
      const newOrderItem: OrderItem = {
        id: Date.now().toString(),
        product: selectedProduct.id,
        variant: newItem.variant ? parseInt(newItem.variant) : undefined,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price || unitPrice,
        buy_price: buyPrice,
        total: (newItem.unit_price || unitPrice) * newItem.quantity,
        product_name: selectedProduct.name,
        variant_details: variantDetails,
      };

      setOrderForm((prev) => ({
        ...prev,
        items: [...prev.items, newOrderItem],
      }));

      // Reset new item form
      setNewItem({
        product: "",
        variant: "",
        quantity: 1,
        unit_price: 0,
      });

      setProductSearch("");
      setSearchResults([]);
      setIsProductDropdownOpen(false);
      setError(null);
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item. Please try again.");
    }
  };

  // Remove item from order
  const removeItem = async (itemId: string) => {
    try {
      const orderId = params.id as string;

      // Remove from API
      await ApiService.removeOrderItem(parseInt(orderId), parseInt(itemId));

      // Remove from local state
      setOrderForm((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    } catch (error) {
      console.error("Error removing item:", error);
      setError("Failed to remove item. Please try again.");
    }
  };

  // Update item quantity
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    try {
      const orderId = params.id as string;

      // Update via API
      await ApiService.updateOrderItem(parseInt(orderId), parseInt(itemId), {
        quantity: quantity,
      });

      // Update local state
      setOrderForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, total: quantity * item.unit_price }
            : item
        ),
      }));
    } catch (error) {
      console.error("Error updating item quantity:", error);
      setError("Failed to update item quantity. Please try again.");
    }
  };

  // Update item unit price
  const updateItemUnitPrice = async (itemId: string, unitPrice: number) => {
    if (unitPrice < 0) return;

    try {
      const orderId = params.id as string;

      // Update via API
      await ApiService.updateOrderItem(parseInt(orderId), parseInt(itemId), {
        unit_price: unitPrice,
      });

      // Update local state
      setOrderForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                unit_price: unitPrice,
                total: item.quantity * unitPrice,
              }
            : item
        ),
      }));
    } catch (error) {
      console.error("Error updating item price:", error);
      setError("Failed to update item price. Please try again.");
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3 text-slate-300">
              <svg
                className="w-6 h-6 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading order...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl  px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">
                Edit Order
              </h1>
              <p className="text-slate-400 mt-1">
                Modify order details and manage items
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
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
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Customer Information
                </h3>

                {/* Customer Type Selection */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="existing-customer"
                      name="customerType"
                      checked={customerType === "existing"}
                      onChange={() => setCustomerType("existing")}
                      className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2"
                    />
                    <label
                      htmlFor="existing-customer"
                      className="text-slate-300"
                    >
                      Existing Customer
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="guest-customer"
                      name="customerType"
                      checked={customerType === "guest"}
                      onChange={() => setCustomerType("guest")}
                      className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2"
                    />
                    <label htmlFor="guest-customer" className="text-slate-300">
                      Guest Customer
                    </label>
                  </div>
                </div>

                {/* Existing Customer Search */}
                {customerType === "existing" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Search Customer
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
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

                      {/* Customer Dropdown */}
                      {isCustomerDropdownOpen &&
                        customerSearch.trim().length >= 2 && (
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                            {isLoadingCustomers ? (
                              <div className="p-3 text-slate-400">
                                Loading customers...
                              </div>
                            ) : customers.filter((customer) => {
                                const search = customerSearch.toLowerCase();
                                return (
                                  customer.name
                                    .toLowerCase()
                                    .includes(search) ||
                                  customer.email
                                    ?.toLowerCase()
                                    .includes(search) ||
                                  customer.phone?.includes(search)
                                );
                              }).length > 0 ? (
                              customers
                                .filter((customer) => {
                                  const search = customerSearch.toLowerCase();
                                  return (
                                    customer.name
                                      .toLowerCase()
                                      .includes(search) ||
                                    customer.email
                                      ?.toLowerCase()
                                      .includes(search) ||
                                    customer.phone?.includes(search)
                                  );
                                })
                                .slice(0, 10)
                                .map((customer) => (
                                  <div
                                    key={customer.id}
                                    onClick={() => {
                                      setSelectedCustomerId(customer.id);
                                      setOrderForm((prev) => ({
                                        ...prev,
                                        customer: {
                                          name: customer.name,
                                          email: customer.email || "",
                                          phone: customer.phone || "",
                                          address: customer.address || "",
                                          company: "",
                                        },
                                        previous_due:
                                          customer.previous_due || 0,
                                        apply_previous_due_to_total:
                                          (customer.previous_due || 0) > 0,
                                      }));
                                      setCustomerSearch(
                                        `${customer.name}${
                                          customer.email
                                            ? ` (${customer.email})`
                                            : ""
                                        }${
                                          customer.phone
                                            ? ` - ${customer.phone}`
                                            : ""
                                        }`
                                      );
                                      setIsCustomerDropdownOpen(false);
                                    }}
                                    className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                  >
                                    <div className="text-white font-medium">
                                      {customer.name}
                                    </div>
                                    <div className="text-slate-400 text-sm">
                                      {customer.email || "No email"} •{" "}
                                      {customer.phone || "No phone"}
                                    </div>
                                    {customer.previous_due &&
                                      customer.previous_due > 0 && (
                                        <div className="text-red-400 text-xs">
                                          Previous Due:{" "}
                                          {formatCurrency(
                                            customer.previous_due
                                          )}
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
                  </div>
                )}

                {/* Customer Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={orderForm.customer.name}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              name: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Enter customer name"
                        required
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
                          setOrderForm((prev) => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={orderForm.customer.email}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Enter email address"
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
                          setOrderForm((prev) => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              company: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Address
                    </label>
                    <textarea
                      value={orderForm.customer.address}
                      onChange={(e) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          customer: {
                            ...prev.customer,
                            address: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Enter customer address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Order Items
                </h3>

                {/* Items List */}
                <div className="space-y-3 mb-4">
                  {orderForm.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-slate-200">
                            {item.product_name}
                            {item.variant_details && (
                              <span className="text-slate-400 ml-2">
                                ({item.variant_details})
                              </span>
                            )}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                              className="w-8 h-8 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-sm"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  item.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 bg-slate-800/50 border border-slate-700/50 text-white text-center rounded py-1 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                              min="1"
                            />
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                              className="w-8 h-8 rounded bg-slate-700/50 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>

                          {/* Total */}
                          <div className="text-cyan-400 font-medium w-20 text-right">
                            {formatCurrency(item.total)}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-8 h-8 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-colors text-sm"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {orderForm.items.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p>No items in this order yet.</p>
                      <p className="text-sm mt-1">
                        Add items below to get started.
                      </p>
                    </div>
                  )}
                </div>

                {/* Add New Item */}
                <div className="border-t border-slate-700/50 pt-4">
                  <h4 className="text-md font-medium text-slate-200 mb-3">
                    Add New Item
                  </h4>

                  <div className="space-y-4">
                    {/* Product Search, Quantity, and Add Button in one line */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      {/* Product Search */}
                      <div className="md:col-span-6 relative">
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Search Product
                        </label>
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          onFocus={() => setIsProductDropdownOpen(true)}
                          placeholder="Search products..."
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        />

                        {/* Product Dropdown */}
                        {isProductDropdownOpen &&
                          (productSearch.length >= 1 ||
                            searchResults.length > 0) && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {isSearchingProducts ? (
                                <div className="p-3 text-slate-400">
                                  Loading...
                                </div>
                              ) : searchResults.length > 0 ? (
                                searchResults.slice(0, 10).map((product) => (
                                  <div
                                    key={product.id}
                                    onClick={() => {
                                      handleNewItemChange(
                                        "product",
                                        product.id.toString()
                                      );
                                      setProductSearch(
                                        `${product.name} (${
                                          product.product_code || "No Code"
                                        })`
                                      );
                                      setIsProductDropdownOpen(false);
                                    }}
                                    className="p-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                                  >
                                    <div className="text-white font-medium">
                                      {product.name}
                                    </div>
                                    <div className="text-slate-400 text-sm">
                                      {product.category_name} • Stock:{" "}
                                      {product.stock}
                                      {product.product_code &&
                                        ` • Code: ${product.product_code}`}
                                    </div>
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

                      {/* Quantity */}
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) =>
                            handleNewItemChange(
                              "quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                          min="1"
                        />
                      </div>

                      {/* Add Button */}
                      <div className="md:col-span-3">
                        <button
                          onClick={addItemToOrder}
                          disabled={!selectedProduct || newItem.quantity <= 0}
                          className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            selectedProduct && newItem.quantity > 0
                              ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                              : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Add Item
                        </button>
                      </div>
                    </div>

                    {/* Variant Selection */}
                    {selectedProduct?.has_variants && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Select Variant
                        </label>
                        <select
                          value={newItem.variant}
                          onChange={(e) =>
                            handleNewItemChange("variant", e.target.value)
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        >
                          <option value="">Select a variant</option>
                          {availableVariants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.size} {variant.color} - Stock:{" "}
                              {variant.stock}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Selected Product Preview */}
                    {selectedProduct && (
                      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-slate-200">
                              {selectedProduct.name}
                            </h5>
                            <p className="text-xs text-slate-400">
                              {selectedProduct.category_name} • Stock:{" "}
                              {selectedProduct.has_variants && newItem.variant
                                ? availableVariants.find(
                                    (v) => v.id === parseInt(newItem.variant)
                                  )?.stock || 0
                                : selectedProduct.stock}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-cyan-400">
                              {formatCurrency(
                                (newItem.unit_price ||
                                  (selectedProduct.has_variants &&
                                  newItem.variant
                                    ? availableVariants.find(
                                        (v) =>
                                          v.id === parseInt(newItem.variant)
                                      )?.sell_price || 0
                                    : selectedProduct.sell_price || 0)) *
                                  newItem.quantity
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatCurrency(
                                newItem.unit_price ||
                                  (selectedProduct.has_variants &&
                                  newItem.variant
                                    ? availableVariants.find(
                                        (v) =>
                                          v.id === parseInt(newItem.variant)
                                      )?.sell_price || 0
                                    : selectedProduct.sell_price || 0)
                              )}{" "}
                              × {newItem.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Order Notes
                </h3>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) =>
                    setOrderForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                  placeholder="Add any notes about this order..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Continue with Bill Summary */}
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
                        className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
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
                        className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
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

                  {/* Total */}
                  <div className="border-t border-slate-700/50 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-200">
                        Total:
                      </span>
                      <span className="text-lg font-bold text-cyan-400">
                        {formatCurrency(orderForm.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Incentive Section */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <button
                  onClick={() => setIsSalesIncentiveOpen(!isSalesIncentiveOpen)}
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

                        {/* Employee Dropdown */}
                        {isEmployeeDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                            {isLoadingEmployees ? (
                              <div className="p-3 text-slate-400">
                                Loading employees...
                              </div>
                            ) : employees.filter(
                                (emp) =>
                                  emp.name
                                    .toLowerCase()
                                    .includes(employeeSearch.toLowerCase()) ||
                                  emp.email
                                    ?.toLowerCase()
                                    .includes(employeeSearch.toLowerCase()) ||
                                  emp.role
                                    ?.toLowerCase()
                                    .includes(employeeSearch.toLowerCase()) ||
                                  emp.department
                                    ?.toLowerCase()
                                    .includes(employeeSearch.toLowerCase())
                              ).length > 0 ? (
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
                                {employees
                                  .filter(
                                    (emp) =>
                                      emp.name
                                        .toLowerCase()
                                        .includes(
                                          employeeSearch.toLowerCase()
                                        ) ||
                                      emp.email
                                        ?.toLowerCase()
                                        .includes(
                                          employeeSearch.toLowerCase()
                                        ) ||
                                      emp.role
                                        ?.toLowerCase()
                                        .includes(
                                          employeeSearch.toLowerCase()
                                        ) ||
                                      emp.department
                                        ?.toLowerCase()
                                        .includes(employeeSearch.toLowerCase())
                                  )
                                  .map((employee) => (
                                    <div
                                      key={employee.id}
                                      onClick={() => {
                                        setOrderForm((prev) => ({
                                          ...prev,
                                          employee_id: employee.id,
                                        }));
                                        setEmployeeSearch(
                                          `${employee.name} - ${
                                            employee.role || employee.department
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
                                        {employee.role || employee.department} •{" "}
                                        {employee.email}
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
                        value={
                          orderForm.incentive_amount === 0
                            ? ""
                            : orderForm.incentive_amount
                        }
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            incentive_amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />

                      {/* Incentive note */}
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
                              <div>
                                <p className="text-green-400 text-sm font-medium">
                                  Incentive will be recorded
                                </p>
                                <p className="text-green-300 text-xs">
                                  {formatCurrency(orderForm.incentive_amount)}{" "}
                                  incentive will be given to the selected
                                  employee when the order is saved.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Order Status
                </h3>
                <select
                  value={orderForm.status}
                  onChange={(e) =>
                    setOrderForm((prev) => ({
                      ...prev,
                      status: e.target.value as
                        | "pending"
                        | "processing"
                        | "shipped"
                        | "delivered"
                        | "completed"
                        | "cancelled"
                        | "refunded",
                    }))
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Order Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("pending")}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Updating..." : "Update Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
