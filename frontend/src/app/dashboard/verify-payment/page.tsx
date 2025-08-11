"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface PaymentData {
  accountName?: string;
  initialBalance?: number;
  planId?: number;
  packageId?: number;
  subscriptionId?: number;
}

interface VerificationResult {
  success: boolean;
  message: string;
  orderId?: string;
  paymentType?: string;
}

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifyPayment = useCallback(async () => {
    try {
      const orderId = searchParams.get("order_id");

      if (!orderId) {
        setResult({
          success: false,
          message: "No order ID found in URL parameters.",
        });
        setLoading(false);
        return;
      }

      console.log("Verifying payment for order:", orderId);
      console.log("Order ID type:", typeof orderId);
      console.log("Order ID length:", orderId?.length);

      // Verify payment with the backend
      const verifyResponse = await ApiService.verifyPayment(orderId);
      console.log("Payment verification response:", verifyResponse);

      // Check for successful payment using the same logic as banking page
      const isPaymentSuccessful =
        verifyResponse.shurjopay_message === "Success" ||
        verifyResponse.data?.shurjopay_message === "Success" ||
        verifyResponse.payment_verification_status === true ||
        verifyResponse.bank_status === "Completed";

      if (!isPaymentSuccessful) {
        console.log("Payment verification failed:", verifyResponse);
        setResult({
          success: false,
          message: verifyResponse.message || "Payment verification failed.",
        });
        setLoading(false);
        return;
      }

      console.log("Payment verification successful!");

      // Use the customer_order_id from the response if available, otherwise use the URL order_id
      const actualOrderId = verifyResponse.customer_order_id || orderId;
      console.log("Original order ID from URL:", orderId);
      console.log(
        "Customer order ID from response:",
        verifyResponse.customer_order_id
      );
      console.log("Using order ID for type detection:", actualOrderId);

      // Determine payment type based on order ID prefix
      console.log("Determining payment type for order ID:", actualOrderId);
      let paymentType = "";
      let activationResult = null;

      if (actualOrderId.startsWith("SUB-")) {
        console.log("Detected subscription payment");
        paymentType = "subscription";
        // Handle subscription activation
        const pendingSubscription = localStorage.getItem("pendingSubscription");
        if (pendingSubscription) {
          const subData = JSON.parse(pendingSubscription);
          activationResult = await ApiService.upgradeSubscription(
            subData.subscriptionId
          );
          localStorage.removeItem("pendingSubscription");
        }
      } else if (actualOrderId.startsWith("SMS-")) {
        console.log("Detected SMS package payment");
        paymentType = "sms_package";
        // Handle SMS package activation
        const pendingSmsPackage = localStorage.getItem("pendingSmsPackage");
        if (pendingSmsPackage) {
          const smsData = JSON.parse(pendingSmsPackage);
          activationResult = await ApiService.purchaseSmsPackage(
            smsData.packageId
          );
          localStorage.removeItem("pendingSmsPackage");
        }
      } else if (actualOrderId.startsWith("BANK-")) {
        console.log("Detected banking plan payment");
        paymentType = "banking_plan";
        console.log(
          "Processing banking plan payment for order:",
          actualOrderId
        );

        // Handle banking plan activation
        const pendingBankingPlan = localStorage.getItem("pendingBankingPlan");
        console.log(
          "Pending banking plan data from localStorage:",
          pendingBankingPlan
        );

        if (pendingBankingPlan) {
          const bankData: PaymentData = JSON.parse(pendingBankingPlan);
          console.log("Parsed banking plan data:", bankData);

          // Extract account ID from the order ID if accountName is not numeric
          let accountId = bankData.accountName || "";
          if (accountId && isNaN(Number(accountId))) {
            // If accountName is not numeric, try to extract from order ID
            const orderIdParts = actualOrderId.split("-");
            if (orderIdParts.length >= 3 && orderIdParts[0] === "BANK") {
              accountId = orderIdParts[1]; // The numeric account ID
              console.log("Extracted account ID from order ID:", accountId);
            }
          }

          if (!accountId) {
            console.error("No valid account ID found");
            activationResult = {
              success: false,
              message: "No valid account ID found",
            };
            localStorage.removeItem("pendingBankingPlan");
            return;
          }

          console.log("About to call activateBankingPlan with:", {
            account_id: accountId,
            plan_id: bankData.planId!,
            payment_order_id: actualOrderId,
            payment_amount: bankData.initialBalance!,
          });

          try {
            activationResult = await ApiService.activateBankingPlan({
              account_id: accountId,
              plan_id: bankData.planId!,
              payment_order_id: actualOrderId,
              payment_amount: bankData.initialBalance!,
            });
            console.log("Banking plan activation result:", activationResult);
          } catch (error) {
            console.error("Error activating banking plan:", error);
            activationResult = {
              success: false,
              message: "Failed to activate banking plan",
            };
          }

          localStorage.removeItem("pendingBankingPlan");
        } else {
          console.log("No pending banking plan data found in localStorage");
          // For banking payments, we should still try to activate even without localStorage data
          // We can extract info from the payment verification response
          console.log(
            "Attempting to activate banking plan using payment verification data"
          );

          try {
            // Extract account ID from the order ID format: BANK-{accountId}-{planType}
            const orderIdParts = actualOrderId.split("-");
            let extractedAccountId = null;
            let planType = "monthly"; // default

            if (orderIdParts.length >= 3 && orderIdParts[0] === "BANK") {
              extractedAccountId = orderIdParts[1]; // The numeric account ID
              planType = orderIdParts[2]; // monthly, yearly, etc.
            }

            console.log("Extracted account ID:", extractedAccountId);
            console.log("Extracted plan type:", planType);

            // Determine plan ID based on plan type
            let planId = 1; // Default to monthly
            if (planType === "yearly") {
              planId = 2; // Assuming yearly plan has ID 2
            }

            const amount =
              verifyResponse.amount ||
              verifyResponse.payable_amount ||
              verifyResponse.received_amount ||
              0;

            console.log(
              "Extracted from payment response - accountId:",
              extractedAccountId,
              "planId:",
              planId,
              "amount:",
              amount
            );

            if (extractedAccountId && !isNaN(Number(extractedAccountId))) {
              // Use the extracted numeric account ID
              activationResult = await ApiService.activateBankingPlan({
                account_id: extractedAccountId,
                plan_id: planId,
                payment_order_id: actualOrderId,
                payment_amount: amount,
              });
            } else {
              console.error(
                "Could not extract valid account ID from order ID:",
                actualOrderId
              );
              activationResult = {
                success: false,
                message: "Invalid account ID in order",
              };
            }
            console.log(
              "Banking plan activation result (fallback):",
              activationResult
            );
          } catch (error) {
            console.error("Error in fallback banking plan activation:", error);
            activationResult = {
              success: false,
              message: "Failed to activate banking plan (no pending data)",
            };
          }
        }
      } else {
        console.log("Unknown payment type for order ID:", actualOrderId);
        console.log(
          "Order ID does not match any known prefixes (SUB-, SMS-, BANK-)"
        );
        paymentType = "unknown";
      }

      // Set final result
      console.log("Setting final result. activationResult:", activationResult);
      console.log("Payment type:", paymentType);

      if (activationResult && activationResult.success) {
        console.log("Case 1: Activation successful");
        setResult({
          success: true,
          message: `Payment verified successfully! Your ${paymentType.replace(
            "_",
            " "
          )} has been activated.`,
          orderId: actualOrderId,
          paymentType,
        });
      } else if (activationResult && !activationResult.success) {
        console.log("Case 2: Activation failed");
        setResult({
          success: false,
          message:
            activationResult.message ||
            `Payment verified but ${paymentType.replace(
              "_",
              " "
            )} activation failed.`,
          orderId: actualOrderId,
          paymentType,
        });
      } else {
        console.log("Case 3: No activation result, showing general success");
        setResult({
          success: true,
          message: "Payment verified successfully!",
          orderId: actualOrderId,
          paymentType,
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setResult({
        success: false,
        message:
          "An error occurred during payment verification. Please contact support.",
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      verifyPayment();
    } else {
      setResult({
        success: false,
        message: "Please log in to verify your payment.",
      });
      setLoading(false);
    }
  }, [user, verifyPayment]);

  const handleReturnToDashboard = () => {
    router.push("/dashboard");
  };

  const handleRetry = () => {
    setLoading(true);
    setResult(null);
    verifyPayment();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-8">
          Payment Verification
        </h1>

        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        ) : result ? (
          <div className="text-center">
            {result.success ? (
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-700 mb-4">{result.message}</p>
                {result.orderId && (
                  <p className="text-sm text-gray-500 mb-4">
                    Order ID: {result.orderId}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-700 mb-4">{result.message}</p>
                {result.orderId && (
                  <p className="text-sm text-gray-500 mb-4">
                    Order ID: {result.orderId}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleReturnToDashboard}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
              {!result.success && (
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              No payment verification data found.
            </p>
            <button
              onClick={handleReturnToDashboard}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
