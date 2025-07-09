"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ApiService } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

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
  shurjopay_message?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  transaction_id?: string;
  status?: string;
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

  const { user, profile } = useAuth();
  const searchParams = useSearchParams();

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

  // Payment verification function
  const verifyPayment = useCallback(
    async (orderId: string) => {
      setPaymentVerificationLoader(true);
      try {
        const response = await ApiService.verifyPayment(orderId);
        if (response) {
          setVerifyPaymentDetails(response);

          if (response.shurjopay_message === "Success") {
            if (orderId.startsWith("SUB-")) {
              const pendingPlan = localStorage.getItem(
                "pending_subscription_plan"
              );
              if (pendingPlan) {
                try {
                  setIsUpdatingPlan(true);

                  const upgradeResponse = await ApiService.upgradeSubscription(
                    pendingPlan
                  );

                  if (upgradeResponse && upgradeResponse.success) {
                    localStorage.removeItem("pending_subscription_plan");

                    setSuccessMessage(
                      pendingPlan === "pro"
                        ? "🎉 Congratulations! Your Pro subscription is now active. You now have access to all premium features!"
                        : `Successfully upgraded to ${
                            pendingPlan.charAt(0).toUpperCase() +
                            pendingPlan.slice(1)
                          } plan!`
                    );
                    setShowSuccessMessage(true);
                    setCurrentPlan(pendingPlan);

                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    await refreshSubscriptionData();
                  } else {
                    setShowError(true);
                  }
                } catch (upgradeError) {
                  console.error(
                    "Failed to upgrade subscription after payment:",
                    upgradeError
                  );
                  setShowError(true);
                } finally {
                  setIsUpdatingPlan(false);
                }
              }
            }

            if (orderId.startsWith("SMS-")) {
              const pendingPackageId = localStorage.getItem(
                "pending_sms_package"
              );
              if (pendingPackageId) {
                try {
                  await ApiService.purchaseSmsPackage(
                    parseInt(pendingPackageId)
                  );
                  localStorage.removeItem("pending_sms_package");
                  setSuccessMessage(
                    "✅ SMS package purchased successfully! Your SMS credits have been added to your account."
                  );
                  setShowSuccessMessage(true);
                } catch (purchaseError) {
                  console.error(
                    "Failed to add SMS credits after payment:",
                    purchaseError
                  );
                  setShowError(true);
                }
              }
            }

            const url = new URL(window.location.href);
            url.searchParams.delete("order_id");
            window.history.replaceState({}, "", url.toString());
          }
        } else if (response && response.error) {
          console.error("Payment verification failed:", response.error);
          setShowError(true);
          localStorage.removeItem("pending_subscription_plan");
          localStorage.removeItem("pending_sms_package");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setShowError(true);
        localStorage.removeItem("pending_subscription_plan");
        localStorage.removeItem("pending_sms_package");
      } finally {
        setPaymentVerificationLoader(false);
      }
    },
    [
      refreshSubscriptionData,
      setCurrentPlan,
      setIsUpdatingPlan,
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
    if (orderId) {
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
        } catch (planError) {
          console.error("Failed to fetch subscription plans:", planError);
        }

        try {
          packagesData = await ApiService.getSmsPackages();
        } catch (packageError) {
          console.error("Failed to fetch SMS packages:", packageError);
        }

        try {
          subscriptionData = await ApiService.getMySubscription();
        } catch (subscriptionError) {
          console.error(
            "Failed to fetch user subscription:",
            subscriptionError
          );
        }

        // Process plans data
        const processedPlans = (plansData || []).map(
          (plan: SubscriptionPlan) => ({
            ...plan,
            cta:
              plan.name === "free" ? "Start Free" : `Upgrade to ${plan.name}`,
            popular: plan.is_popular || false,
          })
        );
        setPlans(processedPlans);

        // Process SMS packages data
        const processedPackages = (packagesData || []).map(
          (pkg: SmsPackage) => ({
            ...pkg,
            sms: pkg.sms_count,
            popular: pkg.is_popular || false,
          })
        );
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
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        setPlans([]);
        setSmsPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlanSelect = async (planName: string) => {
    if (planName === currentPlan) return;

    setIsProcessing(true);
    try {
      const upgradeResponse = await ApiService.upgradeSubscription(planName);

      if (upgradeResponse && upgradeResponse.success) {
        // Refresh subscription data
        await refreshSubscriptionData();
      } else {
        alert("Failed to upgrade subscription. Please try again.");
      }
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      alert("Failed to upgrade subscription. Please try again.");
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

      if (!user) {
        alert("Please log in to purchase SMS packages.");
        return;
      }

      // Generate a unique order ID using timestamp
      const uniqueOrderId = `SMS-${packageId}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Store the package ID for later use after payment verification
      localStorage.setItem("pending_sms_package", packageId.toString());

      // Validate required fields and provide defaults if missing
      const firstName = user.first_name || "User";
      const lastName = user.last_name || "";
      const address = profile?.address || "N/A";
      const city = profile?.city || "N/A";
      const phone = profile?.phone || profile?.contact_number || "N/A";
      const zip = profile?.post_code || "0000";

      // Create payment request
      const payment = await ApiService.makePayment({
        amount: packagePrice,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`,
        customer_address: address,
        customer_phone: phone,
        customer_city: city,
        customer_post_code: zip,
      });

      if (payment.checkout_url) {
        window.open(payment.checkout_url, "_blank");
      } else {
        console.error("Payment response:", payment);
        throw new Error("Failed to get payment URL. Please try again later.");
      }
    } catch (error) {
      console.error("Failed to purchase SMS package:", error);
      alert("Failed to purchase SMS package. Please try again.");
      localStorage.removeItem("pending_sms_package");
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

      if (!user) {
        alert("Please log in to upgrade your subscription.");
        return;
      }

      // Generate a unique order ID using timestamp
      const uniqueOrderId = `SUB-${planName.toUpperCase()}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Store the plan name for later use after payment verification
      localStorage.setItem("pending_subscription_plan", planName);

      // Validate required fields and provide defaults if missing
      const firstName = user.first_name || "User";
      const lastName = user.last_name || "";
      const address = profile?.address || "N/A";
      const city = profile?.city || "N/A";
      const phone = profile?.phone || profile?.contact_number || "N/A";
      const zip = profile?.post_code || "0000";

      // Create payment request
      const payment = await ApiService.makePayment({
        amount: planPrice,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`,
        customer_address: address,
        customer_phone: phone,
        customer_city: city,
        customer_post_code: zip,
      });

      if (payment.checkout_url) {
        window.open(payment.checkout_url, "_blank");
      } else {
        console.error("Payment response:", payment);
        throw new Error(
          "Failed to get payment URL. Please check your information and try again."
        );
      }
    } catch (error) {
      console.error("Failed to process subscription payment:", error);
      alert("Failed to process subscription payment. Please try again.");
      localStorage.removeItem("pending_subscription_plan");
    } finally {
      setIsSubscriptionPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto sm:p-6 p-2 space-y-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Subscriptions
          </h1>
          <p className="text-gray-400 text-base mt-2">
            Loading subscription plans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto sm:p-6 p-2 space-y-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Subscriptions
        </h1>
        <p className="text-gray-400 text-base mt-2">
          Choose the best plan for your business and buy SMS packages as needed.
        </p>
      </div>

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg mb-8">
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
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
          <div className="flex items-center">
            <svg
              className="w-8 h-8 mr-4 flex-shrink-0"
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
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Payment Successful!
              </h3>
              <p className="text-sm opacity-90">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-6 flex flex-col items-center transition-all duration-200 ${
              plan.popular
                ? "border-cyan-500 ring-2 ring-cyan-500"
                : "border-slate-700/50"
            } ${
              currentPlan === plan.name
                ? currentPlan === "pro"
                  ? "ring-2 ring-gradient-to-r from-green-400 to-green-500 bg-gradient-to-br from-green-500/10 to-green-600/10"
                  : "ring-2 ring-green-500"
                : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
                Most Popular
              </span>
            )}
            {currentPlan === plan.name && plan.name === "pro" && (
              <span className="absolute -top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                ✓ Active
              </span>
            )}
            <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
            <p className="text-gray-300 mb-4 text-center text-sm">
              {plan.description}
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white">
                {plan.price === 0 ? "Free" : `৳${plan.price}`}
              </span>
              {plan.price !== 0 && (
                <span className="text-slate-400 ml-1 text-base">
                  / {plan.period}
                </span>
              )}
            </div>
            <ul className="mb-6 space-y-2 w-full">
              {(plan.features || []).map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center text-slate-300 text-sm"
                >
                  <svg
                    className="w-4 h-4 text-cyan-400 mr-2"
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
                  {typeof feature === "string"
                    ? feature
                    : feature?.name || feature?.description || "Feature"}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 mt-auto text-sm ${
                currentPlan === plan.name ||
                isProcessing ||
                isSubscriptionPaymentLoading ||
                isUpdatingPlan
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : plan.popular
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  : "bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
              }`}
              disabled={
                currentPlan === plan.name ||
                isProcessing ||
                isSubscriptionPaymentLoading ||
                isUpdatingPlan
              }
              onClick={() => {
                if (plan.price > 0) {
                  handleSubscriptionPayment(plan.name, plan.price);
                } else {
                  handlePlanSelect(plan.name);
                }
              }}
            >
              {currentPlan === plan.name
                ? "Current Plan"
                : isProcessing || isSubscriptionPaymentLoading
                ? "Processing..."
                : isUpdatingPlan
                ? "Updating Plan..."
                : plan.price > 0
                ? `Pay ৳${plan.price} - Upgrade to ${
                    plan.name.charAt(0).toUpperCase() + plan.name.slice(1)
                  }`
                : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* SMS Packages */}
      <div className="mt-12">
        <h3 className="text-lg font-bold text-white mb-2 text-center">
          SMS Packages
        </h3>
        <p className="text-gray-400 text-sm text-center mb-8">
          Buy SMS credits for your marketing campaigns. Credits never expire.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {smsPackages.map((pkg, idx) => (
            <div
              key={idx}
              className={`relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-6 flex flex-col items-center transition-all duration-200 ${
                pkg.popular
                  ? "border-orange-500 ring-2 ring-orange-500"
                  : "border-slate-700/50"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
                  Popular
                </span>
              )}
              <div className="text-xl font-bold text-white mb-2">
                {(pkg.sms || pkg.sms_count).toLocaleString()} SMS
              </div>
              <div className="text-lg text-cyan-400 font-semibold mb-4">
                ৳{pkg.price.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mb-4">
                ৳{(pkg.price / (pkg.sms || pkg.sms_count)).toFixed(2)} per SMS
              </div>
              <button
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  pkg.id && handleSmsPackagePurchase(pkg.id, pkg.price)
                }
                disabled={isProcessing || isSmsPaymentLoading}
              >
                {isProcessing || isSmsPaymentLoading
                  ? "Processing..."
                  : `Pay ৳${pkg.price} - Purchase`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
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
              </div>

              {/* Error Message */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Verification Failed
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                We couldn&apos;t verify your payment. Please contact support if
                you believe this is an error.
              </p>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowError(false);
                  // Remove order_id from URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete("order_id");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Loader */}
      {paymentVerificationLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Verifying Payment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we verify your payment...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
