"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiService } from "../../../lib/api";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";

interface SubscriptionPlan {
  id?: number;
  name: string;
  price: number;
  period: string;
  description: string;
  features: (
    | string
    | { name?: string; description?: string; [key: string]: any }
  )[];
  cta?: string;
  is_popular?: boolean;
  popular?: boolean;
}

interface SmsPackage {
  id?: number;
  sms_count: number;
  sms?: number;
  price: number;
  is_popular?: boolean;
  popular?: boolean;
}

interface PaymentVerificationDetails {
  payment_id?: number;
  shurjopay_order_id?: string;
  merchant_invoice_no?: string;
  bank_trx_id?: string;
  currency?: string;
  amount?: number;
  payable_amount?: number;
  received_amount?: number;
  discount_amount?: number;
  discount_percent?: number;
  usd_amount?: number;
  usd_rate?: number;
  card_holder_name?: string;
  card_number?: string;
  transaction_status?: string;
  payment_method?: string;
  payment_confirmed_at?: string;
  payment_verification_status?: boolean;
  bank_status?: string;
  customer_order_id?: string;
  shurjopay_message?: string;
  shurjopay_code?: string;
  customer_phone_no?: string;
  customer_name?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  value1?: string;
  value2?: string;
  value3?: string;
  value4?: string;
  // Legacy structure for backward compatibility
  order_id?: string;
  status?: string;
  transaction_id?: string;
  data?: {
    shurjopay_message?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    transaction_id?: string;
    status?: string;
  };
  error?: {
    data?: {
      error?: string;
    };
  };
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [smsPackages, setSmsPackages] = useState<SmsPackage[]>([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubscriptionPaymentLoading, setIsSubscriptionPaymentLoading] =
    useState(false);
  const [isSmsPaymentLoading, setIsSmsPaymentLoading] = useState(false);
  /**
   * Which package / plan is mid-purchase.
   *
   * A single page-level boolean made every button show a spinner when one was
   * pressed, so the shopkeeper could not tell what they had actually clicked.
   */
  const [busyPackageId, setBusyPackageId] = useState<number | null>(null);
  const [busyPlanName, setBusyPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Payment verification states
  const [verifyPaymentDetails, setVerifyPaymentDetails] =
    useState<PaymentVerificationDetails | null>(null);
  const [showError, setShowError] = useState(false);
  const [paymentVerificationLoader, setPaymentVerificationLoader] =
    useState(false);

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "subscription" | "sms_package"
  >("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  const verifiedOrderIdRef = useRef<string | null>(null);

  const { user, profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  // Function to validate if user profile is complete for payment
  const validateProfileForPayment = async () => {
    if (!user) {
      toast.error("চালিয়ে যেতে আগে লগইন করুন।");
      return false;
    }

    const requiredFields = {
      "নাম": user.first_name,
      "ঠিকানা": profile?.address,
      "শহর": profile?.city,
      "ফোন": profile?.phone || profile?.contact_number,
      "পোস্ট কোড": profile?.post_code,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || value.trim() === "")
      .map(([field]) => field);

    if (missingFields.length > 0) {
      const missingFieldsList = missingFields.join(", ");
      const confirmRedirect = await confirm({
        title: "প্রোফাইল পুরো করা নেই",
        message: `পেমেন্টের জন্য এগুলো লাগবে: ${missingFieldsList}। এখনই প্রোফাইল পুরো করবেন?`,
        confirmLabel: "প্রোফাইলে যান",
      });

      if (confirmRedirect) {
        router.push("/dashboard/profile");
      }
      return false;
    }

    return true;
  };

  // Function to refresh subscription data
  const refreshSubscriptionData = useCallback(async () => {
    try {
      const subscriptionData = await ApiService.getMySubscription();
      if (
        subscriptionData?.success &&
        subscriptionData?.subscription?.plan?.name
      ) {
        const planName = subscriptionData.subscription.plan.name.toLowerCase();
        setCurrentPlan(planName);
      } else {
        setCurrentPlan("free");
      }
    } catch (error) {
      console.error("Failed to refresh subscription data:", error);
      setCurrentPlan("free");
    }
  }, [setCurrentPlan]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError(null);
      const response = await ApiService.getPaymentHistory({
        payment_type: historyFilter === "all" ? undefined : historyFilter,
        page_size: 50,
        ordering: "-created_at",
      });

      if (response && Array.isArray(response.results)) {
        setPaymentHistory(response.results);
      } else if (Array.isArray(response)) {
        setPaymentHistory(response);
      } else {
        setPaymentHistory([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch payment history:", error);
      setHistoryError(error?.message || "কেনাকাটার হিস্ট্রি লোড করা যায়নি");
      setPaymentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyFilter]);

  // Payment verification function
  const verifyPayment = useCallback(
    async (orderId: string) => {
      setPaymentVerificationLoader(true);
      try {
        const response = await ApiService.verifyPayment(orderId);
        console.log("Payment verification response:", response);

        if (response) {
          setVerifyPaymentDetails(response);

          // Check for successful payment - handle multiple possible response structures
          const isSuccessful =
            response.shurjopay_message === "Success" ||
            response.data?.shurjopay_message === "Success" ||
            response.payment_verification_status === true ||
            response.bank_status === "Completed";

          console.log("Payment verification success check:", {
            shurjopay_message: response.shurjopay_message,
            data_shurjopay_message: response.data?.shurjopay_message,
            payment_verification_status: response.payment_verification_status,
            bank_status: response.bank_status,
            isSuccessful,
          });

          if (isSuccessful) {
            // Use customer_order_id or fallback to orderId parameter
            const actualOrderId = response.customer_order_id || orderId;

            const paymentType =
              response.payment_type ||
              (actualOrderId.startsWith("SUB-")
                ? "subscription"
                : actualOrderId.startsWith("SMS-")
                ? "sms_package"
                : "unknown");

            const applied = response.applied === true;

            if (paymentType === "subscription") {
              setSuccessMessage(
                applied
                  ? "🎉 আপনার সাবস্ক্রিপশন এখন চালু।"
                  : "পেমেন্ট যাচাই হয়ে গেছে। সাবস্ক্রিপশন চালু হতে একটু সময় লাগবে।"
              );
              setShowSuccessMessage(true);
            } else if (paymentType === "sms_package") {
              const creditsAdded =
                typeof response.credits_added === "number"
                  ? response.credits_added
                  : typeof response.credits_added === "string"
                  ? Number.parseInt(response.credits_added, 10) || 0
                  : 0;
              setSuccessMessage(
                applied
                  ? `✅ এসএমএস প্যাকেজ কেনা হয়ে গেছে! আপনার অ্যাকাউন্টে ${creditsAdded.toLocaleString()} এসএমএস ক্রেডিট যোগ হয়েছে।`
                  : "পেমেন্ট যাচাই হয়ে গেছে। এসএমএস ক্রেডিট একটু পরেই যোগ হবে।"
              );
              setShowSuccessMessage(true);
            } else {
              setSuccessMessage("পেমেন্ট যাচাই হয়ে গেছে!");
              setShowSuccessMessage(true);
            }

            setIsUpdatingPlan(true);
            await refreshProfile();
            await refreshSubscriptionData();
            await fetchPaymentHistory();
            setIsUpdatingPlan(false);

            const url = new URL(window.location.href);
            url.searchParams.delete("order_id");
            window.history.replaceState({}, "", url.toString());
          } else {
            // Payment was not successful
            console.log("Payment verification failed - not successful:", {
              response,
              isSuccessful,
            });
            setShowError(true);
          }
        } else if (response && response.error) {
          console.error("Payment verification failed:", response.error);
          setShowError(true);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setShowError(true);
      } finally {
        setPaymentVerificationLoader(false);
      }
    },
    [
      fetchPaymentHistory,
      refreshSubscriptionData,
      refreshProfile,
      setIsUpdatingPlan,
      setCurrentPlan,
      setPaymentVerificationLoader,
      setShowError,
      setShowSuccessMessage,
      setSuccessMessage,
      setVerifyPaymentDetails,
    ]
  );

  // Check for payment verification on page load
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId && verifiedOrderIdRef.current !== orderId) {
      verifiedOrderIdRef.current = orderId;
      verifyPayment(orderId);
    }
  }, [searchParams, verifyPayment]);

  // Auto-hide success message after 10 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000); // Hide after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Periodic refresh of subscription data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !paymentVerificationLoader) {
        refreshSubscriptionData();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [loading, paymentVerificationLoader, refreshSubscriptionData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data individually to identify which endpoint is failing
        let plansData = [];
        let packagesData = [];
        let subscriptionData = null;

        try {
          plansData = await ApiService.getSubscriptionPlans();
          // Ensure plansData is an array
          if (!Array.isArray(plansData)) {
            console.warn("Plans data is not an array:", plansData);
            // Check if it's wrapped in a data property
            if (plansData && Array.isArray(plansData.data)) {
              plansData = plansData.data;
            } else {
              plansData = [];
            }
          }
        } catch (planError) {
          console.error("Failed to fetch subscription plans:", planError);
          plansData = [];
        }

        try {
          packagesData = await ApiService.getSmsPackages();
          // Ensure packagesData is an array
          if (!Array.isArray(packagesData)) {
            console.warn("Packages data is not an array:", packagesData);
            // Check if it's wrapped in a data property
            if (packagesData && Array.isArray(packagesData.data)) {
              packagesData = packagesData.data;
            } else {
              packagesData = [];
            }
          }
        } catch (packageError) {
          console.error("Failed to fetch SMS packages:", packageError);
          packagesData = [];
        }

        try {
          subscriptionData = await ApiService.getMySubscription();
        } catch (subscriptionError) {
          console.error(
            "Failed to fetch user subscription:",
            subscriptionError
          );
        }

        // Process plans data with additional safety checks
        const processedPlans = Array.isArray(plansData)
          ? plansData.map((plan: SubscriptionPlan) => ({
              ...plan,
              cta:
                plan.name === "free" ? "ফ্রি শুরু করুন" : `${plan.name} নিন`,
              popular: plan.is_popular || false,
            }))
          : [];
        setPlans(processedPlans);

        // Process SMS packages data with additional safety checks
        const processedPackages = Array.isArray(packagesData)
          ? packagesData.map((pkg: SmsPackage) => ({
              ...pkg,
              sms: pkg.sms_count,
              popular: pkg.is_popular || false,
            }))
          : [];
        setSmsPackages(processedPackages);

        // Set current subscription - default to free if no subscription found
        if (
          subscriptionData?.success &&
          subscriptionData?.subscription?.plan?.name
        ) {
          const planName =
            subscriptionData.subscription.plan.name.toLowerCase();
          setCurrentPlan(planName);
        } else {
          setCurrentPlan("free");
        }

        await fetchPaymentHistory();
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        setPlans([]);
        setSmsPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchPaymentHistory]);

  useEffect(() => {
    if (!loading) {
      fetchPaymentHistory();
    }
  }, [fetchPaymentHistory, loading]);

  const handlePlanSelect = async (planName: string) => {
    if (planName === currentPlan) return;

    setIsProcessing(true);
    try {
      const upgradeResponse = await ApiService.upgradeSubscription(planName);

      if (upgradeResponse && upgradeResponse.success) {
        // Refresh subscription data
        await refreshSubscriptionData();
      } else {
        toast.error("প্ল্যান আপগ্রেড করা যায়নি। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      toast.error("প্ল্যান আপগ্রেড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmsPackagePurchase = async (
    packageId: number,
    packagePrice: number
  ) => {
    try {
      setIsSmsPaymentLoading(true);

      // Validate profile completeness before proceeding
      if (!(await validateProfileForPayment())) {
        return;
      }

      console.log("=== SMS PACKAGE PAYMENT DEBUG ===");
      console.log("Package ID:", packageId, "Price:", packagePrice);
      console.log("User:", user);
      console.log("Profile:", profile);

      const minPayableAmount = 10;
      const qty =
        packagePrice > 0
          ? Math.max(1, Math.ceil(minPayableAmount / packagePrice))
          : 1;
      const totalAmount = Math.round(packagePrice * qty * 100) / 100;

      // Generate a unique order ID using timestamp
      const uniqueOrderId = `SMS-${packageId}-Q${qty}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Store the package ID for later use after payment verification
      // Get validated customer information from profile
      const firstName = user!.first_name!;
      const lastName = user!.last_name || "";
      const address = profile!.address!;
      const city = profile!.city!;
      const phone = profile!.phone || profile!.contact_number!;
      const zip = profile!.post_code!;

      const paymentData = {
        amount: totalAmount,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`.trim(),
        customer_address: address,
        customer_phone: phone,
        customer_city: city,
        customer_post_code: zip,
      };

      console.log("Payment data:", paymentData);

      // Create payment request
      const payment = await ApiService.makePayment(paymentData);

      console.log("Payment response:", payment);

      if (payment && payment.checkout_url) {
        console.log("Opening payment URL:", payment.checkout_url);
        window.open(payment.checkout_url, "_blank");
      } else {
        console.error("Payment response missing checkout_url:", payment);

        // Check if there's an error message in the response
        const errorMessage =
          payment?.error ||
          payment?.message ||
          "পেমেন্টের লিংক পাওয়া যায়নি। একটু পরে আবার চেষ্টা করুন।";

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("=== SMS PACKAGE PAYMENT ERROR ===");
      console.error("Error details:", error);

      // Type-safe error handling
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "এসএমএস প্যাকেজ কেনা যায়নি। আবার চেষ্টা করুন।";

      console.error("Error message:", errorMessage);
      toast.error(`পেমেন্টে সমস্যা: ${errorMessage}`);
    } finally {
      setIsSmsPaymentLoading(false);
    }
  };

  const handleSubscriptionPayment = async (
    planName: string,
    planPrice: number
  ) => {
    try {
      setIsSubscriptionPaymentLoading(true);

      // Validate profile completeness before proceeding
      if (!(await validateProfileForPayment())) {
        return;
      }

      console.log("=== SUBSCRIPTION PAYMENT DEBUG ===");
      console.log("Plan:", planName, "Price:", planPrice);
      console.log("User:", user);
      console.log("Profile:", profile);

      // Generate a unique order ID using timestamp
      const uniqueOrderId = `SUB-${planName.toUpperCase()}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Store the plan name for later use after payment verification
      // Get validated customer information from profile
      const firstName = user!.first_name!;
      const lastName = user!.last_name || "";
      const address = profile!.address!;
      const city = profile!.city!;
      const phone = profile!.phone || profile!.contact_number!;
      const zip = profile!.post_code!;

      const paymentData = {
        amount: planPrice,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`.trim(),
        customer_address: address,
        customer_phone: phone,
        customer_city: city,
        customer_post_code: zip,
      };

      console.log("Payment data:", paymentData);

      // Create payment request
      const payment = await ApiService.makePayment(paymentData);

      console.log("Payment response:", payment);

      if (payment && payment.checkout_url) {
        console.log("Opening payment URL:", payment.checkout_url);
        window.open(payment.checkout_url, "_blank");
      } else {
        console.error("Payment response missing checkout_url:", payment);

        // Check if there's an error message in the response
        const errorMessage =
          payment?.error ||
          payment?.message ||
          "পেমেন্টের লিংক পাওয়া যায়নি। তথ্যগুলো ঠিক আছে কি না দেখে আবার চেষ্টা করুন।";

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("=== SUBSCRIPTION PAYMENT ERROR ===");
      console.error("Error details:", error);

      // Type-safe error handling
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "সাবস্ক্রিপশনের পেমেন্ট করা যায়নি। আবার চেষ্টা করুন।";

      console.error("Error message:", errorMessage);

      // Show more specific error message
      toast.error(`পেমেন্টে সমস্যা: ${errorMessage}`);
    } finally {
      setIsSubscriptionPaymentLoading(false);
    }
  };

  const historyTotalItems = paymentHistory.length;
  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyTotalItems / historyPerPage)
  );

  // Reset to the first page whenever the history filter changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter]);

  // Never leave the user stranded past the last page
  useEffect(() => {
    setHistoryPage((prev) => Math.min(Math.max(prev, 1), historyTotalPages));
  }, [historyTotalPages]);

  const paginatedPaymentHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPerPage;
    return paymentHistory.slice(start, start + historyPerPage);
  }, [paymentHistory, historyPage, historyPerPage]);

  if (loading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">সাবস্ক্রিপশন</h1>
            <p className="page-sub">প্ল্যান লোড হচ্ছে…</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">সাবস্ক্রিপশন</h1>
          <p className="page-sub">
            ব্যবসার জন্য ঠিক প্ল্যানটা বেছে নিন, দরকার মতো এসএমএস প্যাকেজ কিনুন
          </p>
        </div>
      </header>

      <div className="plane">
        {/* Success message */}
        {showSuccessMessage && (
          <div className="plane-section flex items-start gap-3 bg-emerald-50">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-700">
                পেমেন্ট হয়ে গেছে!
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              aria-label="বার্তাটা সরান"
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Plans */}
        <div className="plane-section">
          <div className="section-title">প্ল্যান</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.name;
              const isDisabled =
                isCurrent ||
                busyPlanName !== null ||
                isSubscriptionPaymentLoading ||
                isUpdatingPlan ||
                (plan.name === "free" && currentPlan === "pro"); // Disable free plan when user has pro

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-lg border p-4 ${
                    isCurrent ? "border-cyan-600" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-slate-900">
                      {plan.name}
                    </h2>
                    {plan.popular && (
                      <span className="badge badge-info">সবচেয়ে জনপ্রিয়</span>
                    )}
                    {isCurrent && (
                      <span className="badge badge-success">চালু আছে</span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {plan.description}
                  </p>

                  <div className="mt-3">
                    <span className="text-2xl font-semibold text-slate-900 num">
                      {plan.price === 0 ? "ফ্রি" : `৳${plan.price}`}
                    </span>
                    {plan.price !== 0 && (
                      <span className="ml-1 text-sm text-slate-500">
                        / {plan.period}
                      </span>
                    )}
                  </div>

                  <ul className="mt-3 mb-4 space-y-1.5">
                    {(plan.features || []).map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-600" />
                        {typeof feature === "string"
                          ? feature
                          : feature?.name || feature?.description || "সুবিধা"}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn btn-primary mt-auto w-full"
                    disabled={isDisabled}
                    onClick={() => {
                      if (plan.price > 0) {
                        handleSubscriptionPayment(plan.name, plan.price);
                      } else {
                        setBusyPlanName(plan.name);
                        handlePlanSelect(plan.name).finally(() =>
                          setBusyPlanName(null)
                        );
                      }
                    }}
                  >
                    {isCurrent
                      ? "এখন এটাই চলছে"
                      : busyPlanName === plan.name
                      ? "পেমেন্টে যাচ্ছে…"
                      : isUpdatingPlan
                      ? "প্ল্যান আপডেট হচ্ছে…"
                      : plan.name === "free" && currentPlan === "pro"
                      ? "প্রো চালু আছে"
                      : plan.price > 0
                      ? `৳${plan.price} দিয়ে ${
                          plan.name.charAt(0).toUpperCase() + plan.name.slice(1)
                        } নিন`
                      : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SMS Packages */}
        <div className="plane-section">
          <div className="section-title">এসএমএস প্যাকেজ</div>
          <p className="mb-3 text-sm text-slate-600">
            মার্কেটিং-এর জন্য এসএমএস কিনে রাখুন। ক্রেডিটের মেয়াদ শেষ হয় না।
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {smsPackages.map((pkg, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-900 num">
                    {(pkg.sms || pkg.sms_count).toLocaleString()} এসএমএস
                  </span>
                  {pkg.popular && (
                    <span className="badge badge-warn">জনপ্রিয়</span>
                  )}
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900 num">
                  ৳{pkg.price.toLocaleString()}
                </div>
                <div className="mb-3 text-xs text-slate-500">
                  প্রতি এসএমএস ৳
                  {(pkg.price / (pkg.sms || pkg.sms_count)).toFixed(2)}
                </div>
                <button
                  className="btn btn-primary mt-auto w-full"
                  onClick={() => {
                    if (!pkg.id) return;
                    setBusyPackageId(pkg.id);
                    handleSmsPackagePurchase(pkg.id, pkg.price).finally(() =>
                      setBusyPackageId(null)
                    );
                  }}
                  // Siblings still disable — two payments at once would be
                  // worse than a wait — but only the pressed one says so.
                  disabled={busyPackageId !== null || isSmsPaymentLoading}
                >
                  {busyPackageId === pkg.id
                    ? "পেমেন্টে যাচ্ছে…"
                    : `৳${pkg.price} দিয়ে কিনুন`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase history */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="section-title mb-0">কেনাকাটার হিস্ট্রি</div>
            <select
              value={historyFilter}
              onChange={(e) =>
                setHistoryFilter(
                  e.target.value as "all" | "subscription" | "sms_package"
                )
              }
              className="select w-auto"
              aria-label="কেনাকাটার টাইপ"
            >
              <option value="all">সব</option>
              <option value="subscription">সাবস্ক্রিপশন</option>
              <option value="sms_package">এসএমএস</option>
            </select>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="empty">হিস্ট্রি লোড হচ্ছে…</div>
        ) : historyError ? (
          <div className="empty text-rose-600">{historyError}</div>
        ) : paymentHistory.length === 0 ? (
          <div className="empty">কোনো কেনাকাটা পাওয়া যায়নি।</div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>টাইপ</th>
                  <th className="cell-num">টাকার পরিমাণ</th>
                  <th>অবস্থা</th>
                  <th>অর্ডার</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPaymentHistory.map((tx: any) => {
                  const dateStr = tx.created_at
                    ? new Date(tx.created_at).toLocaleString()
                    : "-";
                  const typeLabel =
                    tx.payment_type === "subscription"
                      ? "সাবস্ক্রিপশন"
                      : tx.payment_type === "sms_package"
                      ? "এসএমএস"
                      : "জানা নেই";
                  const amountStr =
                    tx.amount !== null && tx.amount !== undefined
                      ? `৳${Number(tx.amount).toLocaleString()}`
                      : "-";
                  const statusLabel = tx.is_applied
                    ? "চালু হয়েছে"
                    : tx.is_successful
                    ? "পরিশোধ"
                    : "বাকি আছে";
                  const statusClass = tx.is_applied
                    ? "badge-success"
                    : tx.is_successful
                    ? "badge-info"
                    : "badge-warn";

                  return (
                    <tr key={tx.id}>
                      <td className="whitespace-nowrap num">{dateStr}</td>
                      <td className="whitespace-nowrap">{typeLabel}</td>
                      <td className="cell-num">{amountStr}</td>
                      <td>
                        <span className={`badge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="num">
                        {tx.customer_order_id || tx.sp_order_id || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="plane-section">
          <Pagination
            currentPage={historyPage}
            totalPages={historyTotalPages}
            totalItems={historyTotalItems}
            itemsPerPage={historyPerPage}
            onPageChange={setHistoryPage}
            onPageSizeChange={(pageSize) => {
              setHistoryPerPage(pageSize);
              setHistoryPage(1);
            }}
          />
        </div>
      </div>

      {/* Payment Error Modal */}
      {showError && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">পেমেন্ট যাচাই করা যায়নি</h2>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                আপনার পেমেন্ট যাচাই করা গেল না। ভুল কিছু মনে হলে সাপোর্টে
                যোগাযোগ করুন।
              </p>
            </div>
            <div className="modal-foot">
              <button
                onClick={() => {
                  setShowError(false);
                  // Remove order_id from URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete("order_id");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="btn btn-danger"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Loader */}
      {paymentVerificationLoader && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-body text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-cyan-600" />
              <h2 className="modal-title">পেমেন্ট যাচাই হচ্ছে</h2>
              <p className="mt-1 text-sm text-slate-600">
                একটু অপেক্ষা করুন, আপনার পেমেন্ট যাচাই করা হচ্ছে…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
