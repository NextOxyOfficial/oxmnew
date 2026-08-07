"use client";

import SmsComposer from "@/components/sms/SmsComposer";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import CustomerVehiclesTab from "@/components/vehicles/CustomerVehiclesTab";
import { ApiService } from "@/lib/api";
import {
  Order as CustomerOrder,
  OrderItem as CustomerOrderItem,
  customersAPI,
} from "@/lib/api/customers";
import { calculateSmsSegments } from "@/lib/utils/sms";
import Pagination from "@/components/ui/Pagination";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Gift,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShoppingBag,
  Star,
  Trophy,
  X,
  Bike,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Import dev auth helper in development
if (process.env.NODE_ENV === "development") {
  import("@/lib/dev-auth");
}

interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  status: "active" | "inactive" | "blocked";
  created_at: string;
  total_points?: number;
}

interface Order {
  id: number;
  date: string;
  total: number;
  status: "completed" | "pending" | "cancelled";
  items: number;
  // Add fields for invoice modal
  order_number?: string;
  items_details?: CustomerOrderItem[];
  customer_name?: string;
  customer_phone?: string | null;
  customer_email?: string | null;
}

interface Gift {
  id: number;
  name: string;
  description: string;
  date_given: string;
  value: number;
  status: "active" | "used" | "expired";
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  date_earned: string;
  points: number;
}

interface DuePayment {
  id: number;
  order_id: number | null;
  order_number?: string | null;
  amount: number;
  due_date: string;
  type: "due" | "advance";
  notes?: string;
  created_at: string;
}

interface AvailableGift {
  id: number;
  name: string;
}

interface TransactionForm {
  type: "due" | "advance";
  amount: string;
  note?: string; // Made optional
  notifyCustomer: boolean;
}

