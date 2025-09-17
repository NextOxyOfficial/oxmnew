"use client";

import ProductDropdown from "@/components/ProductDropdown";
import ProductSearchInput, {
  ProductSearchInputRef,
} from "@/components/ProductSearchInput";
import { useCurrencyFormatter, useCurrency } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
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

  // Ref to maintain focus on product search input
  const productSearchInputRef = useRef<ProductSearchInputRef>(null);

  // Track if user is actively typing to manage focus appropriately
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
    if (isProductDropdownOpen && productSearch.trim().length >= 1 && !isSearchingProducts) {
      // Use a minimal delay to ensure smooth typing experience
      const timer = setTimeout(() => {
        if (productSearchInputRef.current) {
          try {
            productSearchInputRef.current.focus();
          } catch (error) {
            // Silently handle focus errors
            console.log("Focus restoration skipped - component not available");
          }
        }
      }, 50); // Minimal delay

      return () => clearTimeout(timer);
    }
  }, [isProductDropdownOpen, productSearch]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await ApiService.getProducts();
      console.log("Products API response:", response);
      const productsData = Array.isArray(response)
        ? response
        : response?.results || [];
      console.log("Processed products:", productsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // New function to search products from backend
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

        // If no backend results, fallback to local filtering
        if (results.length === 0) {
          const localResults = products.filter((product) => {
            const search = query.toLowerCase().trim();
            
            // Only proceed if search query has meaningful content
            if (search.length < 1) return false;
            
            const safeIncludes = (field: string | null | undefined) => {
              return field && 
                     field.toString().trim().length > 0 && 
                     field.toString().toLowerCase().includes(search);
            };
            
            // Check each field explicitly and return true only if there's a match
            const nameMatch = safeIncludes(product.name);
            const codeMatch = safeIncludes(product.product_code);
            const categoryMatch = safeIncludes(product.category_name);
            const supplierMatch = safeIncludes(product.supplier_name);
            const detailsMatch = safeIncludes(product.details);
            
            return nameMatch || codeMatch || categoryMatch || supplierMatch || detailsMatch;
          });
          setSearchResults(localResults);
        } else {
          // Even for backend results, apply additional client-side filtering to ensure relevancy
          const filteredResults = results.filter((product: Product) => {
            const search = query.toLowerCase().trim();
            if (search.length < 1) return false;
            
            const safeIncludes = (field: string | null | undefined) => {
              return field && 
                     field.toString().trim().length > 0 && 
                     field.toString().toLowerCase().includes(search);
            };
            
            return (
              safeIncludes(product.name) ||
              safeIncludes(product.product_code) ||
              safeIncludes(product.category_name) ||
              safeIncludes(product.supplier_name) ||
              safeIncludes(product.details)
            );
          });
          setSearchResults(filteredResults);
        }
      } catch (error) {
        console.error("Error searching products:", error);
        // Fallback to local search on error with strict filtering
        const localResults = products.filter((product) => {
          const search = query.toLowerCase().trim();
          
          // Only proceed if search query has meaningful content
          if (search.length < 1) return false;
          
          const safeIncludes = (field: string | null | undefined) => {
            return field && 
                   field.toString().trim().length > 0 && 
                   field.toString().toLowerCase().includes(search);
          };
          
          // Check each field explicitly and return true only if there's a match
          const nameMatch = safeIncludes(product.name);
          const codeMatch = safeIncludes(product.product_code);
          const categoryMatch = safeIncludes(product.category_name);
          const supplierMatch = safeIncludes(product.supplier_name);
          const detailsMatch = safeIncludes(product.details);
          
          return nameMatch || codeMatch || categoryMatch || supplierMatch || detailsMatch;
        });
        setSearchResults(localResults);
      } finally {
        setIsSearchingProducts(false);
        // Mark that search is complete, keep actively typing flag for focus restoration
      }
    },
    [products]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        // Search if query has content (removed the actively typing check to make it more responsive)
        if (query.trim().length >= 1) {
          searchProducts(query);
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
        try {
          productSearchInputRef.current.focus();
          // Reset typing flag after focusing for fresh start
          isActivelyTypingRef.current = false;
        } catch (error) {
          // Silently handle focus errors
          console.log("Focus restoration after clear skipped");
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
        setError("Product not found. Please try searching again.");
        return;
      }
      
      // If product was found in search results but not in main products array,
      // add it to the main products array for future reference
      if (!productFromMain && productFromSearch) {
        setProducts(prev => [...prev, productFromSearch]);
      }

      // Check stock availability - skip for products that don't require stock tracking
      let availableStock = 0;
      const requestedQuantity = 1; // Default quantity when clicking on product

      if (productToAdd.has_variants) {
        // For products with variants, we'll use the first available variant
        const firstVariant = productToAdd.variants?.[0];
        if (firstVariant) {
          availableStock = firstVariant.stock || 0;
        }
      } else {
        availableStock = productToAdd.stock || 0;
      }

      // Only check stock if the product requires stock tracking
      const requiresStockTracking = !productToAdd.no_stock_required;
      if (requiresStockTracking && availableStock <= 0) {
        setError("Product is out of stock");
        setProductSearch("");
        setIsProductDropdownOpen(false);
        return;
      }

      // Check if the same product already exists in the order
      const existingItemIndex = orderForm.items.findIndex(
        (item) => item.product === parseInt(productId) && 
        (!productToAdd.has_variants || item.variant === productToAdd.variants?.[0]?.id)
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingItem = orderForm.items[existingItemIndex];
        const newQuantity = existingItem.quantity + requestedQuantity;

        // Only check stock limits if the product requires stock tracking
        if (requiresStockTracking && newQuantity > availableStock) {
          setError(
            `Cannot add more. Maximum available: ${
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

        if (productToAdd.has_variants && productToAdd.variants?.[0]) {
          selectedVariant = productToAdd.variants[0];
          unitPrice = selectedVariant.sell_price || 0;
          buyPrice = selectedVariant.buy_price || 0;
        } else {
          unitPrice = productToAdd.sell_price || 0;
          buyPrice = productToAdd.buy_price || 0;
        }

        const item: OrderItem = {
          id: Date.now().toString(),
          product: parseInt(productId),
          variant: selectedVariant?.id,
          quantity: requestedQuantity,
          unit_price: unitPrice,
          buy_price: buyPrice,
          total: requestedQuantity * unitPrice,
          product_name: productToAdd.name,
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
            console.log("Focus restoration after selection skipped");
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
      console.log("Fetching customers from API...");
      const response = await ApiService.getCustomers();
      console.log("Customer API response:", response);
      const customers = Array.isArray(response)
        ? response
        : response?.results || [];
      console.log("Processed customers:", customers);
      console.log("Number of customers found:", customers.length);

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
      console.log("Customers set to state with due amounts:", customersWithDue);
      console.log("Customers state length after set:", customersWithDue.length);
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
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
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
          `A customer with this ${field} already exists: ${existingCustomer.name}. You may want to select them from existing customers instead, or use a different ${field}.`
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

      let customerId = selectedCustomerId;

      // If this is a new customer (guest), create the customer first
      if (customerType === "guest" && !selectedCustomerId) {
        console.log("Creating new customer...");
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
          console.log("New customer created:", newCustomer);
        } catch (customerError) {
          console.error("Error creating customer:", customerError);
          // If customer creation fails, we can still proceed with the order as guest
          console.log(
            "Proceeding with guest order due to customer creation error"
          );
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
      console.log("Order created successfully:", response);

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

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch.trim()) return true;
    const search = customerSearch.toLowerCase();
    const matches =
      customer.name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.includes(search);

    // Debug logging
    if (customerSearch.trim().length >= 2) {
      console.log(
        `Filtering customer: ${customer.name}, Search: "${search}", Matches: ${matches}`
      );
      console.log(
        `Customer details: name="${customer.name}", email="${customer.email}", phone="${customer.phone}"`
      );
    }

    return matches;
  });

  // Debug the filtered results
  if (customerSearch.trim().length >= 2) {
    console.log(
      `Total customers: ${customers.length}, Filtered: ${filteredCustomers.length}, Search term: "${customerSearch}"`
    );
  }

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
          className="bg-yellow-500/30 text-yellow-200 font-medium"
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
        /* Cursor styles for better UX */
        input, textarea, select {
          cursor: text !important;
        }
        button, .clickable, [role="button"] {
          cursor: pointer !important;
        }
        input[type="checkbox"], input[type="radio"] {
          cursor: pointer !important;
        }
        .dropdown-item, .dropdown-option {
          cursor: pointer !important;
        }
        input:disabled, textarea:disabled, select:disabled {
          cursor: not-allowed !important;
        }
        button:disabled {
          cursor: not-allowed !important;
        }
        /* Ensure body and html have dark background */
        body {
          background-color: rgb(15, 23, 42) !important; /* slate-900 equivalent */
        }
        /* When dropdown is open, ensure page height is adequate */
        .dropdown-page {
          min-height: calc(100vh + 400px);
        }
      `}</style>
      <div className={`min-h-screen bg-slate-900 ${isProductDropdownOpen ? 'dropdown-page' : ''}`}>
        <div className="sm:p-6 p-1 space-y-6">
          <div className="max-w-7xl">
            {/* Page Header */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer Info & Items */}
            <div className="lg:col-span-2 space-y-6 overflow-visible">
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
                            placeholder="Search and select customer (minimum 2 characters)..."
                            value={customerSearch}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              // Only open dropdown if user has typed at least 2 characters
                              if (e.target.value.trim().length >= 2) {
                                setIsCustomerDropdownOpen(true);
                              } else {
                                setIsCustomerDropdownOpen(false);
                              }
                            }}
                            onFocus={() => {
                              // Only open dropdown on focus if user has already typed at least 2 characters
                              if (customerSearch.trim().length >= 2) {
                                setIsCustomerDropdownOpen(true);
                              }
                            }}
                            disabled={customerType === "guest"}
                            className={`w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 pr-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              customerType === "guest"
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-text"
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
                        {isCustomerDropdownOpen &&
                          customerSearch.trim().length >= 2 && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                              {isLoadingCustomers ? (
                                <div className="p-3 text-slate-400">
                                  Loading customers...
                                </div>
                              ) : filteredCustomers.length > 0 ? (
                                filteredCustomers
                                  .slice(0, 10)
                                  .map((customer) => (
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
                              {/* Show indicator when there are more than 10 results */}
                              {filteredCustomers.length > 10 && (
                                <div className="p-2 text-xs text-slate-500 bg-slate-700/30 border-t border-slate-600/50 text-center">
                                  Showing 10 of {filteredCustomers.length}{" "}
                                  results. Type more to refine search.
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
                            className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2 rounded cursor-pointer"
                          />
                          <span className="text-sm text-slate-300">New Customer</span>
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
                                A customer with this {duplicateField || 'field'} already exists: {' '}
                                <button
                                  type="button"
                                  onClick={handleSelectMatchedCustomer}
                                  className="text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors duration-200"
                                >
                                  {matchedCustomer?.name}
                                </button>
                                . You may want to select them from existing customers instead, or use a different {duplicateField || 'field'}. You can still proceed
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
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text"
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
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text"
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
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text"
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
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text"
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
                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text"
                            placeholder="Customer address (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg overflow-visible">
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
                        <div className="grid grid-cols-5 gap-4 pb-2 border-b border-slate-700/30 mb-2">
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Product
                          </div>
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                            Quantity
                          </div>
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                            Buy Price
                          </div>
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                            Sell Price
                          </div>
                          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">
                            Total
                          </div>
                        </div>

                        <div className="space-y-2">
                          {orderForm.items.map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-5 gap-4 items-center py-3 px-2 hover:bg-slate-800/20 rounded-lg transition-colors"
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
                                  disabled={!canIncreaseQuantity(item)}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors text-xs ${
                                    canIncreaseQuantity(item)
                                      ? "bg-slate-700/50 text-slate-300 hover:bg-slate-600 cursor-pointer"
                                      : "bg-slate-800/30 text-slate-500 cursor-not-allowed"
                                  }`}
                                  title={
                                    canIncreaseQuantity(item)
                                      ? "Increase quantity"
                                      : "Maximum stock reached"
                                  }
                                >
                                  +
                                </button>
                              </div>

                              {/* Buy Price */}
                              <div className="text-center">
                                <div className="text-sm text-slate-300">
                                  {formatCurrency(item.buy_price || 0)}
                                </div>
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
                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                        <p className="text-red-400">{error}</p>
                      </div>
                    )}

                    <h4 className="text-sm font-medium text-slate-300 mb-3">
                      Add New Item
                    </h4>
                    
                    <div className="space-y-4 pb-20">
                      {/* Product Search Row */}
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 md:flex-[2] relative">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Product Search (Click product name to add to order)
                          </label>
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
                      <span className="text-slate-100 text-sm">
                        {formatCurrency(orderForm.subtotal)}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Discount:</span>
                      <div className="flex items-center gap-2">
                        {/* Discount Type Toggle */}
                        <div className="flex items-center gap-1 mr-2">
                          <button
                            type="button"
                            onClick={() => setOrderForm(prev => ({ 
                              ...prev, 
                              discount_type: "percentage",
                              discount_flat_amount: 0 // Reset flat amount when switching
                            }))}
                            className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                              orderForm.discount_type === "percentage"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50"
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderForm(prev => ({ 
                              ...prev, 
                              discount_type: "flat",
                              discount_percentage: 0 // Reset percentage when switching
                            }))}
                            className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                              orderForm.discount_type === "flat"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50"
                            }`}
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
                              className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder=""
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <span className="text-slate-400 text-sm">%</span>
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
                              className="w-20 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                            <span className="text-slate-400 text-sm">{currencySymbol}</span>
                          </>
                        )}
                        
                        <span className="text-slate-100 text-sm">
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
                          className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                        <span className="text-slate-100 text-sm">
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
                          className="w-16 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">{currencySymbol}</span>
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
                                className="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                              <span className="text-slate-300 text-sm">
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
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 pr-20 text-sm transition-all duration-200"
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
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 placeholder:text-sm rounded-lg py-2 px-3 text-sm transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                <span className="text-sm text-slate-300">
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
    </div>
    </>
  );
}
