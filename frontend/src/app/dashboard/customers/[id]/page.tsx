"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import {
  Order as CustomerOrder,
  OrderItem as CustomerOrderItem,
  customersAPI,
} from "@/lib/api/customers";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Gift,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  ShoppingBag,
  Star,
  StickyNote,
  Trophy,
  X,
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
  email: string;
  phone: string;
  address?: string;
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
  customer_phone?: string;
  customer_email?: string;
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
  order_id: number;
  amount: number;
  due_date: string;
  type: "due" | "advance";
  notes?: string;
}

interface AvailableGift {
  id: number;
  name: string;
}

interface TransactionForm {
  type: "due" | "advance";
  amount: string;
  due_date: string;
  note: string;
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
  const formatCurrency = useCurrencyFormatter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duePayments, setDuePayments] = useState<DuePayment[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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
    due_date: "",
    note: "",
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
  const [redeemingGiftIds, setRedeemingGiftIds] = useState<Set<number>>(
    new Set()
  );
  const [isSendingSMS, setIsSendingSMS] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
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
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address || "",
        });

        // Set customer level from customer data
        if (customerData.current_level) {
          setCustomerLevel(customerData.current_level);
        }

        // Fetch orders for this customer
        const ordersData = await customersAPI.getOrders({
          customer: customerId,
        });
        console.log("Raw orders data:", ordersData);
        // Handle both array and paginated response
        let orders: CustomerOrder[] = [];
        if (Array.isArray(ordersData)) {
          orders = ordersData;
        } else if (ordersData && typeof ordersData === "object") {
          orders =
            (
              ordersData as {
                results?: CustomerOrder[];
                data?: CustomerOrder[];
              }
            ).results ||
            (
              ordersData as {
                results?: CustomerOrder[];
                data?: CustomerOrder[];
              }
            ).data ||
            [];
        }
        const formattedOrders = orders.map((order) => ({
          id: order.id,
          date: order.created_at,
          total: order.total_amount,
          status: order.status as "completed" | "pending" | "cancelled",
          items: order.items_count,
          order_number: order.order_number,
          items_details: order.items,
          customer_name: customerData.name,
          customer_phone: customerData.phone,
          customer_email: customerData.email,
        }));
        setOrders(formattedOrders);

        // Fetch due payments for this customer
        const duePaymentsData = await customersAPI.getDuePayments(customerId);
        console.log("Raw due payments data:", duePaymentsData);
        // Handle both array and paginated response
        let duePayments: unknown[] = [];
        if (Array.isArray(duePaymentsData)) {
          duePayments = duePaymentsData;
        } else if (duePaymentsData && typeof duePaymentsData === "object") {
          duePayments =
            (duePaymentsData as { results?: unknown[]; data?: unknown[] })
              .results ||
            (duePaymentsData as { results?: unknown[]; data?: unknown[] })
              .data ||
            [];
        }
        const formattedDuePayments = duePayments.map((payment) => ({
          id: payment.id,
          order_id: payment.order || 0,
          amount: payment.amount,
          due_date: payment.due_date,
          type: payment.payment_type as "due" | "advance",
          notes: payment.notes,
        }));
        setDuePayments(formattedDuePayments);

        // Fetch gifts for this customer
        const giftsData = await customersAPI.getCustomerGifts(customerId);
        console.log("Raw gifts data:", giftsData);
        // Handle both array and paginated response
        let gifts: unknown[] = [];
        if (Array.isArray(giftsData)) {
          gifts = giftsData;
        } else if (giftsData && typeof giftsData === "object") {
          gifts =
            (giftsData as { results?: unknown[]; data?: unknown[] }).results ||
            (giftsData as { results?: unknown[]; data?: unknown[] }).data ||
            [];
        }
        const formattedGifts = gifts.map((gift) => ({
          id: gift.id,
          name: gift.gift_name,
          description: gift.description || "",
          date_given: gift.created_at,
          value: gift.value,
          status: gift.status as "active" | "used" | "expired",
        }));
        setGifts(formattedGifts);

        // Fetch available gifts and levels
        const availableGiftsData = await customersAPI.getAvailableGifts();
        console.log("Raw available gifts data:", availableGiftsData);
        // Handle both array and paginated response
        let availableGifts: unknown[] = [];
        if (Array.isArray(availableGiftsData)) {
          availableGifts = availableGiftsData;
        } else if (
          availableGiftsData &&
          typeof availableGiftsData === "object"
        ) {
          availableGifts =
            (availableGiftsData as { results?: unknown[]; data?: unknown[] })
              .results ||
            (availableGiftsData as { results?: unknown[]; data?: unknown[] })
              .data ||
            [];
        }
        const formattedAvailableGifts = availableGifts.map((gift) => ({
          id: gift.id,
          name: gift.name,
        }));
        setAvailableGifts(formattedAvailableGifts);

        const availableLevelsData = await customersAPI.getAvailableLevels();
        console.log("Raw available levels data:", availableLevelsData);
        // Handle both array and paginated response
        let availableLevels: unknown[] = [];
        if (Array.isArray(availableLevelsData)) {
          availableLevels = availableLevelsData;
        } else if (
          availableLevelsData &&
          typeof availableLevelsData === "object"
        ) {
          availableLevels =
            (availableLevelsData as { results?: unknown[]; data?: unknown[] })
              .results ||
            (availableLevelsData as { results?: unknown[]; data?: unknown[] })
              .data ||
            [];
        }
        const formattedLevels = availableLevels.map((level) => ({
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
            title: "First Purchase",
            description: "Made your first purchase",
            icon: "🎉",
            date_earned: "2024-01-15",
            points: 100,
          },
          {
            id: 2,
            title: "Loyal Customer",
            description: "10+ orders completed",
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
  }, [params.id]);

  const handleShowInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
    setSelectedOrder(null);
  };

  const handleShowTransaction = () => {
    setShowTransactionModal(true);
    setTransactionForm({
      type: "due",
      amount: "",
      due_date: "",
      note: "",
      notifyCustomer: false,
    });
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setTransactionForm({
      type: "due",
      amount: "",
      due_date: "",
      note: "",
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
        alert(
          `SMS sent successfully to ${
            customer.phone
          }!\nMessage: "${message}"\nCredits used: ${
            response.credits_used || 1
          }`
        );
      } else {
        throw new Error(response.message || "Failed to send SMS");
      }
    } catch (error: unknown) {
      console.error("Failed to send SMS:", error);

      // Handle insufficient credits error specifically
      if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error as {
          response?: { status?: number; data?: unknown };
        };
        if (errorResponse.response?.status === 402) {
          const errorData = errorResponse.response.data;
          const errorMsg =
            errorData.message || errorData.error || "Insufficient SMS credits.";
          const confirmed = confirm(
            `${errorMsg}\n\nWould you like to buy more SMS credits?`
          );
          if (confirmed) {
            window.open("/dashboard/subscriptions", "_blank");
          }
        } else {
          // Handle other types of errors
          const errorMessage =
            errorResponse.response?.data?.message ||
            errorResponse.response?.data?.error ||
            "Unknown error occurred";
          alert(`Failed to send SMS: ${errorMessage}`);
        }
      } else {
        alert(
          `Failed to send SMS: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`
        );
      }
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleSendNotification = async (payment: DuePayment) => {
    const message = `Hello ${customer?.name}, this is a reminder about your ${
      payment.type === "due" ? "due payment" : "advance payment"
    } of ${formatCurrency(Math.abs(Number(payment.amount) || 0))} for order #${
      payment.order_id
    }. Due date: ${formatDate(payment.due_date)}.`;
    await handleSendSMS(message);
  };

  const handleSendOrderNotification = async (order: Order) => {
    const statusMessage =
      order.status === "completed"
        ? "completed"
        : order.status === "pending"
        ? "is pending"
        : "was cancelled";
    const message = `Hello ${customer?.name}, your order #${
      order.id
    } ${statusMessage}. Order total: ${formatCurrency(
      order.total
    )}. Order date: ${formatDate(order.date)}. Thank you for your business!`;
    await handleSendSMS(message);
  };

  const handleSubmitTransaction = async () => {
    if (!customer) return;

    try {
      // Validate required fields
      if (!transactionForm.amount || !transactionForm.due_date) {
        alert("Please fill in all required fields.");
        return;
      }

      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
      }

      // Create due payment entry
      const duePaymentData = {
        customer: customer.id,
        amount: transactionForm.type === "advance" ? -amount : amount, // Negative for advance
        payment_type: transactionForm.type,
        due_date: transactionForm.due_date,
        notes: transactionForm.note,
      };

      // Create due payment via API
      await customersAPI.createDuePayment(duePaymentData);

      alert(
        `Due payment added successfully! ${
          transactionForm.notifyCustomer
            ? "Customer will be notified via SMS."
            : ""
        }`
      );

      // Send SMS notification if requested
      if (transactionForm.notifyCustomer) {
        const message = `Hello ${
          customer.name
        }, this is a reminder about your ${
          transactionForm.type === "due" ? "due payment" : "advance payment"
        } of ${formatCurrency(amount)}. Due date: ${formatDate(
          transactionForm.due_date
        )}.`;
        await handleSendSMS(message);
      }

      // Refresh due payments
      const duePaymentsData = await customersAPI.getDuePayments(customer.id);
      const formattedDuePayments = duePaymentsData.map((payment) => ({
        id: payment.id,
        order_id: payment.order || 0,
        amount: payment.amount,
        due_date: payment.due_date,
        type: payment.payment_type as "due" | "advance",
        notes: payment.notes,
      }));
      setDuePayments(formattedDuePayments);

      // Close modal and reset form
      handleCloseTransactionModal();
    } catch (error) {
      console.error("Failed to add due payment:", error);
      alert("Failed to add due payment. Please try again.");
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
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGift = async () => {
    if (!selectedGift || !customer || !giftValue) return;

    const value = parseFloat(giftValue);
    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid gift value greater than 0.");
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
      alert("Gift added successfully!");
    } catch (error) {
      console.error("Failed to add gift:", error);
      alert("Failed to add gift. Please try again.");
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

      alert("Gift redeemed successfully!");
    } catch (error) {
      console.error("Failed to redeem gift:", error);
      alert("Failed to redeem gift. Please try again.");
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
      alert("Please enter a valid amount to redeem.");
      return;
    }

    if (amount > totalPoints) {
      alert(
        "Insufficient points. You cannot redeem more than your total points."
      );
      return;
    }

    setIsRedeeming(true);
    try {
      // Redeem points via API
      await customersAPI.redeemPoints(customer.id, amount);

      alert(`Successfully redeemed ${amount} points!`);
      setRedeemAmount("");

      // Refresh customer data to get updated points
      const updatedCustomer = await customersAPI.getCustomer(customer.id);
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error("Failed to redeem points:", error);
      alert("Failed to redeem points. Please try again.");
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
        alert("Level assigned successfully!");
      }
    } catch (error) {
      console.error("Failed to assign level:", error);
      alert("Failed to assign level. Please try again.");
    } finally {
      setIsAssigningLevel(false);
    }
  };

  const handleRemoveLevel = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCustomerLevel(null);
      alert("Level removed successfully!");
    } catch {
      alert("Failed to remove level. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <div className="h-6 bg-slate-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-100 mb-2">
              Customer Not Found
            </h3>
            <p className="text-slate-400 mb-4">
              The customer you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Go Back
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
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Back Button and Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Customers</span>
          </button>
        </div>

        {/* Customer Header */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {customer.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 max-w-5xl">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 text-sm">Total Orders</p>
                <p className="text-xl font-bold text-white mt-1">
                  {customer.total_orders}
                </p>
              </div>
              <ShoppingBag className="h-7 w-7 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300/80 text-sm">Total Spent</p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  {formatCurrency(customer.total_spent)}
                </p>
              </div>
              <DollarSign className="h-7 w-7 text-green-400" />
            </div>
          </div>

          <div
            className={`bg-gradient-to-br ${
              netAmount >= 0
                ? "from-red-500/10 to-pink-600/10 border-red-500/30"
                : "from-green-500/10 to-emerald-600/10 border-green-500/30"
            } border rounded-lg p-3`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`${
                    netAmount >= 0 ? "text-red-300/80" : "text-green-300/80"
                  } text-sm`}
                >
                  {netAmount >= 0 ? "Due Amount" : "Advance Amount"}
                </p>
                <p
                  className={`text-xl font-bold ${
                    netAmount >= 0 ? "text-red-400" : "text-green-400"
                  } mt-1`}
                >
                  {formatCurrency(isNaN(netAmount) ? 0 : Math.abs(netAmount))}
                </p>
              </div>
              <DollarSign
                className={`h-7 w-7 ${
                  netAmount >= 0 ? "text-red-400" : "text-green-400"
                }`}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300/80 text-sm">Active Gifts</p>
                <p className="text-xl font-bold text-purple-400 mt-1">
                  {gifts.filter((gift) => gift.status === "active").length}
                </p>
              </div>
              <Gift className="h-7 w-7 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl">
          <div className="flex border-b border-slate-700/50 mb-6">
            {[
              {
                key: "profile",
                label: "Profile",
                icon: <Mail className="w-4 h-4" />,
              },
              {
                key: "orders",
                label: "Purchase History",
                icon: <ShoppingBag className="w-4 h-4" />,
              },
              {
                key: "due-payments",
                label: "Due/Payments",
                icon: <DollarSign className="w-4 h-4" />,
              },
              {
                key: "gifts",
                label: "Gifts & Rewards",
                icon: <Gift className="w-4 h-4" />,
              },
              {
                key: "achievements",
                label: "Achievements",
                icon: <Trophy className="w-4 h-4" />,
              },
              {
                key: "level",
                label: "Level",
                icon: <Star className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.key
                    ? "border-cyan-400 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-slate-100 mb-4">
                    Customer Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter customer name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Member Since */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Member Since
                      </label>
                      <div className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-slate-400 text-sm">
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
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={customerForm.address}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                        placeholder="Enter customer address"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-100 mb-4">
                    Purchase History
                  </h4>
                  <div className="max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="col-span-2">Order ID</div>
                          <div className="col-span-2">Date</div>
                          <div className="col-span-2">Items</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-2">Actions</div>
                        </div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-white/5">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="px-6 py-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-100">
                                  #{order.id}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-300">
                                  {formatDate(order.date)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-slate-300">
                                  {order.items} items
                                </p>
                              </div>
                              <div className="col-span-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.status === "completed"
                                      ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                      : order.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30"
                                      : "bg-red-500/20 text-red-300 border border-red-400/30"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-semibold text-green-300">
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleShowInvoice(order)}
                                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>Invoice</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSendOrderNotification(order)
                                    }
                                    disabled={isSendingSMS}
                                    className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer disabled:opacity-50"
                                    title="Send SMS notification"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>
                                      {isSendingSMS ? "Sending..." : "SMS"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Due Payments Tab */}
            {activeTab === "due-payments" && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-100">
                      Due Payments
                    </h4>
                    <button
                      onClick={handleShowTransaction}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      Add Due Payment
                    </button>
                  </div>

                  <div className="max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="px-6 py-3 bg-white/5 border-b border-white/10">
                        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          <div className="col-span-2">Order ID</div>
                          <div className="col-span-3">Due Date</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-3">Notes & Actions</div>
                        </div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-white/5">
                        {duePayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="px-6 py-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-slate-100">
                                  #{payment.order_id}
                                </p>
                              </div>
                              <div className="col-span-3">
                                <p className="text-sm text-slate-300">
                                  {formatDate(payment.due_date)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    payment.type === "due"
                                      ? "bg-red-500/20 text-red-300 border border-red-400/30"
                                      : "bg-green-500/20 text-green-300 border border-green-400/30"
                                  }`}
                                >
                                  {payment.type === "due" ? "Due" : "Advance"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <p
                                  className={`text-sm font-semibold ${
                                    payment.type === "due"
                                      ? "text-red-300"
                                      : "text-green-300"
                                  }`}
                                >
                                  {formatCurrency(
                                    Math.abs(Number(payment.amount) || 0)
                                  )}
                                </p>
                              </div>
                              <div className="col-span-3">
                                <div className="flex items-center space-x-2">
                                  {payment.notes ? (
                                    <>
                                      <button
                                        onClick={() => handleShowNotes(payment)}
                                        className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer"
                                      >
                                        <StickyNote className="w-4 h-4" />
                                        <span>Notes</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleSendNotification(payment)
                                        }
                                        disabled={isSendingSMS}
                                        className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors cursor-pointer disabled:opacity-50"
                                        title="Send SMS notification"
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>
                                          {isSendingSMS ? "Sending..." : "SMS"}
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-slate-500 text-sm">
                                      No notes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gifts Tab */}
            {activeTab === "gifts" && (
              <div className="space-y-6">
                <div>
                  {/* Add Gift Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Add New Gift
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
                      <select
                        value={selectedGift}
                        onChange={(e) => setSelectedGift(e.target.value)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm cursor-pointer"
                      >
                        <option value="" className="bg-slate-800">
                          Select a gift...
                        </option>
                        {availableGifts.map((gift) => (
                          <option
                            key={gift.id}
                            value={gift.id.toString()}
                            className="bg-slate-800"
                          >
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
                        placeholder="Gift value ($)"
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                      />
                      <button
                        onClick={handleAddGift}
                        disabled={!selectedGift || !giftValue || isAddingGift}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                      >
                        {isAddingGift ? "Adding..." : "Add Gift"}
                      </button>
                    </div>
                  </div>

                  {/* Gifts List */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Customer Gifts
                    </h4>
                    <div className="max-w-4xl">
                      {gifts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <p>
                            No gifts found. Add a gift above to get started.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {gifts.map((gift) => (
                            <div
                              key={gift.id}
                              className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 min-w-[280px]"
                            >
                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  gift.status === "active"
                                    ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                    : gift.status === "used"
                                    ? "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                                    : "bg-red-500/20 text-red-300 border border-red-400/30"
                                }`}
                              >
                                {gift.status === "active"
                                  ? "Active"
                                  : gift.status === "used"
                                  ? "Used"
                                  : "Expired"}
                              </span>

                              {/* Gift Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white whitespace-nowrap">
                                    {gift.name}
                                  </span>
                                  <span className="text-green-400 font-semibold text-sm">
                                    {formatCurrency(gift.value)}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  Given: {formatDate(gift.date_given)}
                                </div>
                              </div>

                              {/* Action Button */}
                              {gift.status === "active" ? (
                                <button
                                  onClick={() => handleRedeemGift(gift.id)}
                                  disabled={redeemingGiftIds.has(gift.id)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                                >
                                  {redeemingGiftIds.has(gift.id)
                                    ? "Redeeming..."
                                    : "Redeem"}
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-md border border-gray-500/30">
                                  {gift.status === "used"
                                    ? "Redeemed"
                                    : "Expired"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div className="space-y-6">
                <div>
                  {/* Points Summary and Redeem Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Customer Achievements
                    </h4>
                    <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-5 w-5 text-amber-400" />
                          <span className="text-amber-300 font-semibold">
                            {achievements.reduce(
                              (total, achievement) =>
                                total + achievement.points,
                              0
                            )}{" "}
                            Total Points
                          </span>
                        </div>
                        <span className="text-slate-400 text-sm">
                          {achievements.length} achievements earned
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="Amount to redeem"
                          min="1"
                          max={achievements.reduce(
                            (total, achievement) => total + achievement.points,
                            0
                          )}
                          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm"
                        />
                        <button
                          onClick={handleRedeemPoints}
                          disabled={
                            !redeemAmount ||
                            isRedeeming ||
                            parseFloat(redeemAmount) <= 0
                          }
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          {isRedeeming ? "Redeeming..." : "Redeem Points"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Achievements List */}
                  <div className="mb-8">
                    <div className="max-w-4xl">
                      {achievements.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-400 mb-2">
                            No Achievements Yet
                          </h3>
                          <p className="text-slate-500">
                            Complete actions to earn achievements and points.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {achievements.map((achievement) => (
                            <div
                              key={achievement.id}
                              className="group bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center text-lg">
                                    {achievement.icon}
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-white text-sm leading-tight">
                                      {achievement.title}
                                    </h5>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
                                        ⭐ {achievement.points} pts
                                      </span>
                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                                        Completed
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-900/30 rounded p-2">
                                <div className="text-xs text-slate-300 mb-1">
                                  <strong>Description:</strong>{" "}
                                  {achievement.description}
                                </div>
                                <div className="text-xs text-slate-300">
                                  <strong>Earned:</strong>{" "}
                                  {formatDate(achievement.date_earned)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Level Tab */}
            {activeTab === "level" && (
              <div className="space-y-6">
                <div>
                  {/* Current Level Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Current Level
                    </h4>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      {customerLevel ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                              <Star className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">
                                {customerLevel.level.name} Level
                              </h3>
                              <p className="text-slate-300 text-sm mb-2">
                                Assigned on{" "}
                                {formatDate(customerLevel.assigned_date)}
                              </p>
                              {customerLevel.notes && (
                                <p className="text-slate-400 text-sm italic">
                                  &ldquo;{customerLevel.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveLevel}
                            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Remove Level
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-400 mb-2">
                            No Level Assigned
                          </h3>
                          <p className="text-slate-500">
                            This customer doesn&apos;t have a level assigned
                            yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assign Level Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Assign New Level
                    </h4>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Select Level
                            </label>
                            <select
                              value={selectedLevel}
                              onChange={(e) => setSelectedLevel(e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm cursor-pointer"
                            >
                              <option value="" className="bg-slate-800">
                                Select a level...
                              </option>
                              {availableLevels
                                .filter((level) => level.is_active)
                                .map((level) => (
                                  <option
                                    key={level.id}
                                    value={level.id.toString()}
                                    className="bg-slate-800"
                                  >
                                    {level.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Notes (Optional)
                            </label>
                            <input
                              type="text"
                              value={levelNotes}
                              onChange={(e) => setLevelNotes(e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                              placeholder="Reason for level assignment..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleAssignLevel}
                            disabled={!selectedLevel || isAssigningLevel}
                            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                          >
                            {isAssigningLevel ? "Assigning..." : "Assign Level"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl max-w-4xl w-full my-8 print:bg-white print:border-none print:shadow-none print:max-w-none print:my-0 print:mb-0">
                {/* Modal Header */}
                <div className="flex justify-end items-center p-6 border-b border-slate-700/50 print:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={handleCloseInvoice}
                      className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Invoice Content */}
                <div className="p-6 print:px-0 print:bg-white print:w-full">
                  {/* Invoice Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center justify-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center print:bg-gray-800">
                        <span className="text-white font-bold text-xs print:text-white">
                          Logo
                        </span>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold text-slate-100 print:text-gray-900">
                      Invoice #{selectedOrder.order_number || selectedOrder.id}
                    </h2>
                    <p className="text-sm text-slate-300 print:text-gray-600">
                      {formatDate(selectedOrder.date)}
                    </p>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid grid-cols-1 print:grid-cols-2 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                      <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                        <p className="font-medium text-slate-100 print:text-gray-900">
                          Your Store Name
                        </p>
                        <p>123 Business Street</p>
                        <p>City, State 12345</p>
                        <p>Phone: (555) 123-4567</p>
                        <p>Email: store@yourstore.com</p>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3 print:bg-transparent">
                      <div className="text-slate-300 print:text-gray-600 space-y-0.5 text-xs">
                        <p className="font-medium text-slate-100 print:text-gray-900">
                          {selectedOrder.customer_name || customer.name}
                        </p>
                        {selectedOrder.customer_phone && (
                          <p>{selectedOrder.customer_phone}</p>
                        )}
                        {selectedOrder.customer_email && (
                          <p>{selectedOrder.customer_email}</p>
                        )}
                      </div>
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
                        {/* Check if order has items details */}
                        {selectedOrder.items_details &&
                        selectedOrder.items_details.length > 0 ? (
                          // Multiple items - display all items
                          selectedOrder.items_details.map(
                            (item: CustomerOrderItem, index: number) => (
                              <tr
                                key={index}
                                className="border-b border-slate-700/30 print:border-gray-200"
                              >
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-slate-100 print:text-gray-900">
                                      {item.product_name}
                                    </p>
                                    {item.variant_name && (
                                      <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                                        {item.variant_name}
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
                                  {formatCurrency(item.total_price || 0)}
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          // Fallback - display basic order info
                          <tr className="border-b border-slate-700/30 print:border-gray-200">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-slate-100 print:text-gray-900">
                                  Order Items
                                </p>
                                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                                  {selectedOrder.items} items
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-slate-200 print:text-gray-800">
                              {selectedOrder.items}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-200 print:text-gray-800">
                              -
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-cyan-400 print:text-gray-900">
                              {formatCurrency(selectedOrder.total || 0)}
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
                              selectedOrder.items_details &&
                                selectedOrder.items_details.length > 0
                                ? selectedOrder.items_details.reduce(
                                    (sum, item) =>
                                      sum + (item.total_price || 0),
                                    0
                                  )
                                : selectedOrder.total || 0
                            )}
                          </span>
                        </div>
                        <div className="border-t border-slate-600/50 print:border-gray-300 pt-2">
                          <div className="flex justify-between text-base font-bold text-slate-100 print:text-gray-900">
                            <span>Total:</span>
                            <span className="text-cyan-400 print:text-gray-900">
                              {formatCurrency(
                                selectedOrder.items_details &&
                                  selectedOrder.items_details.length > 0
                                  ? selectedOrder.items_details.reduce(
                                      (sum, item) =>
                                        sum + (item.total_price || 0),
                                      0
                                    )
                                  : selectedOrder.total || 0
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
          </div>
        )}

        {/* Transaction Modal */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Add Due Payment
                  </h2>
                  <button
                    onClick={handleCloseTransactionModal}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  {/* Transaction Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          type: e.target.value as "due" | "advance",
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="due">Due</option>
                      <option value="advance">Payment/Advance</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount
                    </label>
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
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={transactionForm.due_date}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          due_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm"
                      required
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={transactionForm.note}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          note: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                      placeholder="Add a note for this transaction"
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
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                    />
                    <label
                      htmlFor="notify-customer"
                      className="ml-2 text-sm text-slate-300 cursor-pointer"
                    >
                      Notify customer via SMS
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseTransactionModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={
                      !transactionForm.amount || !transactionForm.due_date
                    }
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    Add Due Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedDuePayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">
                    Transaction Notes
                  </h2>
                  <button
                    onClick={handleCloseNotes}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">
                      Order #{selectedDuePayment.order_id}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {selectedDuePayment.type === "due"
                        ? "Due Payment"
                        : "Advance Payment"}{" "}
                      -{" "}
                      {formatCurrency(
                        Math.abs(Number(selectedDuePayment.amount) || 0)
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                    <p className="text-slate-100 text-sm leading-relaxed">
                      {selectedDuePayment.notes ||
                        "No notes available for this transaction."}
                    </p>
                  </div>

                  {/* SMS Notification Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSendNotification(selectedDuePayment)}
                      disabled={isSendingSMS}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>
                        {isSendingSMS ? "Sending SMS..." : "Send SMS Reminder"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
