"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface VerificationResult {
  success: boolean;
  message: string;
  orderId?: string;
  paymentType?: string;
}

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifiedOrderIdRef = useRef<string | null>(null);

  const verifyPayment = useCallback(async (spOrderId: string) => {
    try {
      console.log("Verifying payment for order:", spOrderId);
      console.log("Order ID type:", typeof spOrderId);
      console.log("Order ID length:", spOrderId?.length);

      // Verify payment with the backend
      const verifyResponse = await ApiService.verifyPayment(spOrderId);
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
          message: verifyResponse.message || "পেমেন্ট যাচাই করা যায়নি।",
        });
        setLoading(false);
        return;
      }

      console.log("Payment verification successful!");

      // Use the customer_order_id from the response if available, otherwise use the URL order_id
      const actualOrderId = verifyResponse.customer_order_id || spOrderId;
      console.log("Original order ID from URL:", spOrderId);
      console.log(
        "Customer order ID from response:",
        verifyResponse.customer_order_id
      );
      console.log("Using order ID for type detection:", actualOrderId);

      // Determine payment type based on order ID prefix
      console.log("Determining payment type for order ID:", actualOrderId);
      const paymentType =
        verifyResponse.payment_type ||
        (actualOrderId.startsWith("SUB-")
          ? "subscription"
          : actualOrderId.startsWith("SMS-")
          ? "sms_package"
          : actualOrderId.startsWith("BANK-")
          ? "banking_plan"
          : "unknown");

      const applied = verifyResponse.applied === true;

      let activationResult = null;

      if (actualOrderId.startsWith("BANK-")) {
        console.log("Detected banking plan payment");
        console.log(
          "Processing banking plan payment for order:",
          actualOrderId
        );

        // Handle banking plan activation
        const pendingBankingPlan = localStorage.getItem("pending_banking_plan");
        const pendingBankingAccount = localStorage.getItem("pending_banking_account");
        const pendingBankingPrice = localStorage.getItem("pending_banking_price");
        
        console.log("Pending banking plan data from localStorage:", {
          plan: pendingBankingPlan,
          account: pendingBankingAccount,
          price: pendingBankingPrice
        });

        if (pendingBankingPlan && pendingBankingAccount && pendingBankingPrice) {
          // Determine plan ID based on plan type
          const planId = pendingBankingPlan === "monthly" ? 1 : 2;
          const accountId = pendingBankingAccount;
          const paymentAmount = parseFloat(pendingBankingPrice);

          console.log("Processed banking plan data:", {
            planType: pendingBankingPlan,
            planId: planId,
            accountId: accountId,
            paymentAmount: paymentAmount
          });

          console.log("About to call activateBankingPlan with:", {
            account_id: accountId,
            plan_id: planId,
            payment_order_id: actualOrderId,
            payment_amount: paymentAmount,
          });

          try {
            activationResult = await ApiService.activateBankingPlan({
              account_id: accountId,
              plan_id: planId,
              payment_order_id: actualOrderId,
              payment_amount: paymentAmount,
            });
            console.log("Banking plan activation result:", activationResult);
          } catch (error) {
            console.error("Error activating banking plan:", error);
            activationResult = {
              success: false,
              message: "ব্যাংকিং প্ল্যান চালু করা যায়নি",
            };
          }

          localStorage.removeItem("pending_banking_plan");
          localStorage.removeItem("pending_banking_account");
          localStorage.removeItem("pending_banking_price");
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
                message: "অর্ডারে অ্যাকাউন্ট আইডি ঠিক নেই",
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
              message: "ব্যাংকিং প্ল্যান চালু করা যায়নি (দরকারি তথ্য পাওয়া যায়নি)",
            };
          }
        }
      } else {
        console.log("Non-banking payment type:", paymentType);
      }

      // Set final result
      console.log("Setting final result. activationResult:", activationResult);
      console.log("Payment type:", paymentType);

      if (paymentType === "banking_plan") {
        if (activationResult && activationResult.success) {
          console.log("Banking activation successful");
          setResult({
            success: true,
            message: "পেমেন্ট যাচাই হয়ে গেছে! আপনার ব্যাংকিং প্ল্যান চালু হয়েছে।",
            orderId: actualOrderId,
            paymentType,
          });
        } else if (activationResult && !activationResult.success) {
          console.log("Banking activation failed");
          setResult({
            success: false,
            message:
              activationResult.message ||
              "পেমেন্ট হয়েছে, কিন্তু ব্যাংকিং প্ল্যান চালু করা যায়নি।",
            orderId: actualOrderId,
            paymentType,
          });
        } else {
          setResult({
            success: true,
            message: "পেমেন্ট যাচাই হয়ে গেছে!",
            orderId: actualOrderId,
            paymentType,
          });
        }
      } else if (paymentType === "subscription") {
        await refreshProfile();
        setResult({
          success: true,
          message: applied
            ? "পেমেন্ট যাচাই হয়ে গেছে! আপনার সাবস্ক্রিপশন এখন চালু।"
            : "পেমেন্ট যাচাই হয়ে গেছে। সাবস্ক্রিপশন চালু হতে একটু সময় লাগবে।",
          orderId: actualOrderId,
          paymentType,
        });
      } else if (paymentType === "sms_package") {
        await refreshProfile();
        const creditsAdded =
          typeof verifyResponse.credits_added === "number"
            ? verifyResponse.credits_added
            : typeof verifyResponse.credits_added === "string"
            ? Number.parseInt(verifyResponse.credits_added, 10) || 0
            : 0;
        setResult({
          success: true,
          message: applied
            ? `পেমেন্ট যাচাই হয়ে গেছে! আপনার অ্যাকাউন্টে ${creditsAdded.toLocaleString()} এসএমএস ক্রেডিট যোগ হয়েছে।`
            : "পেমেন্ট যাচাই হয়ে গেছে। এসএমএস ক্রেডিট একটু পরেই যোগ হবে।",
          orderId: actualOrderId,
          paymentType,
        });
      } else {
        await refreshProfile();
        setResult({
          success: true,
          message: "পেমেন্ট যাচাই হয়ে গেছে!",
          orderId: actualOrderId,
          paymentType,
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setResult({
        success: false,
        message:
          "পেমেন্ট যাচাইয়ের সময় একটা সমস্যা হয়েছে। সাপোর্টে যোগাযোগ করুন।",
      });
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    const spOrderId = searchParams.get("order_id");

    if (!user) {
      setResult({
        success: false,
        message: "পেমেন্ট যাচাই করতে আগে লগইন করুন।",
      });
      setLoading(false);
      return;
    }

    if (!spOrderId) {
      if (!result) {
        setResult({
          success: false,
          message: "লিংকে কোনো অর্ডার আইডি পাওয়া যায়নি।",
        });
        setLoading(false);
      }
      return;
    }

    if (verifiedOrderIdRef.current === spOrderId) {
      return;
    }

    verifiedOrderIdRef.current = spOrderId;
    verifyPayment(spOrderId);
  }, [result, searchParams, user, verifyPayment]);

  const handleReturnToDashboard = () => {
    // Check if it's a banking payment based on the order ID or result
    const orderId = searchParams.get("order_id");
    if (orderId?.startsWith("BANK-") || result?.paymentType === "banking_plan") {
      router.push("/dashboard/banking");
    } else {
      router.push("/dashboard");
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setResult(null);
    const spOrderId = searchParams.get("order_id");
    if (!spOrderId) {
      setResult({
        success: false,
        message: "লিংকে কোনো অর্ডার আইডি পাওয়া যায়নি।",
      });
      setLoading(false);
      return;
    }

    verifiedOrderIdRef.current = null;
    verifyPayment(spOrderId);
  };

  const returnLabel = searchParams.get("order_id")?.startsWith("BANK-")
    ? "ব্যাংকিং-এ ফিরে যান"
    : "ড্যাশবোর্ডে ফিরে যান";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">পেমেন্ট যাচাই</h1>
          <p className="page-sub">আপনার পেমেন্ট ঠিকমতো হয়েছে কি না দেখুন</p>
        </div>
      </header>

      <div className="plane">
        {loading ? (
          <div className="empty">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-cyan-600" />
            <p>আপনার পেমেন্ট যাচাই করা হচ্ছে…</p>
          </div>
        ) : result ? (
          <>
            <div className="plane-section text-center">
              {result.success ? (
                <>
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    পেমেন্ট হয়ে গেছে!
                  </h2>
                </>
              ) : (
                <>
                  <XCircle className="mx-auto mb-3 h-10 w-10 text-rose-600" />
                  <h2 className="text-base font-semibold text-slate-900">
                    পেমেন্ট হয়নি
                  </h2>
                </>
              )}
              <p className="mt-2 text-sm text-slate-600">{result.message}</p>
              {result.orderId && (
                <p className="mt-2 text-xs text-slate-500">
                  অর্ডার আইডি: <span className="num">{result.orderId}</span>
                </p>
              )}
            </div>

            <div className="plane-section flex flex-wrap justify-center gap-2">
              <button
                onClick={handleReturnToDashboard}
                className="btn btn-primary"
              >
                {returnLabel}
              </button>
              {!result.success && (
                <button onClick={handleRetry} className="btn btn-ghost">
                  আবার চেষ্টা করুন
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="empty">পেমেন্ট যাচাইয়ের কোনো তথ্য পাওয়া যায়নি।</div>
            <div className="plane-section flex justify-center">
              <button
                onClick={handleReturnToDashboard}
                className="btn btn-primary"
              >
                {returnLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
