"use client";

import ProductDropdown from "@/components/ProductDropdown";
import ProductSearchInput, { ProductSearchInputRef } from "@/components/ProductSearchInput";
import { useCurrencyFormatter, useCurrency } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Product } from "@/types/product";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, ReactNode } from "react";

import CustomerSelector from "@/components/orders/edit/CustomerSelector";
import OrderItemsTable from "@/components/orders/edit/OrderItemsTable";
import BillSummary from "@/components/orders/edit/BillSummary";
import PaymentsSection from "@/components/orders/edit/PaymentsSection";
import SalesIncentive from "@/components/orders/edit/SalesIncentive";
import type { OrderForm as OrderFormT, OrderItem as OrderItemT, PaymentEntry as PaymentEntryT, CustomerInfo } from "@/components/orders/types";

// Customer and Employee interfaces for lists
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

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const { currencySymbol } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerType, setCustomerType] = useState<"existing" | "guest">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSalesIncentiveOpen, setIsSalesIncentiveOpen] = useState(false);

  const [customerValidationError, setCustomerValidationError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [duplicateField, setDuplicateField] = useState<"email" | "phone" | null>(null);

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const productSearchInputRef = useRef<ProductSearchInputRef>(null);
  const isActivelyTypingRef = useRef(false);

  const [orderForm, setOrderForm] = useState<OrderFormT>({
    customer: { name: "", email: "", phone: "", address: "", company: "" },
    items: [],
    subtotal: 0,
    discount_type: "percentage",
    discount_percentage: 0,
    discount_flat_amount: 0,
    discount_amount: 0,
    vat_percentage: 0,
    vat_amount: 0,
    due_amount: 0,
    previous_due: 0,
    apply_previous_due_to_total: true,
    total: 0,
    due_date: "",
    notes: "",
    status: "draft",
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

  const [newItem, setNewItem] = useState({ product: "", variant: "", quantity: 1, unit_price: 0 });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingOrder(true);
        const orderId = params?.id;
        if (!orderId) { setError("অর্ডার আইডি দরকার"); setIsLoadingOrder(false); return; }
        const fetchedOrder = await ApiService.getOrder(parseInt(orderId as string));
        setOrderForm({
          customer: { name: fetchedOrder.customer_name || "", email: fetchedOrder.customer_email || "", phone: fetchedOrder.customer_phone || "", address: fetchedOrder.customer_address || "", company: fetchedOrder.customer_company || "" },
          items: (fetchedOrder.items || []).map((item: any) => ({ id: item.id ? String(item.id) : `${Date.now()}`, product: item.product, variant: item.variant, quantity: Number(item.quantity) || 0, unit_price: Number(item.unit_price) || 0, buy_price: Number(item.buy_price) || 0, total: Number(item.total_price) || (Number(item.unit_price) || 0) * (Number(item.quantity) || 0), product_name: item.product_name, variant_details: item.variant_details })),
          subtotal: Number(fetchedOrder.subtotal) || 0,
          discount_type: fetchedOrder.discount_type || "percentage",
          discount_percentage: Number(fetchedOrder.discount_percentage) || 0,
          discount_flat_amount: Number(fetchedOrder.discount_flat_amount) || 0,
          discount_amount: Number(fetchedOrder.discount_amount) || 0,
          vat_percentage: Number(fetchedOrder.vat_percentage) || 0,
          vat_amount: Number(fetchedOrder.vat_amount) || 0,
          due_amount: Number(fetchedOrder.due_amount) || 0,
          previous_due: Number(fetchedOrder.previous_due) || 0,
          apply_previous_due_to_total: Boolean(fetchedOrder.apply_previous_due_to_total ?? true),
          total: Number(fetchedOrder.total_amount) || 0,
          due_date: fetchedOrder.due_date || "",
          notes: fetchedOrder.notes || "",
          status: fetchedOrder.status || "pending",
          payments: (fetchedOrder.payments || []).map((p: any) => ({ id: p.id ? String(p.id) : `${Date.now()}`, method: p.method, amount: Number(p.amount) || 0 })),
          total_payment_received: Number(fetchedOrder.paid_amount) || 0,
          remaining_balance: Number(fetchedOrder.total_amount || 0) - Number(fetchedOrder.paid_amount || 0),
          employee_id: fetchedOrder.employee?.id,
          incentive_amount: Number(fetchedOrder.incentive_amount) || 0,
          net_profit: Number(fetchedOrder.net_profit) || 0,
          total_buy_price: Number(fetchedOrder.total_buy_price) || 0,
          total_sell_price: Number(fetchedOrder.total_sell_price) || 0,
          gross_profit: Number(fetchedOrder.gross_profit) || 0,
        });
        if (fetchedOrder.customer_name) {
          setCustomerType("existing");
          setSelectedCustomerId(fetchedOrder.customer?.id || null);
          setCustomerSearch(`${fetchedOrder.customer_name}${fetchedOrder.customer_email ? ` (${fetchedOrder.customer_email})` : ""}${fetchedOrder.customer_phone ? ` - ${fetchedOrder.customer_phone}` : ""}`);
        } else { setCustomerType("guest"); }
        if (fetchedOrder.employee) { setEmployeeSearch(`${fetchedOrder.employee.name} - ${fetchedOrder.employee.role || fetchedOrder.employee.department || "Employee"}`); }
      } catch (e) { console.error("Error fetching order:", e); setError("অর্ডার লোড করা যায়নি। আবার চেষ্টা করুন।"); }
      finally { setIsLoadingOrder(false); }
    };
    const init = async () => { fetchProducts(); fetchCustomers(); fetchEmployees(); if (params?.id) fetchOrder(); };
    init();
  }, [params?.id]);

  const fetchProducts = async () => { try { setIsLoadingProducts(true); const response = await ApiService.getProducts(); const productsData = Array.isArray(response) ? response : response?.results || []; setProducts(productsData); } catch (error) { console.error("Error fetching products:", error); setError("প্রোডাক্ট লোড করা যায়নি"); } finally { setIsLoadingProducts(false); } };
  const fetchCustomers = async () => { try { setIsLoadingCustomers(true); const response = await ApiService.getCustomers({ page_size: 500 }); const customersData = Array.isArray(response) ? response : response?.results || []; setCustomers(customersData); } catch (error) { console.error("Error fetching customers:", error); setError("কাস্টমার লোড করা যায়নি"); } finally { setIsLoadingCustomers(false); } };
  const fetchEmployees = async () => { try { setIsLoadingEmployees(true); const response = await ApiService.getEmployees(); const employeesData = Array.isArray(response) ? response : response?.results || []; setEmployees(employeesData); } catch (error) { console.error("Error fetching employees:", error); setError("কর্মচারী লোড করা যায়নি"); } finally { setIsLoadingEmployees(false); } };

  const calculateTotals = (
    items: OrderItemT[],
    discountType: "percentage" | "flat",
    discountPercentage: number,
    discountFlatAmount: number,
    vatPercentage: number,
    previousDue: number,
    applyPreviousDueToTotal: boolean,
    incentiveAmount: number,
    payments: PaymentEntryT[]
  ) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const totalBuyPrice = items.reduce((sum, item) => sum + (Number(item.buy_price) || 0) * (Number(item.quantity) || 0), 0);
    const totalSellPrice = subtotal;
    const discountAmount = discountType === "percentage" ? (subtotal * discountPercentage) / 100 : discountFlatAmount;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * vatPercentage) / 100;
    const total = afterDiscount + vatAmount + (applyPreviousDueToTotal ? previousDue : 0);
    const grossProfit = totalSellPrice - totalBuyPrice;
    const netProfit = grossProfit - incentiveAmount;
    const totalPaymentReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = total - totalPaymentReceived;
    return { subtotal, discountAmount, vatAmount, total, netProfit, totalBuyPrice, totalSellPrice, grossProfit, totalPaymentReceived, remainingBalance };
  };

  useEffect(() => {
    const { subtotal, discountAmount, vatAmount, total, netProfit, totalBuyPrice, totalSellPrice, grossProfit, totalPaymentReceived, remainingBalance } = calculateTotals(
      orderForm.items,
      orderForm.discount_type,
      orderForm.discount_percentage,
      orderForm.discount_flat_amount,
      orderForm.vat_percentage,
      orderForm.previous_due,
      orderForm.apply_previous_due_to_total,
      orderForm.incentive_amount,
      orderForm.payments
    );
    setOrderForm((prev) => ({ ...prev, subtotal, discount_amount: discountAmount, vat_amount: vatAmount, total, net_profit: netProfit, total_buy_price: totalBuyPrice, total_sell_price: totalSellPrice, gross_profit: grossProfit, total_payment_received: totalPaymentReceived, remaining_balance: remainingBalance }));
  }, [orderForm.items, orderForm.discount_type, orderForm.discount_percentage, orderForm.discount_flat_amount, orderForm.vat_percentage, orderForm.previous_due, orderForm.apply_previous_due_to_total, orderForm.incentive_amount, orderForm.payments]);

  const handleSubmit = async (
    status:
      | "draft"
      | "pending"
      | "confirmed"
      | "processing"
      | "completed"
      | "cancelled"
      | "refunded"
  ) => {
    if (orderForm.items.length === 0) { setError("অর্ডারে অন্তত একটা প্রোডাক্ট যোগ করুন"); return; }
    if (!orderForm.customer.name) { setError("কাস্টমারের নাম লিখুন"); return; }
    try {
      setIsSubmitting(true); setError(null);
      const orderId = params.id as string;
      const round = (v: number | null | undefined) => Math.round((typeof v === 'number' ? v : 0) * 100) / 100;
      const currentOrder = await ApiService.getOrder(parseInt(orderId));
      const existingItems = currentOrder.items || [];

      // Completed orders are locked for add/remove item APIs.
      // Temporarily switch them to draft first, then apply final status at the end.
      if (currentOrder.status === "completed") {
        await ApiService.updateOrder(parseInt(orderId), { status: "draft" } as any);
      }

      for (const existingItem of existingItems) { try { await ApiService.removeOrderItem(parseInt(orderId), existingItem.id); } catch {} }
      for (const item of orderForm.items) { const itemData: any = { product: item.product, quantity: item.quantity, unit_price: item.unit_price, buy_price: item.buy_price, variant: item.variant ?? null }; await ApiService.addOrderItem(parseInt(orderId), itemData); }
      const orderUpdateData = { 
        customer: selectedCustomerId || undefined, 
        customer_name: orderForm.customer.name, 
        customer_phone: orderForm.customer.phone?.trim() || undefined, 
        customer_email: orderForm.customer.email?.trim() || undefined, 
        customer_address: orderForm.customer.address?.trim() || undefined, 
        customer_company: orderForm.customer.company?.trim() || undefined, 
        status, 
        discount_type: orderForm.discount_type, 
        discount_percentage: round(orderForm.discount_percentage || 0), 
        discount_flat_amount: round(orderForm.discount_flat_amount || 0), 
        vat_percentage: round(orderForm.vat_percentage || 0), 
        due_amount: round(orderForm.due_amount || 0),
        notes: orderForm.notes || undefined, 
        due_date: orderForm.due_date || undefined, 
        subtotal: round(orderForm.subtotal || 0), 
        discount_amount: round(orderForm.discount_amount || 0), 
        vat_amount: round(orderForm.vat_amount || 0), 
        total_amount: round(orderForm.total || 0),
        employee: orderForm.employee_id || undefined,
        incentive_amount: round(orderForm.incentive_amount || 0)
      };
      
      await ApiService.updateOrder(parseInt(orderId), orderUpdateData);
      router.push("/dashboard/orders?updated=true");
    } catch (error) {
      let msg = "অর্ডার আপডেট করা যায়নি। আবার চেষ্টা করুন।";
      if (error && typeof error === 'object') { if ('response' in error && (error as any).response?.data) { const data = (error as any).response.data; msg = typeof data === 'string' ? data : data.error || data.detail || JSON.stringify(data); } else if ('message' in error) { msg = (error as any).message; } }
      setError(msg);
    } finally { setIsSubmitting(false); }
  };

  const handleCancel = () => router.push("/dashboard/orders");

  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.trim().length < 1) { setSearchResults([]); return; }
    try {
      setIsSearchingProducts(true);
      const response = await ApiService.searchProducts(query.trim());
      const results = Array.isArray(response) ? response : response?.results || [];
      setSearchResults(results);
    } catch (e) {
      // Fallback to local filter if API fails
      const local = products.filter((p) => { const s = query.toLowerCase().trim(); const name = p.name ? p.name.toLowerCase() : ''; const code = p.product_code ? p.product_code.toLowerCase() : ''; return name.includes(s) || code.includes(s); });
      setSearchResults(local);
    } finally { setIsSearchingProducts(false); }
  }, [products]);

  const handleProductSearch = useCallback((query: string) => {
    setProductSearch(query);
    isActivelyTypingRef.current = true;
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => { isActivelyTypingRef.current = false; searchProducts(query); }, 250);
    setSearchTimeout(timeout);
  }, [searchProducts, searchTimeout]);

  const handleNewItemChange = useCallback((field: string, value: string | number) => { setNewItem((prev) => { const updated: any = { ...prev, [field]: value }; if (field === "product") updated.variant = ""; return updated; }); }, []);

  // Get the selected product and its variants
  const selectedProduct = products.find((p) => p.id === parseInt(newItem.product));
  const availableVariants = selectedProduct?.variants || [];

  // Add item to order (local state only, not saved to database until Update Order is clicked)
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

  // Create new item for local state only
  const newOrderItem: OrderItemT = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique temporary ID
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
  };

  // Remove item from order (local state only)
  const removeItem = async (itemId: string) => {
    // Remove from local state only
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Update item quantity (local state only)
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    // Update local state only
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { 
              ...item, 
              quantity: Number(quantity), 
              total: Number(quantity) * Number(item.unit_price) 
            }
          : item
      ),
    }));
  };

  // Update item unit price (local state only)
  const updateItemUnitPrice = async (itemId: string, unitPrice: number) => {
    if (unitPrice < 0) return;

    // Update local state only
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              unit_price: Number(unitPrice),
              total: Number(item.quantity) * Number(unitPrice),
            }
          : item
      ),
    }));
  };

  // Cleanup effect for search timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Simplified focus management - only restore focus when necessary
  useEffect(() => {
    // Only restore focus if the dropdown just opened and input should have focus
    if (isProductDropdownOpen && productSearch.trim().length >= 1 && !isSearchingProducts) {
      // Use a minimal delay to ensure smooth typing experience
      const timer = setTimeout(() => {
        if (productSearchInputRef.current && !isActivelyTypingRef.current) {
          productSearchInputRef.current.focus();
        }
      }, 50); // Minimal delay

      return () => clearTimeout(timer);
    }
  }, [isProductDropdownOpen, productSearch]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        // Search if query has content (removed the actively typing check to make it more responsive)
        if (query.trim().length >= 1) {
          searchProducts(query.trim());
        }
      }, 250); // Reduced delay from 300ms to 250ms for better responsiveness

      setSearchTimeout(timeout);
    },
    [searchTimeout, searchProducts]
  );

  // Callbacks for the search input component
  const handleSearchChange = useCallback(
    (value: string) => {
      setProductSearch(value);
      
      // Keep user actively typing while they're entering content
      if (value.trim().length >= 1) {
        isActivelyTypingRef.current = true; // Keep this true while typing
        setIsProductDropdownOpen(true);
        // Use debounced search for backend API
        debouncedSearch(value.trim());
      } else {
        // Only reset when completely empty
        isActivelyTypingRef.current = false;
        setIsProductDropdownOpen(false);
        setSearchResults([]); // Clear search results
      }
    },
    [debouncedSearch]
  );

  const handleSearchFocus = useCallback(() => {
    // Open dropdown on focus if user has already typed at least 1 character
    if (productSearch.trim().length >= 1) {
      setIsProductDropdownOpen(true);
      // Mark as actively typing when focusing with existing content
      isActivelyTypingRef.current = true;
    }
  }, [productSearch]);

  const handleSearchClear = useCallback(() => {
    isActivelyTypingRef.current = false; // User cleared, no longer actively typing
    setProductSearch("");
    setSearchResults([]); // Clear search results
    setIsProductDropdownOpen(false);
    setError(null); // Clear any error messages
    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    // Keep focus on the input after clearing
    setTimeout(() => {
      if (productSearchInputRef.current) {
        productSearchInputRef.current.focus();
      }
    }, 10);
  }, [searchTimeout]);

  const handleProductSelect = useCallback(
    async (productId: string) => {
      // Temporarily stop tracking typing while processing selection
      const wasTyping = isActivelyTypingRef.current;
      isActivelyTypingRef.current = false;
      
      // Try to find the product in both arrays
      let productFromMain = products.find((p) => p.id === parseInt(productId));
      let productFromSearch = searchResults.find((p) => p.id === parseInt(productId));
      
      let productToAdd = productFromMain || productFromSearch;
      
      // If not found in either array, try to fetch it directly from the backend
      if (!productToAdd) {
        try {
          productToAdd = await ApiService.getProduct(parseInt(productId));
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      }
      
      if (!productToAdd) {
        setError("প্রোডাক্টটা পাওয়া যায়নি। আবার খুঁজে দেখুন।");
        return;
      }

      const selectedProduct = productToAdd;
      
      // If product was found in search results but not in main products array,
      // add it to the main products array for future reference
      if (!productFromMain && productFromSearch) {
        const productToStore = productFromSearch;
        setProducts((prev) => [...prev, productToStore]);
      }

      // Check stock availability - skip for products that don't require stock tracking
      let availableStock = 0;
      const requestedQuantity = 1; // Default quantity when clicking on product

      if (selectedProduct.has_variants) {
        // For products with variants, we'll use the first available variant
        const firstVariant = selectedProduct.variants?.[0];
        if (firstVariant) {
          availableStock = firstVariant.stock || 0;
        }
      } else {
        availableStock = selectedProduct.stock || 0;
      }

      // Only check stock if the product requires stock tracking
      const requiresStockTracking = !selectedProduct.no_stock_required;
      if (requiresStockTracking && availableStock <= 0) {
        setError("প্রোডাক্টটা স্টকে নেই");
        setProductSearch("");
        setIsProductDropdownOpen(false);
        return;
      }

      // Check if the same product already exists in the order
      const existingItemIndex = orderForm.items.findIndex(
        (item) => item.product === parseInt(productId) && 
        (!selectedProduct.has_variants || item.variant === selectedProduct.variants?.[0]?.id)
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity in local state only
        const existingItem = orderForm.items[existingItemIndex];
        const newQuantity = existingItem.quantity + requestedQuantity;

        // Only check stock limits if the product requires stock tracking
        if (requiresStockTracking && newQuantity > availableStock) {
          setError(`স্টকে আছে মাত্র ${availableStock}টি`);
          setProductSearch("");
          setIsProductDropdownOpen(false);
          return;
        }

        // Update local state only
        setOrderForm((prev) => ({
          ...prev,
          items: prev.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
              : item
          ),
        }));
      } else {
        // Add new item to local state only
        let unitPrice = 0;
        let buyPrice = 0;
        let selectedVariant = null;
        let variantDetails = "";

        if (selectedProduct.has_variants && selectedProduct.variants?.[0]) {
          selectedVariant = selectedProduct.variants[0];
          unitPrice = selectedVariant.sell_price || 0;
          buyPrice = selectedVariant.buy_price || 0;
          variantDetails = `${selectedVariant.color || ""} - ${selectedVariant.size || ""}${selectedVariant.custom_variant ? ` - ${selectedVariant.custom_variant}` : ""}`.trim();
        } else {
          unitPrice = selectedProduct.sell_price || 0;
          buyPrice = selectedProduct.buy_price || 0;
        }

  // Add to local state using temporary ID
  const newOrderItem: OrderItemT = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // More unique temporary ID
          product: selectedProduct.id,
          variant: selectedVariant?.id,
          quantity: requestedQuantity,
          unit_price: unitPrice,
          buy_price: buyPrice,
          total: requestedQuantity * unitPrice,
          product_name: selectedProduct.name,
          variant_details: variantDetails,
        };

        setOrderForm((prev) => ({
          ...prev,
          items: [...prev.items, newOrderItem],
        }));
      }

      // Clear search and close dropdown
      setProductSearch("");
      setIsProductDropdownOpen(false);
      setError(null);
      
      // Refocus the search input immediately and restore typing state for continued use
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus();
          // Restore the typing state so user can continue adding products
          isActivelyTypingRef.current = wasTyping;
        }
      }, 10); // Immediate focus restore
    },
    [products, searchResults, orderForm.items, params.id]
  );

  const handleDropdownClose = useCallback(() => {
    isActivelyTypingRef.current = false; // User closed dropdown, stop tracking
    setIsProductDropdownOpen(false);
  }, []);

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
      setMatchedCustomer(null);
      setDuplicateField(null);
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
          `এই ${field} আগে থেকেই "${existingCustomer.name}" নামের কাস্টমারের সাথে আছে। চাইলে তাকেই বেছে নিন।`
        );
        setMatchedCustomer(existingCustomer);
        setDuplicateField(field);
      }
    }
  };

  // Handle clicking on matched customer name in validation message
  const handleSelectMatchedCustomer = () => {
    if (matchedCustomer) {
      handleCustomerSelection(matchedCustomer.id);
      setCustomerValidationError(null);
      setMatchedCustomer(null);
      setDuplicateField(null);
      // Format the customer search display the same way as normal selection
      setCustomerSearch(
        `${matchedCustomer.name}${
          matchedCustomer.email ? ` (${matchedCustomer.email})` : ""
        }${
          matchedCustomer.phone ? ` - ${matchedCustomer.phone}` : ""
        }`
      );
      setIsCustomerDropdownOpen(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelection = async (customerId: number) => {
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

  // Check if quantity can be increased based on available stock
  const canIncreaseQuantity = (item: OrderItemT) => {
    const product = products.find((p) => p.id === item.product);
    if (!product) return false;

    // Products that don't require stock tracking can always increase quantity
    if (product.no_stock_required) return true;

    let availableStock = 0;

    if (product.has_variants && item.variant) {
      // For products with variants, check variant stock
      const variant = product.variants?.find((v) => v.id === item.variant);
      availableStock = variant?.stock || 0;
    } else {
      // For products without variants, check product stock
      availableStock = product.stock || 0;
    }

    return item.quantity < availableStock;
  };

  // Payment management functions
  const addPayment = () => {
    const newPayment: PaymentEntryT = {
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
    field: keyof PaymentEntryT,
    value: string | number
  ) => {
    setOrderForm((prev) => ({
      ...prev,
      payments: prev.payments.map((payment) =>
        payment.id === paymentId ? { ...payment, [field]: value } : payment
      ),
    }));
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch.trim()) return true;
    const search = customerSearch.toLowerCase();
    const matches =
      customer.name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search);

    return matches;
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

  // Helper function to highlight search terms
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-cyan-400/20 text-cyan-600 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (isLoadingOrder) {
    return (
      <div className="page page-narrow">
        <div className="plane">
          <div className="empty">
            <span className="inline-flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin text-cyan-600"
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
              অর্ডার লোড হচ্ছে…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    /* Same width cap as the add page — the two screens are the same form, so
       a wider one here made the fields stretch and look like a different app. */
    <div
      className={`page page-narrow ${isProductDropdownOpen ? "dropdown-page" : ""}`}
    >
      <style jsx>{`
        /* Keeps room under the page while the product dropdown is open */
        .dropdown-page {
          min-height: calc(100vh + 400px);
        }
      `}</style>

      {/* Page Header */}
      <header className="page-head">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost"
            aria-label="ফিরে যান"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="page-title">অর্ডার এডিট করুন</h1>
            <p className="page-sub">অর্ডারের প্রোডাক্ট, টাকা আর কাস্টমারের তথ্য বদলান</p>
          </div>
        </div>
        {/* Same header summary the add page carries, plus the status this
            screen alone can show. */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`badge ${
              orderForm.status === "draft" ? "badge-warn" : "badge-success"
            }`}
          >
            {orderForm.status === "draft" ? "ড্রাফট" : "কমপ্লিট"}
          </span>
          <span className="badge badge-muted">
            প্রোডাক্ট <span className="num">{orderForm.items.length}</span>
          </span>
          <span className="badge badge-success">
            মোট <span className="num">{formatCurrency(orderForm.total)}</span>
          </span>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="plane">
        {/* Customer */}
        <div className="plane-section">
          <div className="section-title">কাস্টমারের তথ্য</div>

          <CustomerSelector
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            customers={customers}
            customerType={customerType}
            setCustomerType={setCustomerType}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            customerSearch={customerSearch}
            setCustomerSearch={setCustomerSearch}
            isCustomerDropdownOpen={isCustomerDropdownOpen}
            setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
            highlightText={highlightText}
            formatCurrency={formatCurrency}
          />

          {customerType === "guest" && (
            <div className="mt-4">
              {customerValidationError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                  <p className="text-amber-700 text-sm font-medium">খেয়াল করুন</p>
                  <p className="text-amber-700 text-sm">
                    এই{" "}
                    {duplicateField === "email"
                      ? "ইমেইল"
                      : duplicateField === "phone"
                      ? "ফোন"
                      : "তথ্য"}{" "}
                    দিয়ে আগে থেকেই একজন কাস্টমার আছে:{" "}
                    <button
                      type="button"
                      onClick={handleSelectMatchedCustomer}
                      className="text-cyan-600 hover:text-cyan-700 underline font-medium transition-colors"
                    >
                      {matchedCustomer?.name}
                    </button>
                    । চাইলে তাকেই বেছে নিন, নয়তো অন্য{" "}
                    {duplicateField === "email"
                      ? "ইমেইল"
                      : duplicateField === "phone"
                      ? "ফোন"
                      : "তথ্য"}{" "}
                    দিন। তবে এভাবেও অর্ডারটা করা যাবে।
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">কাস্টমারের নাম *</label>
                  <input
                    type="text"
                    value={orderForm.customer.name}
                    onChange={(e) => handleCustomerChange("name", e.target.value)}
                    className="input"
                    placeholder="কাস্টমারের নাম লিখুন"
                  />
                </div>
                <div>
                  <label className="label">প্রতিষ্ঠান</label>
                  <input
                    type="text"
                    value={orderForm.customer.company}
                    onChange={(e) =>
                      handleCustomerChange("company", e.target.value)
                    }
                    className="input"
                    placeholder="প্রতিষ্ঠানের নাম (না দিলেও চলবে)"
                  />
                </div>
                <div>
                  <label className="label">ইমেইল (না দিলেও চলবে)</label>
                  <input
                    type="email"
                    value={orderForm.customer.email}
                    onChange={(e) =>
                      handleCustomerChange("email", e.target.value)
                    }
                    className="input"
                    placeholder="customer@email.com"
                  />
                </div>
                <div>
                  <label className="label">ফোন (না দিলেও চলবে)</label>
                  <input
                    type="tel"
                    value={orderForm.customer.phone}
                    onChange={(e) =>
                      handleCustomerChange("phone", e.target.value)
                    }
                    className="input"
                    placeholder="ফোন নম্বর"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">ঠিকানা (না দিলেও চলবে)</label>
                  <textarea
                    value={orderForm.customer.address}
                    onChange={(e) =>
                      handleCustomerChange("address", e.target.value)
                    }
                    rows={2}
                    className="textarea"
                    placeholder="কাস্টমারের ঠিকানা"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="plane-section">
          <div className="section-title mb-0">
            অর্ডারের প্রোডাক্ট ({orderForm.items.length})
          </div>
        </div>

        <OrderItemsTable
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          products={products}
          canIncreaseQuantity={canIncreaseQuantity}
          formatCurrency={formatCurrency}
          removeItem={removeItem}
          updateItemQuantity={updateItemQuantity}
          updateItemUnitPrice={updateItemUnitPrice}
        />

        {/* Add New Item */}
        <div className="plane-section">
          <div className="section-title">নতুন প্রোডাক্ট যোগ করুন</div>

          <div className="pb-20 space-y-3">
            <div>
              <label className="label">
                প্রোডাক্ট খুঁজুন (নামের উপর চাপ দিলে অর্ডারে যোগ হবে)
              </label>
              <div className="relative">
                <ProductSearchInput
                  ref={productSearchInputRef}
                  value={productSearch}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  onClear={handleSearchClear}
                  isSearching={isSearchingProducts}
                  isLoading={isLoadingProducts}
                />
                <ProductDropdown
                  isOpen={isProductDropdownOpen}
                  searchQuery={productSearch}
                  searchResults={searchResults}
                  isLoading={isLoadingProducts}
                  isSearching={isSearchingProducts}
                  onProductSelect={handleProductSelect}
                  onClose={handleDropdownClose}
                  highlightText={highlightText}
                />
              </div>
            </div>

            {selectedProduct?.has_variants && (
              <div>
                <label className="label">ভ্যারিয়েন্ট সিলেক্ট করুন</label>
                <select
                  value={newItem.variant}
                  onChange={(e) => handleNewItemChange("variant", e.target.value)}
                  className="select"
                >
                  <option value="">ভ্যারিয়েন্ট সিলেক্ট করুন</option>
                  {availableVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.size} {variant.color} - স্টক: {variant.stock}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={addItemToOrder}
              disabled={!selectedProduct || newItem.quantity <= 0}
              className="btn btn-primary"
            >
              প্রোডাক্ট যোগ করুন
            </button>
          </div>
        </div>

        <BillSummary
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          currencySymbol={currencySymbol}
          formatCurrency={formatCurrency}
        />

        <PaymentsSection
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          formatCurrency={formatCurrency}
        />

        <SalesIncentive
          orderForm={orderForm}
          setOrderForm={setOrderForm}
          employees={employees}
          isEmployeeDropdownOpen={isEmployeeDropdownOpen}
          setIsEmployeeDropdownOpen={setIsEmployeeDropdownOpen}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          formatCurrency={formatCurrency}
          isOpen={isSalesIncentiveOpen}
          setIsOpen={setIsSalesIncentiveOpen}
        />

        {/* Actions */}
        <div className="plane-section">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                handleSubmit(
                  orderForm.status === "draft"
                    ? "completed"
                    : (orderForm.status as any)
                )
              }
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting
                ? orderForm.status === "draft"
                  ? "কমপ্লিট হচ্ছে…"
                  : "আপডেট হচ্ছে…"
                : orderForm.status === "draft"
                ? "অর্ডার কমপ্লিট করুন"
                : "অর্ডার আপডেট করুন"}
            </button>
            <button
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="btn btn-ghost flex-1"
            >
              ড্রাফট হিসেবে রাখুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
