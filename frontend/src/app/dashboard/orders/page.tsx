"use client";

import OrdersControls from "@/components/orders/OrdersControls";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrdersList from "@/components/orders/OrdersList";
import OrdersStats from "@/components/orders/OrdersStats";
import SmsComposer from "@/components/sms/SmsComposer";
import Pagination from "@/components/ui/Pagination";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { calculateSmsSegments } from "@/lib/utils/sms";
import { Order, OrderItem } from "@/types/order";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Define interface for product sales summary
interface ProductSale {
  id: number;
  product_id?: number;
  variant_id?: number;
  product_name: string;
  variant_display?: string;
  total_quantity: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
  last_sold: string;
  last_sold_customer?: string;
  stock_remaining?: number;
  available_stock?: number;
  avg_unit_price: number;
  avg_buy_price: number;
  total_buy_price: number; // To track total for calculating average
  sales_count: number;
}

export default function OrdersPage() {
  console.log("OrdersPage main component re-rendered");
  const router = useRouter();
  const searchParams = useSearchParams();
  const formatCurrency = useCurrencyFormatter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  
  // Orders tab state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(""); // For immediate UI updates
  const [searchTerm, setSearchTerm] = useState(""); // For debounced API calls
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isNavigating, setIsNavigating] = useState(false);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState<number | null>(null); // Track which order is sending SMS
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsOrder, setSmsOrder] = useState<Order | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [userProfile, setUserProfile] = useState<{
    user?: { email?: string };
    profile?: {
      company?: string;
      company_address?: string;
      phone?: string;
      contact_number?: string;
      store_logo?: string;
    };
  } | null>(null);

  // Products tab state
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSortBy, setProductSortBy] = useState("last_sold");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  
  // Product pagination state
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(50);
  const [productTotalItems, setProductTotalItems] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);

  // Date filter state for Excel export
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportPreset, setExportPreset] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Overall statistics (not affected by search/filter)
  const [overallStats, setOverallStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    todaysOrders: 0,
    todaysRevenue: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Debounce product search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setProductSearchTerm(productSearchInput);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [productSearchInput]);

  // Handle success message from edit page
  useEffect(() => {
    const updated = searchParams.get("updated");
    if (updated === "true") {
      setSuccessMessage("Order updated successfully!");
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("updated");
      window.history.replaceState({}, "", url.toString());

      // Clear message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      // Show appropriate loading state
      if (currentPage === 1 && !searchTerm && filterCustomer === "all") {
        setIsLoading(true);
      } else {
        setIsSearching(true);
      }
      setError(null);

      // Build search parameters
      const params: {
        page: number;
        page_size: number;
        search?: string;
        customer?: string;
        ordering?: string;
      } = {
        page: currentPage,
        page_size: pageSize,
      };

      // Add search if exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add customer filter if not "all"
      if (filterCustomer !== "all") {
        params.customer = filterCustomer;
      }

      // Add ordering
      if (sortBy) {
        switch (sortBy) {
          case "date":
            params.ordering = "-sale_date";
            break;
          case "product":
            params.ordering = "product_name";
            break;
          case "customer":
            params.ordering = "customer_name";
            break;
          case "amount-high":
            params.ordering = "-total_amount";
            break;
          case "amount-low":
            params.ordering = "total_amount";
            break;
          case "quantity-high":
            params.ordering = "-quantity";
            break;
          case "quantity-low":
            params.ordering = "quantity";
            break;
          default:
            params.ordering = "-sale_date";
        }
      }

      const ordersData = await ApiService.getProductSalesWithPagination(params);

      // Handle paginated response
      if (
        ordersData &&
        typeof ordersData === "object" &&
        "results" in ordersData
      ) {
        // Backend returned paginated data
        setOrders(ordersData.results || []);
        setTotalItems(ordersData.count || 0);
        setTotalPages(Math.ceil((ordersData.count || 0) / pageSize));
      } else {
        // Handle non-paginated response (fallback)
        const ordersList = Array.isArray(ordersData) ? ordersData : [];
        setOrders(ordersList);
        setTotalItems(ordersList.length);
        setTotalPages(Math.ceil(ordersList.length / pageSize));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, pageSize, searchTerm, filterCustomer, sortBy]);

  // Fetch product sales summary
  const fetchProductSales = useCallback(async () => {
    try {
      if (activeTab !== "products") return; // Only fetch when on products tab
      
      setIsSearchingProducts(true);
      if (productCurrentPage === 1 && productSales.length === 0) {
        setIsLoadingProducts(true);
      }

      // Since product-summary endpoint doesn't exist, we'll fetch all sales
      // and process them locally to create the product summary
      const params: any = {
        page_size: 1000, // Get a large number to process locally
        ordering: "-sale_date", // Get latest sales first
      };

      const response = await ApiService.getProductSalesWithPagination(params);
      
      // Process the orders/sales to create product summary
      let allOrders: Order[] = [];
      
      if (response && typeof response === "object" && "results" in response) {
        allOrders = response.results || [];
      } else if (Array.isArray(response)) {
        allOrders = response;
      }

      // Create product summary from orders
      const productSummaryMap = new Map<string, ProductSale>();
      
      allOrders.forEach((order: Order) => {
        if (order.items && order.items.length > 0) {
          // Process orders with items
          order.items.forEach((item: any) => {
            const variantInfo = item.variant_details || '';
            const key = `${item.product_name || 'Unknown'}-${variantInfo}`;
            const existing = productSummaryMap.get(key);
            
            if (existing) {
              existing.total_quantity += item.quantity || 0;
              existing.total_revenue += item.total_price || 0;
              existing.total_profit += (item.total_price || 0) - ((item.buy_price || 0) * (item.quantity || 0));
              existing.total_buy_price += (item.buy_price || 0) * (item.quantity || 0);
              existing.sales_count += 1;
              if (new Date(order.sale_date) > new Date(existing.last_sold)) {
                existing.last_sold = order.sale_date;
                existing.last_sold_customer = order.customer_name || 'Unknown Customer';
              }
            } else {
              const totalPrice = item.total_price || 0;
              const buyPrice = (item.buy_price || 0) * (item.quantity || 0);
              const profit = totalPrice - buyPrice;
              
              productSummaryMap.set(key, {
                id: Math.random(), // Temporary ID
                product_id: item.product?.id || item.product,
                variant_id: item.variant_id || item.variant,
                product_name: item.product_name || 'Unknown Product',
                variant_display: variantInfo,
                total_quantity: item.quantity || 0,
                total_revenue: totalPrice,
                total_profit: profit,
                profit_margin: totalPrice > 0 ? (profit / totalPrice) * 100 : 0,
                last_sold: order.sale_date,
                last_sold_customer: order.customer_name || 'Unknown Customer',
                avg_unit_price: item.unit_price || 0,
                avg_buy_price: item.buy_price || 0,
                total_buy_price: buyPrice,
                sales_count: 1,
                stock_remaining: undefined, // We don't have this data
                available_stock: undefined, // We don't have this data
              });
            }
          });
        } else {
          // Process legacy single-product orders
          const variantInfo = order.variant ? `${order.variant.color || ''} ${order.variant.size || ''} ${order.variant.custom_variant || ''}`.trim() : '';
          const key = `${order.product_name || 'Unknown'}-${variantInfo}`;
          const existing = productSummaryMap.get(key);
          
          const profit = (order.total_amount || 0) - ((order.buy_price || 0) * (order.quantity || 0));
          
          if (existing) {
            existing.total_quantity += order.quantity || 0;
            existing.total_revenue += order.total_amount || 0;
            existing.total_profit += profit;
            existing.total_buy_price += (order.buy_price || 0) * (order.quantity || 0);
            existing.sales_count += 1;
            if (new Date(order.sale_date) > new Date(existing.last_sold)) {
              existing.last_sold = order.sale_date;
              existing.last_sold_customer = order.customer_name || 'Unknown Customer';
            }
          } else {
            productSummaryMap.set(key, {
              id: order.id,
              product_id: order.product?.id,
              variant_id: order.variant?.id,
              product_name: order.product_name || 'Unknown Product',
              variant_display: variantInfo || undefined,
              total_quantity: order.quantity || 0,
              total_revenue: order.total_amount || 0,
              total_profit: profit,
              profit_margin: (order.total_amount || 0) > 0 ? (profit / (order.total_amount || 0)) * 100 : 0,
              last_sold: order.sale_date,
              avg_unit_price: order.unit_price || 0,
              avg_buy_price: order.buy_price || 0,
              total_buy_price: (order.buy_price || 0) * (order.quantity || 0),
              sales_count: 1,
              stock_remaining: undefined,
              available_stock: undefined,
            });
          }
        }
      });

      // Fetch product details to get stock information
      const productIds = new Set<number>();
      productSummaryMap.forEach(product => {
        if (product.product_id) {
          productIds.add(product.product_id);
        }
      });

      const stockMap = new Map<string, number>();
      try {
        for (const productId of productIds) {
          const productResponse = await ApiService.get(`/products/${productId}/`);
          if (productResponse && typeof productResponse === 'object') {
            const product = productResponse as any;
            
            // Store stock for different variants
            if (product.has_variants && product.variants) {
              product.variants.forEach((variant: any) => {
                const variantKey = `${product.id}-${variant.id}`;
                stockMap.set(variantKey, variant.stock || 0);
              });
            } else {
              // Single product without variants
              stockMap.set(`${product.id}`, product.stock || 0);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product stock:", error);
      }

      // Convert map to array and calculate final values with stock information
      let salesData = Array.from(productSummaryMap.values()).map(product => {
        let availableStock = 0;
        
        if (product.variant_id && product.product_id) {
          // Product with variant
          const variantKey = `${product.product_id}-${product.variant_id}`;
          availableStock = stockMap.get(variantKey) || 0;
        } else if (product.product_id) {
          // Single product
          availableStock = stockMap.get(`${product.product_id}`) || 0;
        }
        
        return {
          ...product,
          avg_unit_price: product.total_quantity > 0 ? product.total_revenue / product.total_quantity : 0,
          avg_buy_price: product.total_quantity > 0 ? product.total_buy_price / product.total_quantity : 0,
          profit_margin: product.total_revenue > 0 ? (product.total_profit / product.total_revenue) * 100 : 0,
          available_stock: availableStock,
        };
      });

      // Apply search filter if exists
      if (productSearchTerm.trim()) {
        const searchLower = productSearchTerm.toLowerCase();
        salesData = salesData.filter(product => 
          product.product_name.toLowerCase().includes(searchLower) ||
          (product.variant_display && product.variant_display.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      salesData.sort((a, b) => {
        switch (productSortBy) {
          case "total_quantity":
            return b.total_quantity - a.total_quantity;
          case "total_profit":
            return b.total_profit - a.total_profit;
          case "profit_margin":
            return b.profit_margin - a.profit_margin;
          case "last_sold":
            return new Date(b.last_sold).getTime() - new Date(a.last_sold).getTime();
          case "product_name":
            return a.product_name.localeCompare(b.product_name);
          default:
            return b.total_quantity - a.total_quantity;
        }
      });

      // Apply pagination
      const totalItems = salesData.length;
      const startIndex = (productCurrentPage - 1) * productPageSize;
      const endIndex = startIndex + productPageSize;
      const paginatedData = salesData.slice(startIndex, endIndex);

      setProductSales(paginatedData);
      setProductTotalItems(totalItems);
      setProductTotalPages(Math.ceil(totalItems / productPageSize));
    } catch (error) {
      console.error("Error fetching product sales:", error);
      setProductSales([]);
      setProductTotalItems(0);
      setProductTotalPages(0);
    } finally {
      setIsLoadingProducts(false);
      setIsSearchingProducts(false);
    }
  }, [activeTab, productCurrentPage, productPageSize, productSearchTerm, productSortBy]);

  // Fetch product sales when dependencies change
  useEffect(() => {
    if (activeTab === "products") {
      fetchProductSales();
    }
  }, [fetchProductSales]);

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCustomer]);

  // Reset product page when search or sort changes
  useEffect(() => {
    setProductCurrentPage(1);
  }, [productSearchTerm, productSortBy]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log("User profile data:", profile); // Debug log
      console.log("Store logo URL:", profile?.profile?.store_logo); // Debug log for logo
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  const fetchOverallStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      // Fetch stats from dedicated endpoint
      const statsData = await ApiService.getOrderStats();

      setOverallStats({
        totalOrders: statsData.totalOrders || 0,
        totalRevenue: statsData.totalRevenue || 0,
        totalProfit: statsData.totalProfit || 0,
        todaysOrders: statsData.todaysOrders || 0,
        todaysRevenue: statsData.todaysRevenue || 0,
      });
    } catch (error) {
      console.error("Error fetching overall statistics:", error);
      setOverallStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        todaysOrders: 0,
        todaysRevenue: 0,
      });
    } finally {
      setIsStatsLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount

  // Fetch user profile and stats only once on mount
  useEffect(() => {
    fetchUserProfile();
    fetchOverallStats();
  }, [fetchUserProfile, fetchOverallStats]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleAddOrder = useCallback(() => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push("/dashboard/orders/add");
    }, 300);
  }, [router]);

  const handleOrderClick = useCallback((order: Order) => {
    // TODO: Navigate to order details page
    console.log("Order clicked:", order);
  }, []);

  const handleCustomerClick = useCallback(
    async (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event

      if (!order.customer_name && !order.customer_phone) {
        alert("No customer information available");
        return;
      }

      try {
        // Look up customer by name and phone to get customer ID
        const customers = await ApiService.getCustomers();
        const customer = customers.find((c: any) => {
          const nameMatch =
            c.name?.toLowerCase().trim() ===
            order.customer_name?.toLowerCase().trim();
          const phoneMatch = c.phone === order.customer_phone;
          return nameMatch || phoneMatch;
        });

        if (customer) {
          // Navigate to customer details page
          setIsNavigating(true);
          setTimeout(() => {
            router.push(`/dashboard/customers/${customer.id}`);
          }, 300);
        } else {
          alert("Customer not found in the system");
        }
      } catch (error) {
        console.error("Error finding customer:", error);
        alert("Failed to lookup customer information");
      }
    },
    [router]
  );

  const handleEditInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      router.push(`/dashboard/orders/edit/${order.id}`);
    },
    [router]
  );

  const handleViewInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      setSelectedOrder(order);
      setShowInvoicePopup(true);
    },
    []
  );

  const handlePrintInvoice = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      // Open invoice popup first, then user can print from there
      handleViewInvoice(order, event);
    },
    [handleViewInvoice]
  );

  const handleDeleteOrder = useCallback(
    (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event
      setOrderToDelete(order);
      setShowDeleteConfirm(true);
    },
    []
  );

  const handleSendSms = useCallback(
    async (order: Order, event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent order click event

      if (!order.customer_phone) {
        alert("No phone number available for this customer");
        return;
      }

      if (!userProfile?.profile?.company) {
        alert("Store name not found in profile");
        return;
      }

      try {
        // Get customer financial details
        let dueAmount = 0;
        let advanceAmount = 0;
        console.log(
          "Fetching customer financial details for:",
          order.customer_name,
          order.customer_phone
        );

        if (order.customer_name && order.customer_phone) {
          try {
            // Try to get customer due amount from backend
            const customers = await ApiService.getCustomers();
            console.log("All customers:", customers);

            const customer = customers.find((c: any) => {
              const nameMatch =
                c.name?.toLowerCase().trim() ===
                order.customer_name?.toLowerCase().trim();
              const phoneMatch = c.phone === order.customer_phone;
              return nameMatch || phoneMatch;
            });

            console.log("Found customer:", customer);

            if (customer) {
              // Use the customer summary endpoint to get financial details
              const response = await ApiService.get(
                `/customers/${customer.id}/summary/`
              );
              console.log("Customer summary response:", response);

              // Get the financial summary
              const financialSummary = response.financial_summary || {};

              // Log all financial data for debugging
              console.log("Financial summary:", financialSummary);
              console.log("Total due:", financialSummary.total_due);
              console.log("Total advance:", financialSummary.total_advance);
              console.log("Net amount:", financialSummary.net_amount);

              // Calculate net balance - positive means customer owes money (due), negative means customer has credit (advance)
              let netBalance = 0;

              if (
                financialSummary.net_amount !== undefined &&
                financialSummary.net_amount !== null
              ) {
                netBalance = parseFloat(financialSummary.net_amount);
              } else if (
                financialSummary.total_due !== undefined &&
                financialSummary.total_advance !== undefined
              ) {
                netBalance =
                  parseFloat(financialSummary.total_due || 0) -
                  parseFloat(financialSummary.total_advance || 0);
              }

              console.log("Calculated net balance:", netBalance);

              // Determine financial state based on net balance
              if (netBalance > 0) {
                dueAmount = netBalance;
                advanceAmount = 0;
                console.log("Customer has due amount:", dueAmount);
              } else if (netBalance < 0) {
                dueAmount = 0;
                advanceAmount = Math.abs(netBalance);
                console.log("Customer has advance amount:", advanceAmount);
              } else {
                dueAmount = 0;
                advanceAmount = 0;
                console.log("Customer has no due or advance amount");
              }
            } else {
              console.log("Customer not found in database");

              // Check if the order itself has due amount information
              if (order.remaining_balance && order.remaining_balance > 0) {
                dueAmount = order.remaining_balance;
                console.log("Using order remaining balance as due:", dueAmount);
              } else if (order.due_amount && order.due_amount > 0) {
                dueAmount = order.due_amount;
                console.log("Using order due amount:", dueAmount);
              }
            }
          } catch (error) {
            console.log("Error fetching customer financial details:", error);

            // Fallback: check order's due amount fields
            if (order.remaining_balance && order.remaining_balance > 0) {
              dueAmount = order.remaining_balance;
            } else if (order.due_amount && order.due_amount > 0) {
              dueAmount = order.due_amount;
            }
          }
        }

        // Format the SMS message
        const storeName = userProfile.profile.company;
        const amount = formatCurrency(order.total_amount);

        let message = `সম্মানিত কাস্টমার, আপনার কেনাকাটা ${amount} টাকা, ${storeName} এ কেনাকাটা করার জন্য আপনাকে ধন্যবাদ!`;

        // Add due message only if customer has due money (greater than 0)
        console.log("Final due amount to check:", dueAmount);
        console.log("Final advance amount to check:", advanceAmount);

        if (dueAmount > 0) {
          const dueAmountFormatted = formatCurrency(dueAmount);
          message += ` আমাদের খাতায় আপনার বাকি রয়েছে ${dueAmountFormatted} টাকা`;
          console.log("Added due message to SMS");
        } else if (advanceAmount > 0) {
          const advanceAmountFormatted = formatCurrency(advanceAmount);
          message += ` আমাদের খাতায় আপনার এডভান্স করা রয়েছে ${advanceAmountFormatted} টাকা`;
          console.log("Added advance message to SMS");
        }
        // If neither due nor advance, send only the basic thank you message

        console.log("Final SMS message:", message);

        // Set the message and show composer
        setSmsMessage(message);
        setSmsOrder(order);
        setShowSmsComposer(true);
      } catch (error) {
        console.error("Error preparing SMS:", error);
        alert("Failed to prepare SMS. Please try again.");
      }
    },
    [formatCurrency, userProfile]
  );

  // Handle actual SMS sending from composer
  const handleSendSmsFromComposer = useCallback(
    async (message: string) => {
      if (!smsOrder || !smsOrder.customer_phone) return;

      try {
        // Set loading state for this specific order
        setIsSendingSms(smsOrder.id);

        // Send SMS
        console.log(
          "Sending SMS to:",
          smsOrder.customer_phone,
          "Message:",
          message
        );
        const response = await ApiService.sendSmsNotification(
          smsOrder.customer_phone,
          message
        );
        console.log("SMS Response:", response);

        // Check if the response indicates success
        if (response.success === false) {
          throw new Error(response.error || "SMS sending failed");
        }

        // Use actual credits used from backend response, fallback to frontend calculation
        const creditsUsed =
          response.credits_used || calculateSmsSegments(message).segments;
        alert(
          `SMS sent successfully! Used ${creditsUsed} SMS credit${
            creditsUsed > 1 ? "s" : ""
          }.`
        );

        // Close composer
        setShowSmsComposer(false);
        setSmsOrder(null);
        setSmsMessage("");
      } catch (error) {
        console.error("Error sending SMS:", error);

        // Show more detailed error message
        let errorMessage = "Failed to send SMS. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "error" in error
        ) {
          errorMessage = (error as any).error;
        }

        alert(`SMS Error: ${errorMessage}`);
      } finally {
        // Clear loading state
        setIsSendingSms(null);
      }
    },
    [smsOrder]
  );

  // Handle SMS composer cancel
  const handleCancelSms = useCallback(() => {
    setShowSmsComposer(false);
    setSmsOrder(null);
    setSmsMessage("");
  }, []);

  // Memoized state setters
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterCustomer(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  // Product tab handlers
  const handleProductSearchChange = useCallback((value: string) => {
    setProductSearchInput(value);
  }, []);

  const handleProductSortChange = useCallback((value: string) => {
    setProductSortBy(value);
  }, []);

  const handleTabChange = useCallback((tab: "orders" | "products") => {
    setActiveTab(tab);
  }, []);

  // Handle product name click navigation
  const handleProductClick = useCallback((productId?: number) => {
    if (productId) {
      router.push(`/dashboard/products/${productId}`);
    }
  }, [router]);

  // Product pagination handlers
  const handleProductPageChange = useCallback((page: number) => {
    setProductCurrentPage(page);
  }, []);

  const handleProductPageSizeChange = useCallback((newPageSize: number) => {
    setProductPageSize(newPageSize);
    setProductCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Excel export functionality
  const exportToExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      console.log("Starting export with dates:", exportStartDate, exportEndDate);
      
      // Fetch product sales data with date filtering
      const params: any = {
        page_size: 1000, // Get all data for export
        ordering: "-created_at", // Use created_at for ordering
      };

      if (exportStartDate) {
        params.start_date = exportStartDate;
        console.log("Added start_date:", exportStartDate);
      }
      if (exportEndDate) {
        params.end_date = exportEndDate;
        console.log("Added end_date:", exportEndDate);
      }

      console.log("Export API params:", params);
      const response = await ApiService.getProductSalesWithPagination(params);
      console.log("Export API response:", response);
      
      let allOrders: Order[] = [];
      if (response && typeof response === "object" && "results" in response) {
        allOrders = response.results || [];
      } else if (Array.isArray(response)) {
        allOrders = response;
      } else {
        console.error("Unexpected response format:", response);
        throw new Error("Invalid response format from API");
      }

      console.log("Processing", allOrders.length, "orders for export");

      if (allOrders.length === 0) {
        alert("No data found for the selected date range");
        return;
      }

      // Process data similar to fetchProductSales
      const productSummaryMap = new Map<string, ProductSale>();
      
      allOrders.forEach((order: Order) => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item: any) => {
            const variantInfo = item.variant_details || '';
            const key = `${item.product_name || 'Unknown'}-${variantInfo}`;
            const existing = productSummaryMap.get(key);
            
            if (existing) {
              existing.total_quantity += item.quantity || 0;
              existing.total_revenue += item.total_price || 0;
              existing.total_profit += (item.total_price || 0) - ((item.buy_price || 0) * (item.quantity || 0));
              existing.total_buy_price += (item.buy_price || 0) * (item.quantity || 0);
              existing.sales_count += 1;
              if (new Date(order.sale_date) > new Date(existing.last_sold)) {
                existing.last_sold = order.sale_date;
              }
            } else {
              const totalPrice = item.total_price || 0;
              const buyPrice = (item.buy_price || 0) * (item.quantity || 0);
              const profit = totalPrice - buyPrice;
              
              productSummaryMap.set(key, {
                id: Math.random(),
                product_name: item.product_name || 'Unknown Product',
                variant_display: variantInfo,
                total_quantity: item.quantity || 0,
                total_revenue: totalPrice,
                total_profit: profit,
                profit_margin: totalPrice > 0 ? (profit / totalPrice) * 100 : 0,
                last_sold: order.sale_date,
                avg_unit_price: item.unit_price || 0,
                avg_buy_price: item.buy_price || 0,
                total_buy_price: buyPrice,
                sales_count: 1,
                stock_remaining: undefined,
                available_stock: undefined,
              });
            }
          });
        } else {
          // Process legacy orders
          const variantInfo = order.variant ? `${order.variant.color || ''} ${order.variant.size || ''} ${order.variant.custom_variant || ''}`.trim() : '';
          const key = `${order.product_name || 'Unknown'}-${variantInfo}`;
          const existing = productSummaryMap.get(key);
          
          const profit = (order.total_amount || 0) - ((order.buy_price || 0) * (order.quantity || 0));
          
          if (existing) {
            existing.total_quantity += order.quantity || 0;
            existing.total_revenue += order.total_amount || 0;
            existing.total_profit += profit;
            existing.total_buy_price += (order.buy_price || 0) * (order.quantity || 0);
            existing.sales_count += 1;
            if (new Date(order.sale_date) > new Date(existing.last_sold)) {
              existing.last_sold = order.sale_date;
            }
          } else {
            productSummaryMap.set(key, {
              id: order.id,
              product_name: order.product_name || 'Unknown Product',
              variant_display: variantInfo || undefined,
              total_quantity: order.quantity || 0,
              total_revenue: order.total_amount || 0,
              total_profit: profit,
              profit_margin: (order.total_amount || 0) > 0 ? (profit / (order.total_amount || 0)) * 100 : 0,
              last_sold: order.sale_date,
              avg_unit_price: order.unit_price || 0,
              avg_buy_price: order.buy_price || 0,
              total_buy_price: (order.buy_price || 0) * (order.quantity || 0),
              sales_count: 1,
              stock_remaining: undefined,
              available_stock: undefined,
            });
          }
        }
      });

      // Calculate final averages
      const salesData = Array.from(productSummaryMap.values()).map(product => ({
        ...product,
        avg_unit_price: product.total_quantity > 0 ? product.total_revenue / product.total_quantity : 0,
        avg_buy_price: product.total_quantity > 0 ? product.total_buy_price / product.total_quantity : 0,
        profit_margin: product.total_revenue > 0 ? (product.total_profit / product.total_revenue) * 100 : 0,
      }));

      // Create Excel data
      const excelData = salesData.map(product => ({
        'Product Name': product.product_name,
        'Variant': product.variant_display || '',
        'Total Sold': product.total_quantity,
        'Sell Price': product.avg_unit_price.toFixed(2),
        'Buy Price': product.avg_buy_price.toFixed(2),
        'Total Revenue': product.total_revenue.toFixed(2),
        'Total Profit': product.total_profit.toFixed(2),
        'Profit Margin (%)': product.profit_margin.toFixed(2),
        'Last Sold': new Date(product.last_sold).toLocaleDateString(),
      }));

      // Convert to CSV and download
      const csvContent = convertToCSV(excelData);
      if (!csvContent) {
        throw new Error("Failed to generate CSV content");
      }
      
      downloadCSV(csvContent, `product-sales-${exportStartDate || 'all'}-to-${exportEndDate || 'now'}.csv`);
      console.log("Export completed successfully");
      
      setShowExportDialog(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  }, [exportStartDate, exportEndDate]);

  // Handle preset date selection
  const handlePresetChange = (preset: string) => {
    setExportPreset(preset);
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (preset) {
      case "today":
        setExportStartDate(formatDate(today));
        setExportEndDate(formatDate(today));
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setExportStartDate(formatDate(yesterday));
        setExportEndDate(formatDate(yesterday));
        break;
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setExportStartDate(formatDate(startOfWeek));
        setExportEndDate(formatDate(today));
        break;
      case "last_week":
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
        setExportStartDate(formatDate(lastWeekStart));
        setExportEndDate(formatDate(lastWeekEnd));
        break;
      case "this_month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setExportStartDate(formatDate(startOfMonth));
        setExportEndDate(formatDate(today));
        break;
      case "last_month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setExportStartDate(formatDate(lastMonth));
        setExportEndDate(formatDate(lastMonthEnd));
        break;
      case "custom":
        // Keep existing dates or clear them
        break;
      default:
        setExportStartDate("");
        setExportEndDate("");
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Helper function to download CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    try {
      console.log("Attempting to download CSV with filename:", filename);
      console.log("CSV content length:", csvContent.length);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      console.log("Blob created successfully, size:", blob.size);
      
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        console.log("Object URL created:", url);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        console.log("Triggering download...");
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Download completed and cleanup done");
      } else {
        throw new Error("Browser does not support file downloads");
      }
    } catch (error) {
      console.error("Error in downloadCSV:", error);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      await ApiService.deleteProductSale(orderToDelete.id);

      // Refresh the orders list
      await fetchOrders();

      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      // You might want to show an error notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const closeInvoicePopup = () => {
    setShowInvoicePopup(false);
    setSelectedOrder(null);
  };

  const printInvoice = () => {
    window.print();
  };

  // Calculate statistics from filtered results for current view - removed since pagination handles filtering on backend
  // Orders are now pre-filtered and sorted by the backend API based on search/filter parameters

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
              Failed to Load Orders
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
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
        <OrdersHeader />

        {/* Stats Cards */}
        <OrdersStats
          overallStats={overallStats}
          isStatsLoading={isStatsLoading}
        />

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-2">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-green-400 font-medium">
                {successMessage}
              </span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-400 hover:text-green-300 cursor-pointer"
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
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="flex border-b border-slate-700/50">
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "orders"
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Orders
              </div>
            </button>
            <button
              onClick={() => handleTabChange("products")}
              className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "products"
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Sold Products
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "orders" ? (
            <>
              <div className="sm:p-4 p-2 flex-shrink-0 border-b border-slate-700/50">
                <OrdersControls
                  searchInput={searchInput}
                  searchTerm={searchTerm}
                  isSearching={isSearching}
                  filterCustomer={filterCustomer}
                  sortBy={sortBy}
                  isNavigating={isNavigating}
                  onSearchChange={handleSearchChange}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  onAddOrder={handleAddOrder}
                />
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-x-auto relative">
                <OrdersList
                  orders={orders}
                  totalItems={totalItems}
                  isSearching={isSearching}
                  isSendingSms={isSendingSms}
                  onOrderClick={handleOrderClick}
                  onCustomerClick={handleCustomerClick}
                  onViewInvoice={handleViewInvoice}
                  onPrintInvoice={handlePrintInvoice}
                  onEditInvoice={handleEditInvoice}
                  onDeleteOrder={handleDeleteOrder}
                  onSendSms={handleSendSms}
                  onAddOrder={handleAddOrder}
                />
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-700/50">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Product Sales Controls */}
              <div className="sm:p-4 p-2 flex-shrink-0 border-b border-slate-700/50">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4"
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
                        placeholder="Search products..."
                        value={productSearchInput}
                        onChange={(e) => handleProductSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm"
                      />
                      {isSearchingProducts && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg
                            className="animate-spin h-4 w-4 text-slate-400"
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
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Sort Dropdown */}
                    <select
                      value={productSortBy}
                      onChange={(e) => handleProductSortChange(e.target.value)}
                      className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm cursor-pointer"
                    >
                      <option value="total_quantity">Most Sold (Qty)</option>
                      <option value="total_profit">Highest Profit</option>
                      <option value="profit_margin">Highest Margin</option>
                      <option value="last_sold">Recently Sold</option>
                      <option value="product_name">Product Name</option>
                    </select>

                    {/* Export Button */}
                    <button
                      onClick={() => setShowExportDialog(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export Excel
                    </button>
                  </div>

                  <div className="text-sm text-slate-400">
                    {productTotalItems} products total • Page {productCurrentPage} of {productTotalPages}
                  </div>
                </div>
              </div>

              {/* Product Sales List */}
              <div className="flex-1 overflow-x-auto relative">
                {isLoadingProducts ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-slate-400">Loading products...</p>
                  </div>
                ) : productSales.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg
                      className="w-12 h-12 text-slate-600 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-400 mb-2">
                      No products found
                    </h3>
                    <p className="text-slate-500">
                      {productSearchTerm ? "No products match your search." : "No products have been sold yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-700/50">
                        <tr>
                          <th className="text-left p-4 text-slate-300 font-medium text-sm">Product</th>
                          <th className="text-center p-4 text-slate-300 font-medium text-sm">Total Sold</th>
                          <th className="text-right p-4 text-slate-300 font-medium text-sm">Price</th>
                          <th className="text-right p-4 text-slate-300 font-medium text-sm">Profit</th>
                          <th className="text-center p-4 text-slate-300 font-medium text-sm">Available Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {productSales.map((product) => (
                          <tr
                            key={product.id}
                            className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                          >
                            <td className="p-4">
                              <div>
                                <div 
                                  className={`font-medium ${
                                    product.product_id 
                                      ? "text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors" 
                                      : "text-slate-100"
                                  }`}
                                  onClick={() => product.product_id && handleProductClick(product.product_id)}
                                >
                                  {product.product_name}
                                </div>
                                {product.variant_display && (
                                  <div className="text-xs text-slate-400 mt-1">
                                    {product.variant_display}
                                  </div>
                                )}
                                <div className="text-xs text-slate-400 mt-1">
                                  {new Date(product.last_sold).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div>
                                <span className="text-slate-100 font-medium">
                                  {product.total_quantity}
                                </span>
                                <div className="text-xs text-green-400 mt-1">
                                  Last Bought: {product.last_sold_customer || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="space-y-1">
                                <div className="text-green-400 font-medium text-sm">
                                  Sell: {formatCurrency(product.avg_unit_price)}
                                </div>
                                <div className="text-orange-400 font-medium text-xs">
                                  Buy: {formatCurrency(product.avg_buy_price)}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-cyan-400 font-medium">
                                {formatCurrency(product.total_profit)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-sm font-medium ${
                                (product.available_stock || 0) === 0
                                  ? "text-red-400"
                                  : (product.available_stock || 0) < 10
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}>
                                {product.available_stock !== undefined ? product.available_stock : "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Product Pagination Controls */}
              {productTotalPages > 1 && (
                <div className="p-4 border-t border-slate-700/50">
                  <Pagination
                    currentPage={productCurrentPage}
                    totalPages={productTotalPages}
                    totalItems={productTotalItems}
                    itemsPerPage={productPageSize}
                    onPageChange={handleProductPageChange}
                    onPageSizeChange={handleProductPageSizeChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Invoice Popup Modal */}
        {showInvoicePopup && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-20 print:pt-0 print:p-0">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-4xl w-full mb-8 print:bg-white print:border-none print:shadow-none print:max-w-none print:my-0 print:mb-0">
              {/* Modal Header */}
              <div className="flex justify-end items-center p-6 border-b border-slate-700/50 print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={printInvoice}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer"
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
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={closeInvoicePopup}
                    className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50 cursor-pointer"
                  >
                    <svg
                      className="w-6 h-6"
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
                </div>
              </div>

              {/* Invoice Content */}
              <div className="p-6 print:px-0 print:bg-white print:w-full">
                {/* Invoice Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center justify-start">
                    {userProfile?.profile?.store_logo &&
                    userProfile.profile.store_logo.trim() !== "" ? (
                      <img
                        src={ApiService.getImageUrl(
                          userProfile.profile.store_logo
                        )}
                        alt="Store Logo"
                        className="h-12 max-w-48 object-contain object-left"
                        onError={(e) => {
                          console.log(
                            "Image failed to load:",
                            userProfile.profile?.store_logo
                          );
                          // Fallback to default logo if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback =
                            target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center print:bg-gray-800 ${
                        userProfile?.profile?.store_logo &&
                        userProfile.profile.store_logo.trim() !== ""
                          ? "hidden"
                          : "flex"
                      }`}
                    >
                      <span className="text-white font-bold text-xs print:text-white">
                        Logo
                      </span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 print:text-gray-900">
                    Invoice #{selectedOrder.id}
                  </h2>
                  <p className="text-sm text-slate-300 print:text-gray-600">
                    {new Date(selectedOrder.sale_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 print:grid-cols-2 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                    <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                      <p className="font-medium text-slate-100 print:text-gray-900">
                        {userProfile?.profile?.company || "Your Store Name"}
                      </p>
                      <p>
                        {userProfile?.profile?.company_address ||
                          "123 Business Street"}
                      </p>
                      {!userProfile?.profile?.company_address && (
                        <p>City, State 12345</p>
                      )}
                      <p>
                        Phone:{" "}
                        {userProfile?.profile?.phone ||
                          userProfile?.profile?.contact_number ||
                          "(555) 123-4567"}
                      </p>
                      <p>
                        Email:{" "}
                        {userProfile?.user?.email || "store@yourstore.com"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                    {selectedOrder.customer_name ? (
                      <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                        <p className="font-medium text-slate-100 print:text-gray-900">
                          {selectedOrder.customer_name}
                        </p>
                        {selectedOrder.customer_phone && (
                          <p>{selectedOrder.customer_phone}</p>
                        )}
                        {selectedOrder.customer_email && (
                          <p>{selectedOrder.customer_email}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic print:text-gray-500 text-xs">
                        Walk-in Customer
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6 bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden print:bg-transparent print:border-gray-300">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700/50 print:bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">
                          Item
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-100 print:text-gray-900 border-b border-slate-600/50 print:border-gray-300">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Check if order has multiple items or is a single item order */}
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        // Multiple items - display all items
                        selectedOrder.items.map(
                          (item: OrderItem, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-slate-700/30 print:border-gray-200"
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-100 print:text-gray-900">
                                    {item.product_name}
                                  </p>
                                  {item.variant_details && (
                                    <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                                      {item.variant_details}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-slate-200 print:text-gray-800">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-slate-200 print:text-gray-800">
                                {formatCurrency(item.unit_price || 0)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-400 print:text-gray-900">
                                {formatCurrency(
                                  item.total_price ||
                                    item.quantity * item.unit_price
                                )}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        // Single item order - display the main order data
                        <tr className="border-b border-slate-700/30 print:border-gray-200">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-slate-100 print:text-gray-900">
                                {selectedOrder.product_name}
                              </p>
                              {selectedOrder.variant && (
                                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                                  {selectedOrder.variant.color &&
                                    `Color: ${selectedOrder.variant.color}`}
                                  {selectedOrder.variant.size &&
                                    ` | Size: ${selectedOrder.variant.size}`}
                                  {selectedOrder.variant.custom_variant &&
                                    ` | ${selectedOrder.variant.custom_variant}`}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-200 print:text-gray-800">
                            {selectedOrder.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-200 print:text-gray-800">
                            {formatCurrency(selectedOrder.unit_price || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-400 print:text-gray-900">
                            {formatCurrency(selectedOrder.total_amount || 0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 print:bg-transparent print:border-gray-300">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 text-slate-300 print:text-gray-600 text-sm">
                        <span>Subtotal:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            selectedOrder.items &&
                              selectedOrder.items.length > 0
                              ? selectedOrder.items.reduce(
                                  (sum, item) =>
                                    sum +
                                    (item.total_price ||
                                      item.quantity * item.unit_price),
                                  0
                                )
                              : selectedOrder.total_amount || 0
                          )}
                        </span>
                      </div>
                      <div className="border-t border-slate-600/50 print:border-gray-300 pt-2">
                        <div className="flex justify-between text-base font-bold text-slate-100 print:text-gray-900">
                          <span>Total:</span>
                          <span className="text-cyan-400 print:text-gray-900">
                            {formatCurrency(
                              selectedOrder.items &&
                                selectedOrder.items.length > 0
                                ? selectedOrder.items.reduce(
                                    (sum, item) =>
                                      sum +
                                      (item.total_price ||
                                        item.quantity * item.unit_price),
                                    0
                                  )
                                : selectedOrder.total_amount || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Composer Modal */}
        {showSmsComposer && smsOrder && (
          <SmsComposer
            recipientName={smsOrder.customer_name}
            recipientPhone={smsOrder.customer_phone || ""}
            initialMessage={smsMessage}
            onSend={handleSendSmsFromComposer}
            onCancel={handleCancelSms}
            isLoading={isSendingSms === smsOrder.id}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && orderToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Confirm Delete
                </h3>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-slate-300 mb-4">
                  Are you sure you want to delete this order? This action will:
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
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
                      Permanently remove this order from your records
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-slate-400">
                  <strong>Note:</strong> This action cannot be undone.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
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
                      Delete Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Product Sales</h3>
            
            <div className="space-y-4">
              {/* Preset Options */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quick Date Selection
                </label>
                <select
                  value={exportPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Custom Date Inputs */}
              {(exportPreset === "custom" || exportPreset === "") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                  </div>
                </>
              )}

              {/* Show selected date range for presets */}
              {exportPreset && exportPreset !== "custom" && exportStartDate && (
                <div className="text-sm text-slate-400 bg-slate-700/50 p-2 rounded">
                  <strong>Selected Range:</strong> {exportStartDate} to {exportEndDate}
                </div>
              )}
              
              <div className="text-sm text-slate-400">
                {exportPreset === "" ? "Leave dates empty to export all product sales data." : ""}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportPreset("");
                  setExportStartDate("");
                  setExportEndDate("");
                }}
                className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
