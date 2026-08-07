"use client";

import { num } from "@/lib/money";

import ProductDropdown from "@/components/ProductDropdown";
import ProductSearchInput, {
  ProductSearchInputRef,
} from "@/components/ProductSearchInput";
import { useCurrencyFormatter, useCurrency } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import CustomerNameMatches from "@/components/orders/CustomerNameMatches";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

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
  discount_type: "percentage" | "flat"; // New field for discount type
  discount_percentage: number;
  discount_flat_amount: number; // New field for flat discount amount
  discount_amount: number;
  vat_percentage: number;
  vat_amount: number;
  due_amount: number;
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
  const { currencySymbol } = useCurrency();
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
  const [customerType, setCustomerType] = useState<"existing" | "guest">(
    "existing"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState(""); // Separate state for debouncing
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isSalesIncentiveOpen, setIsSalesIncentiveOpen] = useState(false);
  const [customerValidationError, setCustomerValidationError] = useState<
    string | null
  >(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [duplicateField, setDuplicateField] = useState<'email' | 'phone' | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(
    null
  );

  // Ref to maintain focus on product search input
  const productSearchInputRef = useRef<ProductSearchInputRef>(null);

  // Track if user is actively typing to manage focus appropriately
  const isActivelyTypingRef = useRef(false);

  // Buy price visibility protection
  const [showBuyPrices, setShowBuyPrices] = useState(false);

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
    discount_type: "percentage",
    discount_percentage: 0,
    discount_flat_amount: 0,
    discount_amount: 0,
    vat_percentage: 0,
    vat_amount: 0,
    due_amount: 0,
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
    if (isProductDropdownOpen && productSearch.trim().length >= 2 && !isSearchingProducts) {
      // Use a minimal delay to ensure smooth typing experience
      const timer = setTimeout(() => {
        if (productSearchInputRef.current) {
          try {
            productSearchInputRef.current.focus();
          } catch (error) {
            // Silently handle focus errors
          }
        }
      }, 50); // Minimal delay

      return () => clearTimeout(timer);
    }
  }, [isProductDropdownOpen, productSearch]);

  // Debounce customer search input for smoother UX
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCustomerSearch(customerSearchInput);
    }, 400); // Consistent 400ms debounce for optimal UX

    return () => clearTimeout(debounceTimer);
  }, [customerSearchInput]);

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
      setError("প্রোডাক্ট লোড করা যায়নি");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // New function to search products from backend with proper cancellation
  const searchProducts = useCallback(
    async (query: string, signal?: AbortSignal) => {
      if (!query || query.trim().length < 1) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearchingProducts(true);
        
        if (signal?.aborted) return;

        const response = await ApiService.searchProducts(query.trim(), signal);
        
        if (signal?.aborted) return;

        const results = Array.isArray(response)
          ? response
          : response?.results || [];

        if (!signal?.aborted) {
          setSearchResults(results);
        }
      } catch (error) {
        if (error instanceof Error && (error.message === 'AbortError' || error.name === 'AbortError')) {
          return;
        }
        console.error("Error searching products:", error);
        if (!signal?.aborted) {
          setSearchResults([]);
        }
      } finally {
        if (!signal?.aborted) {
          setIsSearchingProducts(false);
        }
      }
    },
    []
  );

  // Debounced search with proper request cancellation
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (searchAbortController) searchAbortController.abort();

      if (query.trim().length < 1) {
        setSearchResults([]);
        setIsSearchingProducts(false);
        return;
      }

      const timeout = setTimeout(() => {
        const controller = new AbortController();
        setSearchAbortController(controller);
        searchProducts(query, controller.signal);
      }, 250);

      setSearchTimeout(timeout);
    },
    [searchTimeout, searchAbortController, searchProducts]
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
    // Open dropdown on focus if user has already typed at least 2 characters
    if (productSearch.trim().length >= 2) {
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
        try {
          productSearchInputRef.current.focus();
          // Reset typing flag after focusing for fresh start
          isActivelyTypingRef.current = false;
        } catch (error) {
          // Silently handle focus errors
        }
      }
    }, 10);
  }, [searchTimeout]);

  const handleProductSelect = useCallback(
    async (productId: string, displayText: string) => {
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
          const fetchedProduct = await ApiService.getProduct(parseInt(productId));
          if (fetchedProduct) {
            productToAdd = fetchedProduct;
            // Add it to the main products array for future reference
            setProducts(prev => [...prev, fetchedProduct]);
          }
        } catch (error) {
          console.error("Failed to fetch product:", error);
        }
      }
      
      if (!productToAdd) {
        setError("প্রোডাক্টটা পাওয়া যায়নি। আবার খুঁজে দেখুন।");
        return;
      }
      
      // Type guard: productToAdd is now guaranteed to be defined
      const product = productToAdd;
      
      // If product was found in search results but not in main products array,
      // add it to the main products array for future reference
      if (!productFromMain && productFromSearch) {
        setProducts(prev => [...prev, product]);
      }

      // Check stock availability - skip for products that don't require stock tracking
      let availableStock = 0;
      const requestedQuantity = 1; // Default quantity when clicking on product

      if (product.has_variants) {
        // For products with variants, we'll use the first available variant
        const firstVariant = product.variants?.[0];
        if (firstVariant) {
          availableStock = firstVariant.stock || 0;
        }
      } else {
        availableStock = product.stock || 0;
      }

      // Only check stock if the product requires stock tracking
      const requiresStockTracking = !product.no_stock_required;
      if (requiresStockTracking && availableStock <= 0) {
        setError("প্রোডাক্টটা স্টকে নেই");
        setProductSearch("");
        setIsProductDropdownOpen(false);
        return;
      }

      // Check if the same product already exists in the order
      const existingItemIndex = orderForm.items.findIndex(
        (item) => item.product === parseInt(productId) && 
        (!product.has_variants || item.variant === product.variants?.[0]?.id)
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingItem = orderForm.items[existingItemIndex];
        const newQuantity = existingItem.quantity + requestedQuantity;

        // Only check stock limits if the product requires stock tracking
        if (requiresStockTracking && newQuantity > availableStock) {
          setError(
            `আর যোগ করা যাবে না। সর্বোচ্চ আছে: ${
              availableStock - existingItem.quantity
            }`
          );
          setProductSearch("");
          setIsProductDropdownOpen(false);
          return;
        }

        setOrderForm((prev) => {
          const updatedItems = prev.items.map((item, index) =>
            index === existingItemIndex
              ? {
                  ...item,
                  quantity: newQuantity,
                  total: newQuantity * item.unit_price,
                }
              : item
          );
          return {
            ...prev,
            items: updatedItems,
          };
        });
      } else {
        // Add new item
        let unitPrice = 0;
        let buyPrice = 0;
        let selectedVariant = null;

        if (product.has_variants && product.variants?.[0]) {
          selectedVariant = product.variants[0];
          unitPrice = selectedVariant.sell_price || 0;
          buyPrice = selectedVariant.buy_price || 0;
        } else {
          unitPrice = product.sell_price || 0;
          buyPrice = product.buy_price || 0;
        }

        const item: OrderItem = {
          id: Date.now().toString(),
          product: parseInt(productId),
          variant: selectedVariant?.id,
          quantity: requestedQuantity,
          unit_price: unitPrice,
          buy_price: buyPrice,
          total: requestedQuantity * unitPrice,
          product_name: product.name,
          variant_details: selectedVariant
            ? `${selectedVariant.color} - ${selectedVariant.size}${
                selectedVariant.custom_variant
                  ? ` - ${selectedVariant.custom_variant}`
                  : ""
              }`
            : undefined,
        };

        setOrderForm((prev) => {
          const newItems = [...prev.items, item];
          return {
            ...prev,
            items: newItems,
          };
        });
      }

      // Clear search and close dropdown
      setProductSearch("");
      setIsProductDropdownOpen(false);
      setError(null);
      
      // Refocus the search input immediately and restore typing state for continued use
      setTimeout(() => {
        if (productSearchInputRef.current) {
          try {
            productSearchInputRef.current.focus();
            // Ready for more typing
            isActivelyTypingRef.current = false; // Fresh start for next search
          } catch (error) {
            // Silently handle focus errors
          }
        }
      }, 10); // Immediate focus restore
    },
    [products, searchResults, orderForm.items]
  );

  const handleDropdownClose = useCallback(() => {
    isActivelyTypingRef.current = false; // User closed dropdown, stop tracking
    setIsProductDropdownOpen(false);
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const response = await ApiService.getCustomers({ page_size: 500 });
      const customers = Array.isArray(response)
        ? response
        : response?.results || [];

      // For each customer, try to get their financial summary (but don't block if it fails)
      const customersWithDue = await Promise.all(
        customers.map(async (customer: Customer) => {
          try {
            // Try to fetch financial summary for each customer
            const summaryResponse = await ApiService.get(
              `/customers/${customer.id}/summary/`
            );
            const financialSummary = summaryResponse.financial_summary || {};
            
            // Calculate net balance - positive means customer owes money (due)
            let previousDue = 0;
            if (
              financialSummary.net_amount !== undefined &&
              financialSummary.net_amount !== null
            ) {
              const netAmount = parseFloat(financialSummary.net_amount);
              previousDue = netAmount > 0 ? netAmount : 0;
            } else if (
              financialSummary.total_due !== undefined &&
              financialSummary.total_advance !== undefined
            ) {
              const netBalance =
                parseFloat(financialSummary.total_due || 0) -
                parseFloat(financialSummary.total_advance || 0);
              previousDue = netBalance > 0 ? netBalance : 0;
            }

            return {
              ...customer,
              previous_due: previousDue,
            };
          } catch (error) {
            console.warn(`Failed to fetch financial summary for customer ${customer.id}:`, error);
            // Return customer with default due amount if summary fetch fails
            return {
              ...customer,
              previous_due: 0,
            };
          }
        })
      );

      setCustomers(customersWithDue);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("কাস্টমার লোড করা যায়নি");
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
      setError("কর্মচারী লোড করা যায়নি");
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Calculate totals
  const calculateTotals = (
    items: OrderItem[],
    discountType: "percentage" | "flat",
    discountPercentage: number,
    discountFlatAmount: number,
    vatPercentage: number,
    dueAmount: number,
    previousDue: number,
    applyPreviousDueToTotal: boolean,
    incentiveAmount: number,
    payments: PaymentEntry[]
  ) => {
    const subtotal = items.reduce((sum, item) => sum + num(item.total), 0);
    const totalBuyPrice = items.reduce(
      (sum, item) => sum + item.buy_price * item.quantity,
      0
    );
    const totalSellPrice = subtotal; // Sell price is the same as subtotal before discounts
    
    // Calculate discount amount based on type
    const discountAmount = discountType === "percentage" 
      ? (subtotal * discountPercentage) / 100
      : discountFlatAmount;
    
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = (afterDiscount * vatPercentage) / 100;
    // Due amount is just a note and should not affect total calculation
    // Only add previous due if checkbox is checked (this is existing debt)
    const total =
      afterDiscount +
      vatAmount +
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
      orderForm.discount_type,
      orderForm.discount_percentage,
      orderForm.discount_flat_amount,
      orderForm.vat_percentage,
      orderForm.due_amount,
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
    orderForm.discount_type,
    orderForm.discount_percentage,
    orderForm.discount_flat_amount,
    orderForm.vat_percentage,
    orderForm.due_amount,
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
        setMatchedCustomer(existingCustomer);
        setDuplicateField(field as 'email' | 'phone');
        setCustomerValidationError(
          `এই ${field} দিয়ে আগে থেকেই একজন কাস্টমার আছে: ${existingCustomer.name}। চাইলে তাকেই বেছে নিন, নয়তো অন্য ${field} দিন।`
        );
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

    // Find the item to check stock availability
    const currentItem = orderForm.items.find((item) => item.id === itemId);
    if (!currentItem) return;

    // Find the product to check stock
    const product = products.find((p) => p.id === currentItem.product);
    if (!product) return;

    // Skip stock validation for products that don't require stock tracking
    if (!product.no_stock_required) {
      let availableStock = 0;

      if (product.has_variants && currentItem.variant) {
        // For products with variants, check variant stock
        const variant = product.variants?.find(
          (v) => v.id === currentItem.variant
        );
        availableStock = variant?.stock || 0;
      } else {
        // For products without variants, check product stock
        availableStock = product.stock || 0;
      }

      // Don't allow quantity to exceed available stock
      if (quantity > availableStock) {
        return;
      }
    }

    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      ),
    }));
  };

  // Check if quantity can be increased based on available stock
  const canIncreaseQuantity = (item: OrderItem) => {
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
      setError("অর্ডারে অন্তত একটা প্রোডাক্ট যোগ করুন");
      return;
    }

    if (!orderForm.customer.name) {
      setError("কাস্টমারের নাম লিখুন");
      return;
    }

    // Only block submission for validation errors if we're dealing with existing customers
    // For guest customers, we allow them to proceed even if there might be duplicate email/phone
    if (customerValidationError && customerType === "existing") {
      setError("সাবমিট করার আগে কাস্টমার সিলেক্ট করুনয়ের সমস্যাটা ঠিক করুন");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let customerId = selectedCustomerId;

      // If this is a new customer (guest), create the customer first
      if (customerType === "guest" && !selectedCustomerId) {
        try {
          const customerData = {
            name: orderForm.customer.name,
            phone: orderForm.customer.phone?.trim() || undefined,
            email: orderForm.customer.email?.trim() || undefined,
            address: orderForm.customer.address?.trim() || undefined,
            company: orderForm.customer.company?.trim() || undefined,
          };

          const newCustomer = await ApiService.createCustomer(customerData);
          customerId = newCustomer.id;
        } catch (customerError) {
          console.error("Error creating customer:", customerError);
          // If customer creation fails, we can still proceed with the order as guest
        }
      }

      // Prepare order data with multiple items
      const orderData = {
        // Customer information - use the customer ID if available
        customer: customerId || undefined,
        customer_name: orderForm.customer.name,
        customer_phone: orderForm.customer.phone?.trim() || undefined,
        customer_email: orderForm.customer.email?.trim() || undefined,
        customer_address: orderForm.customer.address?.trim() || undefined,
        customer_company: orderForm.customer.company?.trim() || undefined,

        // Order details
        status,
        discount_type: orderForm.discount_type,
        discount_percentage: orderForm.discount_percentage,
        discount_flat_amount: orderForm.discount_flat_amount,
        vat_percentage: orderForm.vat_percentage,
        due_amount: orderForm.due_amount,
        previous_due: orderForm.previous_due,
        apply_previous_due_to_total: orderForm.apply_previous_due_to_total,
        due_date: orderForm.due_date || undefined,
        notes: orderForm.notes || undefined,

        // Internal company fields
        employee: orderForm.employee_id || undefined,
        incentive_amount: orderForm.incentive_amount,

        // Items - convert frontend format to backend format
        items: orderForm.items.map((item) => ({
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          buy_price: item.buy_price,
        })),

        // Payments - convert frontend format to backend format
        payments: orderForm.payments.map((payment) => ({
          method: payment.method.toLowerCase(),
          amount: payment.amount,
        })),
      };

      // Create the order using the orders API
      const response = await ApiService.createOrder(orderData);

      // Navigate back to orders page
      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      setError(
        error instanceof Error ? error.message : "অর্ডার তৈরি করা যায়নি"
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <span
          key={index}
          className="bg-cyan-100 text-cyan-700 font-medium"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <style jsx>{`
        /* Keeps room under the page while the product dropdown is open */
        .dropdown-page {
          min-height: calc(100vh + 400px);
        }
      `}</style>
      <div className={`page page-narrow ${isProductDropdownOpen ? "dropdown-page" : ""}`}>
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
              <h1 className="page-title">নতুন বিক্রি</h1>
              <p className="page-sub">প্রোডাক্ট যোগ করে অর্ডার বানান</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="badge badge-muted">
              প্রোডাক্ট <span className="num">{orderForm.items.length}</span>
            </span>
            <span className="badge badge-success">
              মোট{" "}
              <span className="num">{formatCurrency(orderForm.total)}</span>
            </span>
          </div>
        </header>

        <div className="plane">
          {/* Customer Information */}
          <div className="plane-section">
            <div className="section-title">কাস্টমারের তথ্য</div>

            {/* Customer Selection Row */}
            <div className="mb-4">
              <label className="label">কাস্টমার সিলেক্ট করুন</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* Customer Dropdown with Integrated Search */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="কাস্টমার খুঁজে সিলেক্ট করুন (অন্তত ২ অক্ষর লিখুন)…"
                      value={customerSearchInput}
                      onChange={(e) => {
                        setCustomerSearchInput(e.target.value);
                        // Only open dropdown if user has typed at least 2 characters
                        if (e.target.value.trim().length >= 2) {
                          setIsCustomerDropdownOpen(true);
                        } else {
                          setIsCustomerDropdownOpen(false);
                        }
                      }}
                      onFocus={() => {
                        // Only open dropdown on focus if user has already typed at least 2 characters
                        if (customerSearchInput.trim().length >= 2) {
                          setIsCustomerDropdownOpen(true);
                        }
                      }}
                      disabled={customerType === "guest"}
                      className="input pr-20"
                    />
                    {/* Clear button */}
                    {customerSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearch("");
                          setCustomerSearchInput("");
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
                        className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 transition-colors px-1.5 py-1 rounded hover:bg-slate-100"
                        title="খোঁজা মুছে দিন"
                      >
                        মুছুন
                      </button>
                    )}
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
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
                  {isCustomerDropdownOpen &&
                    customerSearch.trim().length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        {isLoadingCustomers ? (
                          <div className="p-3 text-sm text-slate-500">
                            লোড হচ্ছে…
                          </div>
                        ) : filteredCustomers.length > 0 ? (
                          filteredCustomers.slice(0, 10).map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => {
                                handleCustomerSelection(customer.id);
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
                              className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                            >
                              <div className="text-slate-900 font-medium truncate">
                                {customer.name}
                              </div>
                              <div className="text-slate-500 text-xs truncate">
                                {customer.email || "ইমেইল নেই"} •{" "}
                                {customer.phone || "ফোন নেই"}
                              </div>
                              {customer.previous_due !== undefined &&
                                customer.previous_due !== null &&
                                customer.previous_due > 0 && (
                                  <div className="money-neg text-xs mt-1">
                                    আগের বাকি:{" "}
                                    {formatCurrency(customer.previous_due)}
                                  </div>
                                )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-slate-500">
                            কোনো কাস্টমার পাওয়া যায়নি
                          </div>
                        )}
                        {/* Show indicator when there are more than 10 results */}
                        {filteredCustomers.length > 10 && (
                          <div className="p-2 text-xs text-slate-500 bg-slate-100 border-t border-slate-200 text-center">
                            {filteredCustomers.length}টির মধ্যে ১০টি দেখাচ্ছে।
                            আরও লিখে খোঁজ ছোট করুন।
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
                    className="w-4 h-4 rounded border-slate-200 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-slate-600">নতুন কাস্টমার</span>
                </label>
              </div>
            </div>

            {/* New Customer Form */}
            {customerType === "guest" && (
              <div>
                {/* Customer Validation Warning */}
                {customerValidationError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                    <p className="text-amber-700 text-sm font-medium">খেয়াল করুন</p>
                    <p className="text-amber-700 text-sm">
                      এই {duplicateField === "email" ? "ইমেইল" : duplicateField === "phone" ? "ফোন" : "তথ্য"} দিয়ে আগে থেকেই একজন কাস্টমার আছে:{" "}
                      <button
                        type="button"
                        onClick={handleSelectMatchedCustomer}
                        className="text-cyan-600 hover:text-cyan-700 underline font-medium transition-colors"
                      >
                        {matchedCustomer?.name}
                      </button>
                      । চাইলে তাকেই বেছে নিন, নয়তো অন্য{" "}
                      {duplicateField === "email" ? "ইমেইল" : duplicateField === "phone" ? "ফোন" : "তথ্য"} দিন। তবে এভাবেও অর্ডারটা করা যাবে।
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">কাস্টমারের নাম *</label>
                    <input
                      type="text"
                      value={orderForm.customer.name}
                      onChange={(e) =>
                        handleCustomerChange("name", e.target.value)
                      }
                      className="input"
                      placeholder="কাস্টমারের নাম লিখুন"
                    />
                    {/* Catches the duplicate before it is created: the same
                        person entered twice splits their due across two ledgers. */}
                    <CustomerNameMatches
                      name={orderForm.customer.name}
                      customers={customers}
                      formatCurrency={formatCurrency}
                      onPick={(customer) => {
                        setCustomerType("existing");
                        setCustomerSearchInput(customer.name);
                        handleCustomerSelection(customer.id);
                      }}
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
            <div className="flex items-center justify-between gap-2">
              <div className="section-title mb-0">
                অর্ডারের প্রোডাক্ট ({orderForm.items.length})
              </div>
              <button
                onClick={() => setShowBuyPrices(!showBuyPrices)}
                className="btn btn-ghost btn-sm"
                title={showBuyPrices ? "কেনা দাম লুকান" : "কেনা দাম দেখান"}
                aria-label={showBuyPrices ? "কেনা দাম লুকান" : "কেনা দাম দেখান"}
              >
                {showBuyPrices ? (
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
                ) : (
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
                কেনা দাম
              </button>
            </div>
          </div>

          {orderForm.items.length === 0 ? (
            <div className="empty">
              <p className="text-slate-900 font-medium mb-1">
                এখনো কোনো প্রোডাক্ট যোগ করা হয়নি
              </p>
              <p>নিচের ঘর থেকে প্রোডাক্ট খুঁজে অর্ডারে যোগ করুন</p>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>প্রোডাক্ট</th>
                    <th className="cell-num">পরিমাণ</th>
                    <th className="cell-num">কেনা দাম</th>
                    <th className="cell-num">বিক্রির দাম</th>
                    <th className="cell-num">মোট</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderForm.items.map((item) => (
                    <tr key={item.id}>
                      {/* Product Name */}
                      <td>
                        <div className="cell-strong">{item.product_name}</div>
                        {item.variant_details && (
                          <div className="text-xs text-slate-500 mt-0.5">
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
                                className="select"
                                aria-label="ভ্যারিয়েন্ট সিলেক্ট করুন"
                              >
                                <option value="">ভ্যারিয়েন্ট সিলেক্ট করুন</option>
                                {product.variants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.color} - {variant.size}
                                    {variant.custom_variant &&
                                      ` - ${variant.custom_variant}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null;
                        })()}
                      </td>

                      {/* Quantity */}
                      <td className="cell-num">
                        <div className="row-actions">
                          <button
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                            aria-label="পরিমাণ কমান"
                          >
                            −
                          </button>
                          <span className="w-8 text-center num text-slate-900 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateItemQuantity(item.id, item.quantity + 1)
                            }
                            disabled={!canIncreaseQuantity(item)}
                            className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              canIncreaseQuantity(item)
                                ? "পরিমাণ বাড়ান"
                                : "স্টকে আর নেই"
                            }
                            aria-label="পরিমাণ বাড়ান"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="cell-num">
                        <span
                          className={`transition-all duration-200 ${
                            !showBuyPrices ? "blur-md select-none" : ""
                          }`}
                          title={
                            !showBuyPrices
                              ? "কেনা দাম দেখতে চোখের আইকনে চাপুন"
                              : ""
                          }
                        >
                          {formatCurrency(item.buy_price || 0)}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td className="cell-num">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            updateItemUnitPrice(item.id, newPrice);
                          }}
                          className="input w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          step="0.01"
                          aria-label="বিক্রির দাম"
                        />
                      </td>

                      {/* Total Price */}
                      <td className="cell-num cell-strong">
                        {formatCurrency(item.total)}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                          title="প্রোডাক্টটা বাদ দিন"
                          aria-label="প্রোডাক্টটা বাদ দিন"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Item Form */}
          <div className="plane-section">
            <div className="section-title">নতুন প্রোডাক্ট যোগ করুন</div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className={isProductDropdownOpen ? "pb-20" : ""}>
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
          </div>

          {/* Bill Summary */}
          <div className="plane-section">
            <div className="section-title ml-auto w-full max-w-sm">বিলের হিসাব</div>

            <div className="ml-auto w-full max-w-sm space-y-3 text-sm">
              {/* Subtotal */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-slate-500">সাবটোটাল</span>
                <span className="num text-slate-900">
                  {formatCurrency(orderForm.subtotal)}
                </span>
              </div>

              {/* Discount */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-slate-500">ডিসকাউন্ট</span>
                <div className="flex items-center gap-2">
                  {/* Discount Type Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((prev) => ({
                          ...prev,
                          discount_type: "percentage",
                          discount_flat_amount: 0, // Reset flat amount when switching
                        }))
                      }
                      className={`btn btn-sm ${
                        orderForm.discount_type === "percentage"
                          ? "btn-primary"
                          : "btn-ghost"
                      }`}
                      aria-label="শতকরা ডিসকাউন্ট"
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOrderForm((prev) => ({
                          ...prev,
                          discount_type: "flat",
                          discount_percentage: 0, // Reset percentage when switching
                        }))
                      }
                      className={`btn btn-sm ${
                        orderForm.discount_type === "flat"
                          ? "btn-primary"
                          : "btn-ghost"
                      }`}
                      aria-label="সরাসরি টাকায় ডিসকাউন্ট"
                    >
                      {currencySymbol}
                    </button>
                  </div>

                  {orderForm.discount_type === "percentage" ? (
                    <>
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
                        className="input w-16 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder=""
                        min="0"
                        max="100"
                        step="0.01"
                        aria-label="ডিসকাউন্টের শতকরা হার"
                      />
                      <span className="text-slate-500">%</span>
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={
                          orderForm.discount_flat_amount === 0
                            ? ""
                            : orderForm.discount_flat_amount
                        }
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            discount_flat_amount:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="input w-20 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        aria-label="ডিসকাউন্টের টাকা"
                      />
                      <span className="text-slate-500">{currencySymbol}</span>
                    </>
                  )}

                  <span className="money-neg">
                    -{formatCurrency(orderForm.discount_amount)}
                  </span>
                </div>
              </div>

              {/* VAT */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-slate-500">ভ্যাট</span>
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
                    className="input w-16 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    aria-label="ভ্যাটের শতকরা হার"
                  />
                  <span className="text-slate-500">%</span>
                  <span className="num text-slate-900">
                    {formatCurrency(orderForm.vat_amount)}
                  </span>
                </div>
              </div>

              {/* Due */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-slate-500">বাকি</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={
                      orderForm.due_amount === 0 ? "" : orderForm.due_amount
                    }
                    onChange={(e) =>
                      setOrderForm((prev) => ({
                        ...prev,
                        due_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="input w-20 px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    aria-label="বাকির পরিমাণ"
                  />
                  <span className="text-slate-500">{currencySymbol}</span>
                </div>
              </div>

              {/* Previous Due - Only show if customer has previous due */}
              {orderForm.previous_due > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-slate-500">আগের বাকি</span>
                    <span className="money-neg font-medium">
                      {orderForm.apply_previous_due_to_total ? "+" : ""}
                      {formatCurrency(orderForm.previous_due)}
                    </span>
                  </div>
                  {/* Checkbox to include previous due in total */}
                  <div className="flex items-center gap-2">
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
                      className="w-4 h-4 rounded border-slate-200 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label
                      htmlFor="apply-previous-due-to-total"
                      className="text-xs text-slate-500 cursor-pointer"
                    >
                      আগের বাকিটা মোটের সাথে যোগ করুন
                    </label>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="font-semibold text-slate-900">মোট</span>
                <span className="num text-cyan-600 font-semibold text-lg">
                  {formatCurrency(orderForm.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="plane-section">
            <div className="ml-auto flex w-full max-w-sm items-center justify-between gap-2 mb-3">
              <div className="section-title mb-0">টাকা জমার হিসাব</div>
              <button
                type="button"
                onClick={addPayment}
                className="btn btn-ghost btn-sm"
              >
                পেমেন্ট যোগ করুন
              </button>
            </div>

            {/* Payment Entries */}
            {orderForm.payments.length > 0 && (
              <div className="ml-auto w-full max-w-sm space-y-2">
                {orderForm.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-2">
                    <select
                      value={payment.method}
                      onChange={(e) =>
                        updatePayment(
                          payment.id,
                          "method",
                          e.target.value as PaymentEntry["method"]
                        )
                      }
                      className="select w-auto"
                      aria-label="পেমেন্ট টাইপ"
                    >
                      <option value="Cash">ক্যাশ</option>
                      <option value="Cheque">চেক</option>
                      <option value="Bkash">বিকাশ</option>
                      <option value="Nagad">নগদ</option>
                      <option value="Bank">ব্যাংক</option>
                    </select>

                    <input
                      type="number"
                      value={payment.amount === 0 ? "" : payment.amount}
                      onChange={(e) =>
                        updatePayment(
                          payment.id,
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="input flex-1 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      aria-label="জমার পরিমাণ"
                    />

                    {orderForm.payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePayment(payment.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                        title="পেমেন্টটি বাদ দিন"
                        aria-label="পেমেন্টটি বাদ দিন"
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
              <div className="ml-auto w-full max-w-sm space-y-1 pt-3 mt-3 border-t border-slate-200 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">মোট জমা</span>
                  <span className="num text-slate-900 font-medium">
                    {formatCurrency(orderForm.total_payment_received)}
                  </span>
                </div>

                {orderForm.remaining_balance !== 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">বাকি আছে</span>
                    <span
                      className={`font-semibold ${
                        orderForm.remaining_balance > 0
                          ? "money-neg"
                          : "money-pos"
                      }`}
                    >
                      {formatCurrency(orderForm.remaining_balance)}
                    </span>
                  </div>
                )}

                {orderForm.remaining_balance < 0 && (
                  <div className="text-xs text-amber-700 mt-1">
                    *{" "}
                    {formatCurrency(Math.abs(orderForm.remaining_balance))} বেশি
                    জমা হয়েছে
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {orderForm.payments.length === 0 && (
              <p className="text-center py-3 text-slate-500 text-sm">
                এখনো কোনো পেমেন্ট যোগ করা হয়নি। টাকা জমা লিখতে &quot;পেমেন্ট যোগ
                করুন&quot; চাপুন।
              </p>
            )}
          </div>

          {/* Sales Incentive - Company Internal */}
          <div className="plane-section">
            <button
              onClick={() => setIsSalesIncentiveOpen(!isSalesIncentiveOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="section-title mb-0">
                সেলস ইনসেনটিভ (নিজেদের হিসাব)
              </span>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${
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
              <div className="space-y-3 mt-3">
                <div>
                  <label className="label">কর্মচারী</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="কর্মচারী খুঁজে সিলেক্ট করুন…"
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setIsEmployeeDropdownOpen(true);
                      }}
                      onFocus={() => setIsEmployeeDropdownOpen(true)}
                      className="input pr-20"
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
                        className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900 transition-colors px-1.5 py-1 rounded hover:bg-slate-100"
                        title="খোঁজা মুছে দিন"
                      >
                        মুছুন
                      </button>
                    )}
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
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
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                        {isLoadingEmployees ? (
                          <div className="p-3 text-sm text-slate-500">
                            লোড হচ্ছে…
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
                              className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 text-slate-500 text-sm"
                            >
                              কোনো কর্মচারী নয়
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
                                      employee.role || employee.department
                                    }`
                                  );
                                  setIsEmployeeDropdownOpen(false);
                                }}
                                className="p-3 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                              >
                                <div className="text-slate-900 font-medium text-sm">
                                  {employee.name}
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {employee.role || employee.department} •{" "}
                                  {employee.email}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="p-3 text-sm text-slate-500">
                            কোনো কর্মচারী পাওয়া যায়নি
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
                  <label className="label">ইনসেনটিভের টাকা</label>
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
                    className="input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {/* Incentive creation note */}
                  {orderForm.employee_id &&
                    orderForm.incentive_amount > 0 && (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                        <p className="text-emerald-700 text-xs">
                          অর্ডার সাবমিট করলে সিলেক্ট করা কর্মচারী{" "}
                          {formatCurrency(orderForm.incentive_amount)}{" "}
                          ইনসেনটিভ পাবেন।
                        </p>
                      </div>
                    )}
                  {/* Warning when employee is selected but no incentive amount */}
                  {orderForm.employee_id &&
                    orderForm.incentive_amount === 0 && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <p className="text-amber-700 text-xs">
                          কর্মচারী সিলেক্ট করা হয়েছে কিন্তু ইনসেনটিভের টাকা
                          দেওয়া হয়নি। উপরে টাকার পরিমাণ লিখুন।
                        </p>
                      </div>
                    )}
                </div>

                {/* Net Profit Display */}
                {orderForm.total > 0 && (
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500">মোট কেনা দাম</span>
                      <span className="money-neg">
                        {formatCurrency(orderForm.total_buy_price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500">মোট বিক্রির দাম</span>
                      <span className="num text-slate-900">
                        {formatCurrency(orderForm.total_sell_price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-500">মোট লাভ</span>
                      <span className="money-pos">
                        {formatCurrency(orderForm.gross_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-500">ইনসেনটিভ</span>
                      <span className="money-neg">
                        -{formatCurrency(orderForm.incentive_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-slate-600">
                        {orderForm.net_profit < 0 ? "নিট লোকসান" : "নিট লাভ"}
                      </span>
                      <span
                        className={`font-semibold ${
                          orderForm.net_profit < 0 ? "money-neg" : "money-pos"
                        }`}
                      >
                        {orderForm.net_profit < 0
                          ? formatCurrency(Math.abs(orderForm.net_profit))
                          : formatCurrency(orderForm.net_profit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="plane-section">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSubmit("pending")}
                disabled={isSubmitting || orderForm.items.length === 0}
                className="btn btn-primary flex-1"
              >
                {isSubmitting ? "তৈরি হচ্ছে…" : "বিক্রি সেভ করুন"}
              </button>

              <button
                onClick={() => handleSubmit("draft")}
                disabled={isSubmitting || orderForm.items.length === 0}
                className="btn btn-ghost flex-1"
              >
                ড্রাফট হিসেবে রাখুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