interface Level {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CustomerLevel {
  id: number;
  level: Level;
  assigned_date: string;
  notes?: string;
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  // Same expression the data helpers below derive locally, hoisted once so
  // child components can be handed the id directly.
  const routeCustomerId = parseInt(
    Array.isArray(params.id) ? params.id[0] : params.id || "0"
  );
  const formatCurrency = useCurrencyFormatter();
  const toast = useToast();
  const confirm = useConfirm();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedDuePayment, setSelectedDuePayment] =
    useState<DuePayment | null>(null);
  const [availableGifts, setAvailableGifts] = useState<AvailableGift[]>([]);
  const [selectedGift, setSelectedGift] = useState("");
  const [giftValue, setGiftValue] = useState("");
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    type: "due",
    amount: "",
    notifyCustomer: false,
  });
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Pagination state for orders
  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
    isLoading: false,
  });

  // Pagination state for due payments
  const [duePaymentsPagination, setDuePaymentsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
    isLoading: false,
  });

  // Pagination state for gifts
  const [giftsPagination, setGiftsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
    isLoading: false,
  });

  // Pagination state for achievements
  const [achievementsPagination, setAchievementsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0,
    isLoading: false,
  });
  const [redeemingGiftIds, setRedeemingGiftIds] = useState<Set<number>>(
    new Set()
  );
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  // SMS Composer state
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsOrder, setSmsOrder] = useState<Order | null>(null);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Due Payment SMS Composer state
  const [showDuePaymentSmsComposer, setShowDuePaymentSmsComposer] = useState(false);
  const [smsPayment, setSmsPayment] = useState<DuePayment | null>(null);
  const [duePaymentSmsMessage, setDuePaymentSmsMessage] = useState("");
  const [isSendingDuePaymentSms, setIsSendingDuePaymentSms] = useState(false);

  // Total Due SMS state
  const [isSendingTotalDueSms, setIsSendingTotalDueSms] = useState(false);
  const [showTotalDueSmsComposer, setShowTotalDueSmsComposer] = useState(false);
  const [totalDueSmsMessage, setTotalDueSmsMessage] = useState("");

  const [redeemAmount, setRedeemAmount] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Level-related state
  const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
  const [customerLevel, setCustomerLevel] = useState<CustomerLevel | null>(
    null
  );
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isAssigningLevel, setIsAssigningLevel] = useState(false);
  const [levelNotes, setLevelNotes] = useState("");

  // User profile state for store name
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log("User profile data:", profile);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Function to fetch orders with pagination
  const fetchOrdersWithPagination = async (page: number = 1, pageSize: number = 10) => {
    try {
      setOrdersPagination(prev => ({ ...prev, isLoading: true }));

      const customerId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "1");

      const ordersResponse = await customersAPI.getOrders({
        customer: customerId,
        page,
        page_size: pageSize,
      });

      console.log("Paginated orders response:", ordersResponse);

      // Handle paginated response
      if (ordersResponse && typeof ordersResponse === "object" && "results" in ordersResponse) {
        const paginatedData = ordersResponse as {
          results: CustomerOrder[];
          count: number;
          total_pages: number;
          current_page: number;
          page_size: number;
        };

        const formattedOrders = paginatedData.results.map((order) => ({
          id: order.id,
          date: order.created_at,
          total: order.total_amount,
          status: order.status as "completed" | "pending" | "cancelled",
          items: order.items_count,
          order_number: order.order_number,
          items_details: order.items,
          customer_name: order.customer_name,
          customer_phone: customer?.phone,
          customer_email: customer?.email,
        }));

        setOrders(formattedOrders);
        setOrdersPagination({
          currentPage: paginatedData.current_page,
          totalPages: paginatedData.total_pages,
          pageSize: paginatedData.page_size,
          totalCount: paginatedData.count,
          isLoading: false,
        });
      } else {
        // Fallback for non-paginated response (backward compatibility)
        const ordersArray = Array.isArray(ordersResponse) ? ordersResponse : [];
        const formattedOrders = ordersArray.map((order: CustomerOrder) => ({
          id: order.id,
          date: order.created_at,
          total: order.total_amount,
          status: order.status as "completed" | "pending" | "cancelled",
          items: order.items_count,
          order_number: order.order_number,
          items_details: order.items,
          customer_name: order.customer_name,
          customer_phone: customer?.phone,
          customer_email: customer?.email,
        }));

        setOrders(formattedOrders);
        setOrdersPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalCount: formattedOrders.length,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrdersPagination(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Pagination handlers
  const handleOrdersPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= ordersPagination.totalPages) {
      fetchOrdersWithPagination(newPage, ordersPagination.pageSize);
    }
  };

  const handleOrdersPageSizeChange = (newPageSize: number) => {
    fetchOrdersWithPagination(1, newPageSize);
  };

  // Function to fetch due payments with pagination
  const fetchDuePaymentsWithPagination = async (page: number = 1, pageSize: number = 10) => {
    try {
      setDuePaymentsPagination(prev => ({ ...prev, isLoading: true }));

      const customerId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "1");

      const response = await customersAPI.getCustomerDuePayments({
        customer_id: customerId,
        page,
        page_size: pageSize,
      });

      console.log("Paginated due payments response:", response);

      if (response && typeof response === "object" && "results" in response) {
        const paginatedData = response as {
          results: any[];
          count: number;
          total_pages: number;
          current_page: number;
          page_size: number;
        };

        const formattedDuePayments = paginatedData.results.map((payment: any) => ({
          id: payment.id,
          order_id: payment.order || null,
          order_number: payment.order_number || null,
          amount: payment.amount,
          due_date: payment.due_date,
          type: payment.payment_type as "due" | "advance",
          notes: payment.notes,
          created_at: payment.created_at,
        }));

        setDuePayments(formattedDuePayments);
        setDuePaymentsPagination({
          currentPage: paginatedData.current_page,
          totalPages: paginatedData.total_pages,
          pageSize: paginatedData.page_size,
          totalCount: paginatedData.count,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching due payments:", error);
      setDuePaymentsPagination(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Function to fetch gifts with pagination
  const fetchGiftsWithPagination = async (page: number = 1, pageSize: number = 10) => {
    try {
      setGiftsPagination(prev => ({ ...prev, isLoading: true }));

      const customerId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "1");

      const response = await customersAPI.getCustomerGiftsPaginated({
        customer_id: customerId,
        page,
        page_size: pageSize,
      });

      console.log("Paginated gifts response:", response);

      if (response && typeof response === "object" && "results" in response) {
        const paginatedData = response as {
          results: any[];
          count: number;
          total_pages: number;
          current_page: number;
          page_size: number;
        };

        const formattedGifts = paginatedData.results.map((gift: any) => ({
          id: gift.id,
          name: gift.gift_name,
          description: gift.description || "",
          date_given: gift.created_at,
          value: gift.value,
          status: gift.status as "active" | "used" | "expired",
        }));

        setGifts(formattedGifts);
        setGiftsPagination({
          currentPage: paginatedData.current_page,
          totalPages: paginatedData.total_pages,
          pageSize: paginatedData.page_size,
          totalCount: paginatedData.count,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching gifts:", error);
      setGiftsPagination(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Function to fetch achievements with pagination
  const fetchAchievementsWithPagination = async (page: number = 1, pageSize: number = 10) => {
    try {
      setAchievementsPagination(prev => ({ ...prev, isLoading: true }));

      const customerId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "1");

      const response = await customersAPI.getCustomerAchievements({
        customer_id: customerId,
        page,
        page_size: pageSize,
      });

      console.log("Paginated achievements response:", response);

      if (response && typeof response === "object" && "results" in response) {
        const paginatedData = response as {
          results: any[];
          count: number;
          total_pages: number;
          current_page: number;
          page_size: number;
        };

        const formattedAchievements = paginatedData.results.map((achievement: any) => ({
          id: achievement.id,
          title: achievement.achievement_name,
          description: achievement.notes || "অর্জন হয়েছে",
          icon: "🏆",
          date_earned: achievement.earned_date,
          points: achievement.achievement_points,
        }));

        setAchievements(formattedAchievements);
        setAchievementsPagination({
          currentPage: paginatedData.current_page,
          totalPages: paginatedData.total_pages,
          pageSize: paginatedData.page_size,
          totalCount: paginatedData.count,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      setAchievementsPagination(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Pagination handlers for due payments
  const handleDuePaymentsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= duePaymentsPagination.totalPages) {
      fetchDuePaymentsWithPagination(newPage, duePaymentsPagination.pageSize);
    }
  };

  const handleDuePaymentsPageSizeChange = (newPageSize: number) => {
    fetchDuePaymentsWithPagination(1, newPageSize);
  };

  // Pagination handlers for gifts
  const handleGiftsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= giftsPagination.totalPages) {
      fetchGiftsWithPagination(newPage, giftsPagination.pageSize);
    }
  };

  const handleGiftsPageSizeChange = (newPageSize: number) => {
    fetchGiftsWithPagination(1, newPageSize);
  };

  // Pagination handlers for achievements
  const handleAchievementsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= achievementsPagination.totalPages) {
      fetchAchievementsWithPagination(newPage, achievementsPagination.pageSize);
    }
  };

  const handleAchievementsPageSizeChange = (newPageSize: number) => {
    fetchAchievementsWithPagination(1, newPageSize);
  };

  // Handle tab change and fetch data if needed
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);

    const customerId = parseInt(Array.isArray(params.id) ? params.id[0] : params.id || "1");

    // Fetch paginated data when switching to specific tabs
    switch (newTab) {
      case "orders":
        if (orders.length === 0 || ordersPagination.currentPage === 1) {
          fetchOrdersWithPagination(1, ordersPagination.pageSize);
        }
        break;
      case "due-payments":
        fetchDuePaymentsWithPagination(1, duePaymentsPagination.pageSize);
        break;
      case "gifts":
        fetchGiftsWithPagination(1, giftsPagination.pageSize);
        break;
      case "achievements":
        fetchAchievementsWithPagination(1, achievementsPagination.pageSize);
        break;
    }
  };

  useEffect(() => {
    const getCustomerId = () => {
      return Array.isArray(params.id) ? params.id[0] : params.id;
    };

    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const customerId = parseInt(getCustomerId() || "1");

        // Fetch customer data
        const customerData = await customersAPI.getCustomer(customerId);
        setCustomer(customerData);
        setCustomerForm({
          name: customerData.name || "",
          email: customerData.email || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
        });

        // Set customer level from customer data
        if (customerData.current_level) {
          setCustomerLevel(customerData.current_level);
        }

        // Fetch orders for this customer with pagination
        await fetchOrdersWithPagination(1, 10);

        // Initialize other data as empty - they will be loaded when tabs are activated
        setDuePayments([]);
        setGifts([]);
        setAchievements([]);

        // Fetch available gifts and levels
        const availableGiftsData = await customersAPI.getAvailableGifts();
        console.log("Raw available gifts data:", availableGiftsData);
        // Handle both array and paginated response
        let availableGifts: any[] = [];
        if (Array.isArray(availableGiftsData)) {
          availableGifts = availableGiftsData;
        } else if (
          availableGiftsData &&
          typeof availableGiftsData === "object"
        ) {
          availableGifts =
            (availableGiftsData as { results?: any[]; data?: any[] }).results ||
            (availableGiftsData as { results?: any[]; data?: any[] }).data ||
            [];
        }
        const formattedAvailableGifts = availableGifts.map((gift: any) => ({
          id: gift.id,
          name: gift.name,
        }));
        setAvailableGifts(formattedAvailableGifts);

        const availableLevelsData = await customersAPI.getAvailableLevels();
        console.log("Raw available levels data:", availableLevelsData);
        // Handle both array and paginated response
        let availableLevels: any[] = [];
        if (Array.isArray(availableLevelsData)) {
          availableLevels = availableLevelsData;
        } else if (
          availableLevelsData &&
          typeof availableLevelsData === "object"
        ) {
          availableLevels =
            (availableLevelsData as { results?: any[]; data?: any[] })
              .results ||
            (availableLevelsData as { results?: any[]; data?: any[] }).data ||
            [];
        }
        const formattedLevels = availableLevels.map((level: any) => ({
          id: level.id,
          name: level.name,
          is_active: level.is_active,
          created_at: level.created_at,
        }));
        setAvailableLevels(formattedLevels);

        // Mock achievements for now (no backend endpoint yet)
        const mockAchievements: Achievement[] = [
          {
            id: 1,
            title: "প্রথম কেনাকাটা",
            description: "প্রথমবার কেনাকাটা করেছেন",
            icon: "🎉",
            date_earned: "2024-01-15",
            points: 100,
          },
          {
            id: 2,
            title: "পুরনো কাস্টমার",
            description: "10টির বেশি অর্ডার হয়ে গেছে",
            icon: "🏆",
            date_earned: "2025-06-01",
            points: 500,
          },
        ];
        setAchievements(mockAchievements);
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
        // Show error to user or fallback to mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
    fetchUserProfile(); // Fetch user profile for store name
  }, [params.id]);

  const handleViewInvoice = (order: Order) => {
    // Navigate to the dedicated invoice page
    window.open(`/invoice/${order.id}`, '_blank');
  };

  const handleShowTransaction = () => {
    setShowTransactionModal(true);
    setTransactionForm({
      type: "due",
      amount: "",
      notifyCustomer: false,
    });
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setTransactionForm({
      type: "due",
      amount: "",
      notifyCustomer: false,
    });
  };

  const handleShowNotes = (duePayment: DuePayment) => {
    setSelectedDuePayment(duePayment);
    setShowNotesModal(true);
  };

  const handleCloseNotes = () => {
    setShowNotesModal(false);
    setSelectedDuePayment(null);
  };

  const handleSendSMS = async (message: string) => {
    if (!customer) return;

    setIsSendingSMS(true);
    try {
      // Send SMS via API
      const response = await customersAPI.sendSMS(customer.id, message);

      if (response.success) {
        toast.success(
          `${
            customer.phone
          } নম্বরে এসএমএস চলে গেছে! ক্রেডিট খরচ: ${
            response.credits_used || 1
          }`
        );
      } else {
        throw new Error(response.message || "এসএমএস পাঠানো যায়নি");
      }
    } catch (error: unknown) {
      console.error("Failed to send SMS:", error);

      // Handle insufficient credits error specifically
      if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error as {
          response?: { status?: number; data?: any };
        };
        if (errorResponse.response?.status === 402) {
          const errorData = errorResponse.response.data || {};
          const errorMsg =
            errorData.message || errorData.error || "এসএমএস ক্রেডিট শেষ হয়ে গেছে।";
          const confirmed = await confirm({
            title: "আরও এসএমএস ক্রেডিট কিনবেন?",
            message: errorMsg,
            confirmLabel: "ক্রেডিট কিনুন",
          });
          if (confirmed) {
            window.open("/dashboard/subscriptions", "_blank");
          }
        } else {
          // Handle other types of errors
          const errorMessage =
            errorResponse.response?.data?.message ||
            errorResponse.response?.data?.error ||
            "কী সমস্যা হয়েছে বোঝা যায়নি";
          toast.error(`এসএমএস পাঠানো যায়নি: ${errorMessage}`);
        }
      } else {
        toast.error(
          `এসএমএস পাঠানো যায়নি: ${
            error instanceof Error ? error.message : "কী সমস্যা হয়েছে বোঝা যায়নি"
          }`
        );
      }
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleSendNotification = async (payment: DuePayment) => {
    if (!customer?.phone) {
      toast.error("এই কাস্টমারের ফোন নম্বর দেওয়া নেই", {
        label: "নম্বর যোগ করুন",
        href: "/dashboard/customers",
      });
      return;
    }

    try {
      // Get customer financial details
      let dueAmount = 0;
      let advanceAmount = 0;

      try {
        // Use the customer summary endpoint to get financial details
        const response = await ApiService.get(
          `/customers/${customer.id}/summary/`
        );
        console.log("Customer summary response:", response);

        // Get the financial summary
        const financialSummary = response.financial_summary || {};

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

        // Determine financial state based on net balance
        if (netBalance > 0) {
          dueAmount = netBalance;
          advanceAmount = 0;
        } else if (netBalance < 0) {
          dueAmount = 0;
          advanceAmount = Math.abs(netBalance);
        } else {
          dueAmount = 0;
          advanceAmount = 0;
        }
      } catch (error) {
        console.log("Error fetching customer financial details:", error);
        // Use customer summary API data for financial info
      }

      // Format the SMS message using your specified format
      const storeName = userProfile?.profile?.company || "আপনার স্টোর"; // Get actual store name
      const totalDueAmount = Math.max(0, dueAmount); // Only show if positive (customer owes money)

      let message = `সম্মানিত কাস্টমার, আমাদের খাতায় আপনার ${formatCurrency(totalDueAmount)} টাকা বাকি রয়েছে, দয়া করে পরিশোধ করুন ${storeName}`;

      console.log("Final SMS message:", message);

      // Set the message and show composer
      setDuePaymentSmsMessage(message);
      setSmsPayment(payment);
      setShowDuePaymentSmsComposer(true);
    } catch (error) {
      console.error("Error preparing SMS:", error);
      toast.error("এসএমএস তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  // Handle actual SMS sending from due payment composer
  const handleSendSmsFromDuePaymentComposer = async (message: string) => {
    if (!smsPayment || !customer?.phone) return;

    try {
      setIsSendingDuePaymentSms(true);

      // Send SMS
      console.log(
        "Sending Due Payment SMS to:",
        customer.phone,
        "Message:",
        message
      );

      const response = await ApiService.sendSmsNotification(
        customer.phone,
        message
      );
      console.log("SMS Response:", response);

      // Check if the response indicates success
      if (response.success === false) {
        throw new Error(response.error || "এসএমএস পাঠানো যায়নি");
      }

      // Use actual credits used from backend response, fallback to frontend calculation
      const creditsUsed =
        response.credits_used || calculateSmsSegments(message).segments;
      toast.success(`এসএমএস চলে গেছে! ${creditsUsed} টি এসএমএস ক্রেডিট খরচ হয়েছে।`);

      // Close composer
      setShowDuePaymentSmsComposer(false);
      setSmsPayment(null);
      setDuePaymentSmsMessage("");
    } catch (error) {
      console.error("Error sending SMS:", error);

      // Show more detailed error message
      let errorMessage = "এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error
      ) {
        errorMessage = (error as any).error;
      }

      toast.error(`এসএমএস সমস্যা: ${errorMessage}`);
    } finally {
      setIsSendingDuePaymentSms(false);
    }
  };

  // Handle due payment SMS composer cancel
  const handleCancelDuePaymentSms = () => {
    setShowDuePaymentSmsComposer(false);
    setSmsPayment(null);
    setDuePaymentSmsMessage("");
  };

  // Handle total due SMS sending
  const handleSendTotalDueSms = async () => {
    if (!customer?.phone) {
      toast.error("এই কাস্টমারের ফোন নম্বর দেওয়া নেই", {
        label: "নম্বর যোগ করুন",
        href: "/dashboard/customers",
      });
      return;
    }

    const totalDueAmount = Math.max(0, netAmount); // Only positive amounts (customer owes money)

    if (totalDueAmount <= 0) {
      toast.info("বাকি কিছু নেই, এসএমএস পাঠানোর দরকার নেই");
      return;
    }

    try {
      // Format the SMS message using your specified format
      const storeName = userProfile?.profile?.company || "আপনার স্টোর";
      const message = `সম্মানিত কাস্টমার, আমাদের খাতায় আপনার ${formatCurrency(totalDueAmount)} টাকা বাকি রয়েছে, দয়া করে পরিশোধ করুন ${storeName}`;

      console.log("Preparing Total Due SMS:", message);

      // Set the message and show composer modal
      setTotalDueSmsMessage(message);
      setShowTotalDueSmsComposer(true);
    } catch (error) {
      console.error("Error preparing SMS:", error);
      toast.error("এসএমএস তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  // Handle actual SMS sending from total due composer
  const handleSendSmsFromTotalDueComposer = async (message: string) => {
    if (!customer?.phone) return;

    try {
      setIsSendingTotalDueSms(true);

      // Send SMS
      console.log("Sending Total Due SMS to:", customer.phone, "Message:", message);

      const response = await ApiService.sendSmsNotification(
        customer.phone,
        message
      );
      console.log("SMS Response:", response);

      // Check if the response indicates success
      if (response.success === false) {
        throw new Error(response.error || "এসএমএস পাঠানো যায়নি");
      }

      // Use actual credits used from backend response, fallback to frontend calculation
      const creditsUsed =
        response.credits_used || calculateSmsSegments(message).segments;
      toast.success(`এসএমএস চলে গেছে! ${creditsUsed} টি এসএমএস ক্রেডিট খরচ হয়েছে।`);

      // Close composer
      setShowTotalDueSmsComposer(false);
      setTotalDueSmsMessage("");
    } catch (error) {
      console.error("Error sending SMS:", error);

      // Show more detailed error message
      let errorMessage = "এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error
      ) {
        errorMessage = (error as any).error;
      }

      toast.error(`এসএমএস সমস্যা: ${errorMessage}`);
    } finally {
      setIsSendingTotalDueSms(false);
    }
  };

  // Handle total due SMS composer cancel
  const handleCancelTotalDueSms = () => {
    setShowTotalDueSmsComposer(false);
    setTotalDueSmsMessage("");
  };

  const handleSendSms = async (order: Order) => {
    if (!order.customer_phone) {
      toast.error("এই কাস্টমারের ফোন নম্বর দেওয়া নেই", {
        label: "নম্বর যোগ করুন",
        href: "/dashboard/customers",
      });
      return;
    }

    if (!customer) {
      toast.error("কাস্টমারের তথ্য পাওয়া যায়নি");
      return;
    }

    console.log("=== SMS DEBUG INFO ===");
    console.log("Customer phone from order:", order.customer_phone);
    console.log("Customer phone from customer data:", customer.phone);
    console.log("Order details:", order);
    console.log("Customer details:", customer);

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
        } catch (error) {
          console.log("Error fetching customer financial details:", error);
          // Use customer summary API data for financial info
        }
      }

      // Format the SMS message
      const storeName = userProfile?.profile?.company || "আপনার স্টোর"; // Get actual store name
      const amount = formatCurrency(order.total);

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
      toast.error("এসএমএস তৈরি করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  // Handle actual SMS sending from composer
  const handleSendSmsFromComposer = async (message: string) => {
    if (!smsOrder || !smsOrder.customer_phone) return;

    try {
      // Set loading state for this specific order
      setIsSendingSms(true);

      // Send SMS
      console.log(
        "Sending SMS to:",
        smsOrder.customer_phone,
        "Message:",
        message
      );
      console.log("=== FINAL SMS SEND ===");
      console.log("Phone number:", smsOrder.customer_phone);
      console.log("Message length:", message.length);
      console.log("Message content:", message);

      const response = await ApiService.sendSmsNotification(
        smsOrder.customer_phone,
        message
      );
      console.log("SMS Response:", response);

      // Check if the response indicates success
      if (response.success === false) {
        throw new Error(response.error || "এসএমএস পাঠানো যায়নি");
      }

      // Use actual credits used from backend response, fallback to frontend calculation
      const creditsUsed =
        response.credits_used || calculateSmsSegments(message).segments;
      toast.success(`এসএমএস চলে গেছে! ${creditsUsed} টি এসএমএস ক্রেডিট খরচ হয়েছে।`);

      // Close composer
      setShowSmsComposer(false);
      setSmsOrder(null);
      setSmsMessage("");
    } catch (error) {
      console.error("Error sending SMS:", error);

      // Show more detailed error message
      let errorMessage = "এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error
      ) {
        errorMessage = (error as any).error;
      }

      toast.error(`এসএমএস সমস্যা: ${errorMessage}`);
    } finally {
      // Clear loading state
      setIsSendingSms(false);
    }
  };

  // Handle SMS composer cancel
  const handleCancelSms = () => {
    setShowSmsComposer(false);
    setSmsOrder(null);
    setSmsMessage("");
  };

  const handleSubmitTransaction = async () => {
    if (!customer) return;

    try {
      // Validate required fields
      if (!transactionForm.amount) {
        toast.error("দরকারি ঘরগুলো পূরণ করুন।");
        return;
      }

      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("0 এর বেশি সঠিক টাকার পরিমাণ লিখুন।");
        return;
      }

      // Create due payment entry
      const duePaymentData = {
        customer: customer.id,
        amount: transactionForm.type === "advance" ? -amount : amount, // Negative for advance
        payment_type: transactionForm.type,
        due_date: new Date().toISOString().split('T')[0], // Today's date as default
        notes: transactionForm.note || "", // Make notes optional
      };

      // Create due payment via API
      await customersAPI.createDuePayment(duePaymentData);

      toast.success(
        `হিসাব যোগ হয়েছে! ${
          transactionForm.notifyCustomer
            ? "কাস্টমারকে এসএমএস দিয়ে জানানো হবে।"
            : ""
        }`
      );

      // Send SMS notification if requested
      if (transactionForm.notifyCustomer) {
        const message = `প্রিয় ${
          customer.name
        }, আপনার ${
          transactionForm.type === "due" ? "বাকি" : "জমা"
        } ${formatCurrency(amount)} টাকার তথ্য জানানো হচ্ছে।`;
        await handleSendSMS(message);
      }

      // Refresh due payments
      const duePaymentsData = await customersAPI.getDuePayments(customer.id);
      // Handle both array and paginated response
      let duePayments: any[] = [];
      if (Array.isArray(duePaymentsData)) {
        duePayments = duePaymentsData;
      } else if (duePaymentsData && typeof duePaymentsData === "object") {
        duePayments =
          (duePaymentsData as { results?: any[]; data?: any[] }).results ||
          (duePaymentsData as { results?: any[]; data?: any[] }).data ||
          [];
      }
      const formattedDuePayments = duePayments
        .map((payment: any) => ({
          id: payment.id,
          order_id: payment.order || null, // Use null instead of 0 for no order
          order_number: payment.order_number || null,
          amount: payment.amount,
          due_date: payment.due_date,
          type: payment.payment_type as "due" | "advance",
          notes: payment.notes,
          created_at: payment.created_at,
        }))
        .sort((a: any, b: any) => {
          // Sort by created_at in descending order (newest first)
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      setDuePayments(formattedDuePayments);

      // Close modal and reset form
      handleCloseTransactionModal();
    } catch (error) {
      console.error("Failed to add due payment:", error);
      toast.error("হিসাব যোগ করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (!customer) return;

      // Update customer via API
      const updatedCustomer = await customersAPI.updateCustomer(customer.id, {
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone,
        address: customerForm.address,
      });

      setCustomer(updatedCustomer);
      toast.success("তথ্য সেভ হয়েছে!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("তথ্য সেভ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGift = async () => {
    if (!selectedGift || !customer || !giftValue) return;

    const value = parseFloat(giftValue);
    if (isNaN(value) || value <= 0) {
      toast.error("গিফটের দাম 0 এর বেশি লিখুন।");
      return;
    }

    setIsAddingGift(true);
    try {
      // Add gift via API
      const newGift = await customersAPI.addCustomerGift({
        customer: customer.id,
        gift: parseInt(selectedGift),
        value: value,
        description: `Manually added gift`,
      });

      // Add the new gift to the state
      const formattedGift: Gift = {
        id: newGift.id,
        name: newGift.gift_name,
        description: newGift.description || "",
        date_given: newGift.created_at,
        value: newGift.value,
        status: newGift.status as "active" | "used" | "expired",
      };

      setGifts((prev) => [formattedGift, ...prev]);
      setSelectedGift("");
      setGiftValue("");
      toast.success("গিফট যোগ হয়েছে!");
    } catch (error) {
      console.error("Failed to add gift:", error);
      toast.error("গিফট যোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsAddingGift(false);
    }
  };

  const handleRedeemGift = async (giftId: number) => {
    setRedeemingGiftIds((prev) => new Set(prev).add(giftId));

    try {
      // Redeem gift via API
      await customersAPI.redeemGift(giftId);

      setGifts((prev) =>
        prev.map((gift) =>
          gift.id === giftId ? { ...gift, status: "used" as const } : gift
        )
      );

      toast.success("গিফট ব্যবহার করা হয়েছে!");
    } catch (error) {
      console.error("Failed to redeem gift:", error);
      toast.error("গিফট ব্যবহার করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setRedeemingGiftIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(giftId);
        return newSet;
      });
    }
  };

  const handleRedeemPoints = async () => {
    if (!customer) return;

    const amount = parseFloat(redeemAmount);
    const totalPoints = customer.total_points || 0;

    if (!amount || amount <= 0) {
      toast.error("কত পয়েন্ট ভাঙাবেন সেটা ঠিকভাবে লিখুন।");
      return;
    }

    if (amount > totalPoints) {
      toast.error(
        "পয়েন্ট যথেষ্ট নেই। মোট পয়েন্টের বেশি ভাঙানো যাবে না।"
      );
      return;
    }

    setIsRedeeming(true);
    try {
      // Redeem points via API
      await customersAPI.redeemPoints(customer.id, amount);

      toast.success(`${amount} পয়েন্ট ভাঙানো হয়েছে!`);
      setRedeemAmount("");

      // Refresh customer data to get updated points
      const updatedCustomer = await customersAPI.getCustomer(customer.id);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error("Failed to redeem points:", error);
      toast.error("পয়েন্ট ভাঙানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsRedeeming(false);
    }
  };

  // Level assignment handlers
  const handleAssignLevel = async () => {
    if (!selectedLevel || !customer) return;

    setIsAssigningLevel(true);
    try {
      // Assign level via API
      const newCustomerLevel = await customersAPI.assignLevel({
        customer: customer.id,
        level: parseInt(selectedLevel),
        notes: levelNotes || undefined,
      });

      // Update the customer level in state
      const level = availableLevels.find(
        (l) => l.id.toString() === selectedLevel
      );
      if (level) {
        const formattedCustomerLevel: CustomerLevel = {
          id: newCustomerLevel.id,
          level: level,
          assigned_date: newCustomerLevel.assigned_date,
          notes: newCustomerLevel.notes,
        };
        setCustomerLevel(formattedCustomerLevel);
        setSelectedLevel("");
        setLevelNotes("");
        toast.success("লেভেল দেওয়া হয়েছে!");
      }
    } catch (error) {
      console.error("Failed to assign level:", error);
      toast.error("লেভেল দেওয়া যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsAssigningLevel(false);
    }
  };

  const handleRemoveLevel = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCustomerLevel(null);
      toast.success("লেভেল সরানো হয়েছে!");
    } catch {
      toast.error("লেভেল সরানো যায়নি। আবার চেষ্টা করুন।");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কাস্টমারের তথ্য</h1>
            <p className="page-sub">লোড হচ্ছে…</p>
          </div>
        </header>

        <div className="plane">
          <div className="plane-section">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-40 rounded bg-slate-100"></div>
              <div className="h-4 w-full rounded bg-slate-100"></div>
              <div className="h-4 w-3/4 rounded bg-slate-100"></div>
              <div className="h-4 w-1/2 rounded bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">কাস্টমার পাওয়া যায়নি</h1>
            <p className="page-sub">কিছু একটা সমস্যা হয়েছে</p>
          </div>
        </header>

        <div className="plane">
          <div className="empty">
            <p className="font-medium text-slate-600">কাস্টমার পাওয়া যায়নি</p>
            <p className="mt-1 text-sm">
              আপনি যে কাস্টমার খুঁজছেন সেটা নেই, নয়তো মুছে ফেলা হয়েছে।
            </p>
            <button onClick={() => router.back()} className="btn btn-ghost mt-4">
              <ArrowLeft className="h-4 w-4" />
              <span>ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDue = duePayments
    .filter((payment) => payment.type === "due")
    .reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const totalAdvance = duePayments
    .filter((payment) => payment.type === "advance")
    .reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return sum + (isNaN(amount) ? 0 : Math.abs(amount));
    }, 0);

  const netAmount = totalDue - totalAdvance;

  return (
    <div className="page">
      {/* Page Header */}
      <header className="page-head">
        <div className="min-w-0">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>কাস্টমারের তালিকায় ফিরে যান</span>
          </button>
          <h1 className="page-title truncate" title={customer.name}>
            {customer.name}
          </h1>
          <div className="page-sub flex flex-wrap items-center gap-x-4 gap-y-1">
            {customer.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[12rem] truncate sm:max-w-[20rem]">
                  {customer.email}
                </span>
              </span>
            )}
            {customer.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span className="num">{customer.phone}</span>
              </span>
            )}
            {customer.address && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[12rem] truncate sm:max-w-[20rem]">
                  {customer.address}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="plane">
        {/* KPIs */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট অর্ডার</div>
            <div className="stat-value num">{customer.total_orders}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>

          <div className="stat">
            <div className="stat-label">মোট কেনাকাটা</div>
            <div className="stat-value num money-pos">
              {formatCurrency(customer.total_spent)}
            </div>
            <div className="stat-meta">এই কাস্টমারের কাছ থেকে</div>
          </div>

          <div className="stat">
            <div className="stat-label">
              {netAmount >= 0 ? "বাকি" : "জমা"}
            </div>
            <div
              className={`stat-value num ${
                netAmount >= 0 ? "money-neg" : "money-pos"
              }`}
            >
              {formatCurrency(isNaN(netAmount) ? 0 : Math.abs(netAmount))}
            </div>
            <div className="stat-meta">
              {netAmount >= 0 ? "কাস্টমার দেবেন" : "কাস্টমার আগে দিয়েছেন"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">চালু গিফট</div>
            <div className="stat-value num">
              {gifts.filter((gift) => gift.status === "active").length}
            </div>
            <div className="stat-meta">এখনো ব্যবহার হয়নি</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                key: "profile",
                label: "প্রোফাইল",
                icon: <Mail className="h-4 w-4" />,
              },
              {
                key: "orders",
                label: "কেনাকাটার হিসাব",
                icon: <ShoppingBag className="h-4 w-4" />,
              },
              {
                key: "vehicles",
                label: "কেনা বাইক",
                icon: <Bike className="h-4 w-4" />,
              },
              {
                key: "due-payments",
                label: "বাকির খাতা",
                icon: <DollarSign className="h-4 w-4" />,
              },
              {
                key: "gifts",
                label: "গিফট ও পুরস্কার",
                icon: <Gift className="h-4 w-4" />,
              },
              {
                key: "achievements",
                label: "অর্জন",
                icon: <Trophy className="h-4 w-4" />,
              },
              {
                key: "level",
                label: "লেভেল",
                icon: <Star className="h-4 w-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`btn btn-sm ${
                  activeTab === tab.key ? "btn-primary" : "btn-ghost"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="plane-section">
            <div className="section-title">কাস্টমারের তথ্য</div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Customer Name */}
              <div>
                <label className="label">কাস্টমারের নাম</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      name: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="কাস্টমারের নাম লিখুন"
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">ইমেইল</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      email: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="ইমেইল লিখুন"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label">ফোন নম্বর</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      phone: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="ফোন নম্বর লিখুন"
                />
              </div>

              {/* Member Since */}
              <div>
                <label className="label">কাস্টমার হয়েছেন</label>
                <div className="input num text-slate-500">
                  {new Date(customer.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="label">ঠিকানা</label>
                <textarea
                  rows={3}
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      address: e.target.value,
                    })
                  }
                  className="textarea resize-none"
                  placeholder="ঠিকানা লিখুন"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? "সেভ হচ্ছে…" : "সেভ করুন"}
              </button>
            </div>
          </div>
        )}

        {/* Purchase History Tab */}
        {activeTab === "orders" && (
          <>
            <div className="plane-section">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="section-title">কেনাকাটার হিসাব</div>
                  <p className="text-xs text-slate-500">
                    মোট {ordersPagination.totalCount} টি অর্ডার
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="text-xs text-slate-500"
                    htmlFor="orders-page-size"
                  >
                    প্রতি পাতায়
                  </label>
                  <select
                    id="orders-page-size"
                    value={ordersPagination.pageSize}
                    onChange={(e) => handleOrdersPageSizeChange(Number(e.target.value))}
                    className="select w-auto"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {ordersPagination.isLoading ? (
              <div className="empty">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                  <span>অর্ডার লোড হচ্ছে…</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="font-medium text-slate-600">
                  এখনো কোনো অর্ডার নেই
                </p>
                <p className="mt-1 text-sm">
                  এই কাস্টমার এখনো কিছু কেনেননি।
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>অর্ডার</th>
                      <th>তারিখ</th>
                      <th className="cell-num">টাকার পরিমাণ</th>
                      <th className="cell-num">কাজ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="cell-strong num">#{order.id}</td>
                        <td>{formatDate(order.date)}</td>
                        <td className="cell-num money-pos">
                          {formatCurrency(order.total)}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              onClick={() => handleViewInvoice(order)}
                              className="btn btn-ghost btn-sm"
                              title="ইনভয়েস দেখুন"
                            >
                              <FileText className="h-4 w-4" />
                              <span>ইনভয়েস</span>
                            </button>
                            <button
                              onClick={() => handleSendSms(order)}
                              disabled={isSendingSms}
                              className="btn btn-ghost btn-sm"
                              title="এসএমএস পাঠান"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>
                                {isSendingSms ? "যাচ্ছে…" : "এসএমএস"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!ordersPagination.isLoading && orders.length > 0 && (
              <div className="plane-section">
                <Pagination
                  currentPage={ordersPagination.currentPage}
                  totalPages={ordersPagination.totalPages}
                  totalItems={ordersPagination.totalCount}
                  itemsPerPage={ordersPagination.pageSize}
                  onPageChange={handleOrdersPageChange}
                  onPageSizeChange={handleOrdersPageSizeChange}
                />
              </div>
            )}
          </>
        )}

        {/* Due Payments Tab */}
        {/* Vehicles bought by this customer — units, payments and papers. */}
        {activeTab === "vehicles" && (
          <CustomerVehiclesTab customerId={routeCustomerId} />
        )}

        {activeTab === "due-payments" && (
          <>
            <div className="plane-section">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="section-title">বাকির খাতা</div>
                  <p className="text-sm">
                    <span className="text-slate-500">মোট বাকি: </span>
                    <span className="money-neg font-semibold">
                      {formatCurrency(isNaN(netAmount) ? 0 : Math.max(0, netAmount))}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* SMS Button for Total Due */}
                  {netAmount > 0 && (
                    <button
                      onClick={handleSendTotalDueSms}
                      disabled={isSendingTotalDueSms}
                      className="btn btn-ghost"
                      title="মোট বাকির জন্য এসএমএস পাঠান"
                      aria-label="মোট বাকির জন্য এসএমএস পাঠান"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>এসএমএস</span>
                    </button>
                  )}
                  <button
                    onClick={handleShowTransaction}
                    className="btn btn-primary"
                  >
                    নতুন হিসাব যোগ করুন
                  </button>
                </div>
              </div>
            </div>

            {duePayments.length === 0 ? (
              <div className="empty">
                <p className="font-medium text-slate-600">
                  বাকির খাতায় কিছু নেই
                </p>
                <p className="mt-1 text-sm">
                  বাকি বা জমার হিসাব যোগ করলে এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ক্রমিক</th>
                      <th>টাইপ</th>
                      <th className="cell-num">টাকার পরিমাণ</th>
                      <th>তারিখ</th>
                      <th className="cell-num">কাজ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duePayments.map((payment, index) => {
                      return (
                        <tr key={payment.id}>
                          <td className="cell-strong num">#{index + 1}</td>
                          <td>
                            <span
                              className={`badge ${
                                payment.type === "due"
                                  ? "badge-danger"
                                  : "badge-success"
                              }`}
                            >
                              {payment.type === "due" ? "বাকি" : "জমা"}
                            </span>
                          </td>
                          <td
                            className={`cell-num ${
                              payment.type === "due" ? "money-neg" : "money-pos"
                            }`}
                          >
                            {formatCurrency(
                              Math.abs(Number(payment.amount) || 0)
                            )}
                          </td>
                          <td>{formatDate(payment.created_at)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                onClick={() => handleSendNotification(payment)}
                                disabled={isSendingDuePaymentSms}
                                className="btn btn-ghost btn-sm"
                                title="এসএমএস পাঠান"
                              >
                                <MessageSquare className="h-4 w-4" />
                                <span>
                                  {isSendingDuePaymentSms ? "যাচ্ছে…" : "এসএমএস"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls for Due Payments */}
            {!duePaymentsPagination.isLoading && duePayments.length > 0 && (
              <div className="plane-section">
                <Pagination
                  currentPage={duePaymentsPagination.currentPage}
                  totalPages={duePaymentsPagination.totalPages}
                  totalItems={duePaymentsPagination.totalCount}
                  itemsPerPage={duePaymentsPagination.pageSize}
                  onPageChange={handleDuePaymentsPageChange}
                  onPageSizeChange={handleDuePaymentsPageSizeChange}
                />
              </div>
            )}
          </>
        )}

        {/* Gifts Tab */}
        {activeTab === "gifts" && (
          <>
            {/* Add Gift Section */}
            <div className="plane-section">
              <div className="section-title">নতুন গিফট যোগ করুন</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={selectedGift}
                  onChange={(e) => setSelectedGift(e.target.value)}
                  className="select"
                  aria-label="গিফট বেছে নিন"
                >
                  <option value="">গিফট বেছে নিন…</option>
                  {availableGifts.map((gift) => (
                    <option key={gift.id} value={gift.id.toString()}>
                      {gift.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={giftValue}
                  onChange={(e) => setGiftValue(e.target.value)}
                  placeholder="গিফটের দাম"
                  className="input"
                  aria-label="গিফটের দাম"
                />
                <button
                  onClick={handleAddGift}
                  disabled={!selectedGift || !giftValue || isAddingGift}
                  className="btn btn-primary"
                >
                  {isAddingGift ? "যোগ হচ্ছে…" : "গিফট যোগ করুন"}
                </button>
              </div>
            </div>

            <div className="plane-section">
              <div className="section-title">কাস্টমারের গিফট</div>
            </div>

            {gifts.length === 0 ? (
              <div className="empty">
                <Gift className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="font-medium text-slate-600">কোনো গিফট নেই</p>
                <p className="mt-1 text-sm">
                  উপর থেকে একটা গিফট যোগ করে শুরু করুন।
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>গিফট</th>
                      <th className="cell-num">দাম</th>
                      <th>দেওয়ার তারিখ</th>
                      <th>অবস্থা</th>
                      <th className="cell-num">কাজ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <tr key={gift.id}>
                        <td className="cell-strong">{gift.name}</td>
                        <td className="cell-num money-pos">
                          {formatCurrency(gift.value)}
                        </td>
                        <td>{formatDate(gift.date_given)}</td>
                        <td>
                          <span
                            className={`badge ${
                              gift.status === "active"
                                ? "badge-success"
                                : gift.status === "used"
                                ? "badge-muted"
                                : "badge-danger"
                            }`}
                          >
                            {gift.status === "active"
                              ? "চালু"
                              : gift.status === "used"
                              ? "ব্যবহার হয়েছে"
                              : "মেয়াদ শেষ"}
                          </span>
                        </td>
                        <td className="cell-num">
                          {gift.status === "active" ? (
                            <button
                              onClick={() => handleRedeemGift(gift.id)}
                              disabled={redeemingGiftIds.has(gift.id)}
                              className="btn btn-primary btn-sm"
                            >
                              {redeemingGiftIds.has(gift.id)
                                ? "হচ্ছে…"
                                : "ব্যবহার করুন"}
                            </button>
                          ) : (
                            <span className="text-slate-500">
                              {gift.status === "used"
                                ? "ব্যবহার হয়ে গেছে"
                                : "মেয়াদ শেষ"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls for Gifts */}
            {!giftsPagination.isLoading && gifts.length > 0 && (
              <div className="plane-section">
                <Pagination
                  currentPage={giftsPagination.currentPage}
                  totalPages={giftsPagination.totalPages}
                  totalItems={giftsPagination.totalCount}
                  itemsPerPage={giftsPagination.pageSize}
                  onPageChange={handleGiftsPageChange}
                  onPageSizeChange={handleGiftsPageSizeChange}
                />
              </div>
            )}
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <>
            {/* Points Summary and Redeem Section */}
            <div className="plane-section">
              <div className="section-title">কাস্টমারের অর্জন</div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span className="num font-semibold text-slate-900">
                      {achievements.reduce(
                        (total, achievement) => total + achievement.points,
                        0
                      )}{" "}
                      পয়েন্ট
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {achievements.length} টি অর্জন হয়েছে
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="কত পয়েন্ট ভাঙাবেন"
                    min="1"
                    max={achievements.reduce(
                      (total, achievement) => total + achievement.points,
                      0
                    )}
                    className="input w-40"
                    aria-label="কত পয়েন্ট ভাঙাবেন"
                  />
                  <button
                    onClick={handleRedeemPoints}
                    disabled={
                      !redeemAmount ||
                      isRedeeming ||
                      parseFloat(redeemAmount) <= 0
                    }
                    className="btn btn-primary"
                  >
                    {isRedeeming ? "হচ্ছে…" : "পয়েন্ট ভাঙান"}
                  </button>
                </div>
              </div>
            </div>

            {/* Achievements List */}
            {achievements.length === 0 ? (
              <div className="empty">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                <p className="font-medium text-slate-600">
                  এখনো কোনো অর্জন নেই
                </p>
                <p className="mt-1 text-sm">
                  কাজ করতে থাকলে অর্জন আর পয়েন্ট জমা হবে।
                </p>
              </div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>অর্জন</th>
                      <th>বিবরণ</th>
                      <th className="cell-num">পয়েন্ট</th>
                      <th>তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {achievements.map((achievement) => (
                      <tr key={achievement.id}>
                        <td className="cell-strong">
                          <span className="mr-2">{achievement.icon}</span>
                          {achievement.title}
                        </td>
                        <td>{achievement.description}</td>
                        <td className="cell-num">{achievement.points}</td>
                        <td>{formatDate(achievement.date_earned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls for Achievements */}
            {!achievementsPagination.isLoading && achievements.length > 0 && (
              <div className="plane-section">
                <Pagination
                  currentPage={achievementsPagination.currentPage}
                  totalPages={achievementsPagination.totalPages}
                  totalItems={achievementsPagination.totalCount}
                  itemsPerPage={achievementsPagination.pageSize}
                  onPageChange={handleAchievementsPageChange}
                  onPageSizeChange={handleAchievementsPageSizeChange}
                />
              </div>
            )}
          </>
        )}

        {/* Level Tab */}
        {activeTab === "level" && (
          <>
            {/* Current Level Section */}
            <div className="plane-section">
              <div className="section-title">এখনকার লেভেল</div>
              {customerLevel ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-amber-600" />
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {customerLevel.level.name} লেভেল
                      </h3>
                      <p className="text-xs text-slate-500">
                        দেওয়া হয়েছে {formatDate(customerLevel.assigned_date)}
                      </p>
                      {customerLevel.notes && (
                        <p className="mt-1 text-sm italic text-slate-500">
                          &ldquo;{customerLevel.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleRemoveLevel} className="btn btn-danger">
                    লেভেল সরান
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  এই কাস্টমারকে এখনো কোনো লেভেল দেওয়া হয়নি।
                </p>
              )}
            </div>

            {/* Assign Level Section */}
            <div className="plane-section">
              <div className="section-title">নতুন লেভেল দিন</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">লেভেল বেছে নিন</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="select"
                  >
                    <option value="">লেভেল বেছে নিন…</option>
                    {availableLevels
                      .filter((level) => level.is_active)
                      .map((level) => (
                        <option key={level.id} value={level.id.toString()}>
                          {level.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="label">নোট (ইচ্ছে হলে)</label>
                  <input
                    type="text"
                    value={levelNotes}
                    onChange={(e) => setLevelNotes(e.target.value)}
                    className="input"
                    placeholder="কেন লেভেল দিচ্ছেন লিখুন…"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAssignLevel}
                  disabled={!selectedLevel || isAssigningLevel}
                  className="btn btn-primary"
                >
                  {isAssigningLevel ? "দেওয়া হচ্ছে…" : "লেভেল দিন"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="modal-backdrop" onClick={handleCloseTransactionModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">নতুন হিসাব যোগ করুন</h2>
              <button
                onClick={handleCloseTransactionModal}
                className="text-slate-500 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="label">টাইপ</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      type: e.target.value as "due" | "advance",
                    })
                  }
                  className="select"
                >
                  <option value="due">বাকি</option>
                  <option value="advance">পরিশোধ / জমা</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="label">টাকার পরিমাণ</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="টাকার পরিমাণ লিখুন"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="label">নোট (ইচ্ছে হলে)</label>
                <textarea
                  rows={3}
                  value={transactionForm.note || ""}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      note: e.target.value,
                    })
                  }
                  className="textarea resize-none"
                  placeholder="এই হিসাবের জন্য নোট লিখুন (ইচ্ছে হলে)"
                />
              </div>

              {/* Notify Customer */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notify-customer"
                  checked={transactionForm.notifyCustomer}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      notifyCustomer: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label
                  htmlFor="notify-customer"
                  className="ml-2 text-sm text-slate-600"
                >
                  কাস্টমারকে এসএমএস দিয়ে জানান
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button
                onClick={handleCloseTransactionModal}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                onClick={handleSubmitTransaction}
                disabled={!transactionForm.amount}
                className="btn btn-primary"
              >
                হিসাব যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedDuePayment && (
        <div className="modal-backdrop" onClick={handleCloseNotes}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">হিসাবের নোট</h2>
              <button
                onClick={handleCloseNotes}
                className="text-slate-500 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                {selectedDuePayment.order_id ? (
                  <h3 className="text-sm font-medium text-slate-600">
                    অর্ডার #{selectedDuePayment.order_id}
                    {selectedDuePayment.order_number && (
                      <span className="text-slate-500">
                        {" "}
                        ({selectedDuePayment.order_number})
                      </span>
                    )}
                  </h3>
                ) : (
                  <h3 className="text-sm font-medium text-slate-600">
                    সাধারণ হিসাব (কোনো অর্ডার নেই)
                  </h3>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDuePayment.type === "due" ? "বাকি" : "জমা"} —{" "}
                  {formatCurrency(
                    Math.abs(Number(selectedDuePayment.amount) || 0)
                  )}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                {selectedDuePayment.notes ||
                  "এই হিসাবের কোনো নোট নেই।"}
              </p>
            </div>

            <div className="modal-foot">
              <button onClick={handleCloseNotes} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={() => handleSendNotification(selectedDuePayment)}
                disabled={isSendingSMS}
                className="btn btn-primary"
              >
                <MessageSquare className="h-4 w-4" />
                <span>
                  {isSendingSMS ? "এসএমএস যাচ্ছে…" : "এসএমএস দিয়ে মনে করিয়ে দিন"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Composer Modal */}
      {showSmsComposer && smsOrder && (
        <SmsComposer
          recipientName={customer?.name || ""}
          recipientPhone={customer?.phone || ""}
          initialMessage={smsMessage}
          onSend={handleSendSmsFromComposer}
          onCancel={handleCancelSms}
          isLoading={isSendingSms}
        />
      )}

      {/* Due Payment SMS Composer Modal */}
      {showDuePaymentSmsComposer && smsPayment && (
        <SmsComposer
          recipientName={customer?.name || ""}
          recipientPhone={customer?.phone || ""}
          initialMessage={duePaymentSmsMessage}
          onSend={handleSendSmsFromDuePaymentComposer}
          onCancel={handleCancelDuePaymentSms}
          isLoading={isSendingDuePaymentSms}
        />
      )}

      {/* Total Due SMS Composer Modal */}
      {showTotalDueSmsComposer && (
        <SmsComposer
          recipientName={customer?.name || ""}
          recipientPhone={customer?.phone || ""}
          initialMessage={totalDueSmsMessage}
          onSend={handleSendSmsFromTotalDueComposer}
          onCancel={handleCancelTotalDueSms}
          isLoading={isSendingTotalDueSms}
        />
      )}
    </div>
  );
}
