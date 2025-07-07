"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ApiService } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

interface SubscriptionPlan {
  id?: number;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
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

  // Payment verification states
  const [verifyPaymentDetails, setVerifyPaymentDetails] =
    useState<PaymentVerificationDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [paymentVerificationLoader, setPaymentVerificationLoader] =
    useState(false);

  const { user, profile } = useAuth();
  const searchParams = useSearchParams();

  // Payment verification function
  const verifyPayment = async (orderId: string) => {
    setPaymentVerificationLoader(true);
    try {
      const response = await ApiService.verifyPayment(orderId);
      console.log(response, "verify payment response 💸💸💸💸");
      if (response) {
        setVerifyPaymentDetails(response);

        // Show success modal if payment was successful
        if (response.shurjopay_message === "Success") {
          setShowPaymentModal(true);
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
  };

  // Check for payment verification on page load
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId) {
      verifyPayment(orderId);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting to fetch subscription data...");

        // Debug endpoints first
        try {
          await ApiService.debugSubscriptionEndpoints();
        } catch (debugError) {
          console.error("Debug endpoints failed:", debugError);
        }

        // Fetch data individually to identify which endpoint is failing
        let plansData = [];
        let packagesData = [];
        let subscriptionData = null;

        try {
          console.log("Fetching subscription plans...");
          plansData = await ApiService.getSubscriptionPlans();
          console.log("Successfully fetched plans:", plansData);
        } catch (planError) {
          console.error("Failed to fetch subscription plans:", planError);
          // Continue with empty plans array
        }

        try {
          console.log("Fetching SMS packages...");
          packagesData = await ApiService.getSmsPackages();
          console.log("Successfully fetched packages:", packagesData);
        } catch (packageError) {
          console.error("Failed to fetch SMS packages:", packageError);
          // Continue with empty packages array
        }

        try {
          console.log("Fetching user subscription...");
          //   subscriptionData = await ApiService.getMySubscription();
          //   console.log("Successfully fetched subscription:", subscriptionData);
        } catch (subscriptionError) {
          console.error(
            "Failed to fetch user subscription:",
            subscriptionError
          );
          // Continue with null subscription
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

        // // Set current subscription
        // if (subscriptionData?.plan?.name) {
        //   setCurrentPlan(subscriptionData.plan.name.toLowerCase());
        // }

        console.log("Finished fetching subscription data");
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        // Set empty arrays if API fails - no fallback data
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
      await ApiService.upgradeSubscription(planName);
      setCurrentPlan(planName);
      // Optionally refresh subscription data
      //   const subscriptionData = await ApiService.getMySubscription();
      //   if (subscriptionData?.plan?.name) {
      //     setCurrentPlan(subscriptionData.plan.name.toLowerCase());
      //   }
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
      const uniqueOrderId = `SMS-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Validate required fields and provide defaults if missing
      const firstName = user.first_name || "User";
      const lastName = user.last_name || "";
      const address = profile?.address || "N/A"; // Use profile address if available
      const company_address = profile?.company_address || "N/A"; // Use profile address if available
      const phone = profile?.phone || profile?.contact_number || "N/A"; // Use profile phone if available
      // Default city for SMS purchases
      const zip = "0000"; // Default zip for SMS purchases

      // Create payment request
      const payment = await ApiService.makePayment({
        amount: packagePrice,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`,
        customer_address: company_address,
        customer_phone: phone,
        customer_city: address,
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
      const uniqueOrderId = `SUB-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Validate required fields and provide defaults if missing
      // Validate required fields and provide defaults if missing
      const firstName = user.first_name || "User";
      const lastName = user.last_name || "";
      const address = profile?.address || "N/A"; // Use profile address if available
      const company_address = profile?.company_address || "N/A"; // Use profile address if available
      const phone = profile?.phone || profile?.contact_number || "N/A"; // Use profile phone if available
      // Default city for SMS purchases
      const zip = "0000"; // Default zip for SMS purchases

      // Create payment request
      const payment = await ApiService.makePayment({
        amount: planPrice,
        order_id: uniqueOrderId,
        currency: "BDT",
        customer_name: `${firstName} ${lastName}`,
        customer_address: company_address,
        customer_phone: phone,
        customer_city: address,
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
              plan.name === "free"
                ? "ring-2 ring-green-500"
                : currentPlan === plan.name
                ? "ring-2 ring-green-500"
                : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
                Most Popular
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
              {plan.features.map((feature, idx) => (
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
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 mt-auto text-sm ${
                plan.name === "free"
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : currentPlan === plan.name ||
                    isProcessing ||
                    isSubscriptionPaymentLoading
                  ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                  : plan.popular
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  : "bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
              }`}
              disabled={
                plan.name === "free" ||
                currentPlan === plan.name ||
                isProcessing ||
                isSubscriptionPaymentLoading
              }
              onClick={() =>
                plan.price > 0
                  ? handleSubscriptionPayment(plan.name, plan.price)
                  : handlePlanSelect(plan.name)
              }
            >
              {plan.name === "free"
                ? "Current Plan"
                : currentPlan === plan.name
                ? "Current Plan"
                : isProcessing || isSubscriptionPaymentLoading
                ? "Processing..."
                : plan.price > 0
                ? `Pay ৳${plan.price} - ${plan.cta}`
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

      {/* Payment Success Modal */}
      {showPaymentModal && verifyPaymentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
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
              </div>

              {/* Success Message */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your payment has been processed successfully.
              </p>

              {/* Payment Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  {verifyPaymentDetails.order_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Order ID:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {verifyPaymentDetails.order_id}
                      </span>
                    </div>
                  )}
                  {verifyPaymentDetails.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Transaction ID:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {verifyPaymentDetails.transaction_id}
                      </span>
                    </div>
                  )}
                  {verifyPaymentDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Amount:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ৳{verifyPaymentDetails.amount}
                      </span>
                    </div>
                  )}
                  {verifyPaymentDetails.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Status:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {verifyPaymentDetails.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  // Remove order_id from URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete("order_id");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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
