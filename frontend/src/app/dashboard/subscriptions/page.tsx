"use client";

import { useState } from "react";

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  buttonText: string;
  buttonAction: () => void;
}

export default function SubscriptionsPage() {
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCurrentPlan("pro");
      console.log("Upgraded to Pro plan");
    } catch (error) {
      console.error("Error upgrading plan:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setIsUpgrading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCurrentPlan("free");
      console.log("Downgraded to Free plan");
    } catch (error) {
      console.error("Error downgrading plan:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const plans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "forever",
      description: "Perfect for small businesses getting started",
      features: [
        { name: "Up to 1,000 customers", included: true, limit: "1,000" },
        { name: "Up to 50 products", included: true, limit: "50" },
        { name: "Up to 5 suppliers", included: true, limit: "5" },
        { name: "SMS Marketing", included: true },
        { name: "Online Shop", included: false },
      ],
      buttonText: currentPlan === "free" ? "Current Plan" : "Downgrade",
      buttonAction: currentPlan === "free" ? () => {} : handleDowngradeToFree,
    },
    {
      id: "pro",
      name: "Pro",
      price: billingPeriod === "monthly" ? 399 : 3990,
      period: billingPeriod === "monthly" ? "month" : "year",
      description: "For growing businesses that need more power",
      popular: true,
      features: [
        { name: "Unlimited customers", included: true, limit: "Unlimited" },
        { name: "Unlimited products", included: true, limit: "Unlimited" },
        { name: "Unlimited suppliers", included: true, limit: "Unlimited" },
        { name: "SMS Marketing", included: true },
        { name: "Online Shop", included: true },
      ],
      buttonText: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      buttonAction: currentPlan === "pro" ? () => {} : handleUpgradeToPro,
    },
  ];

  // Current usage stats (mock data)
  const currentUsage = {
    customers: 743,
    products: 35,
    suppliers: 3,
    smsThisMonth: 1250,
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Subscriptions
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your subscription plan and billing
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Current Plan: {plans.find((p) => p.id === currentPlan)?.name}
              </h2>
              <p className="text-slate-400">
                {currentPlan === "free"
                  ? "You are currently on the free plan"
                  : `Billed ${billingPeriod} • Next payment: January 28, 2025`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentPlan === "free"
                    ? "bg-gray-500/20 text-gray-400"
                    : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400"
                }`}
              >
                {currentPlan === "free" ? "Free" : "Pro"}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats (only show for free plan) */}
        {currentPlan === "free" && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Current Usage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Customers</span>
                  <span className="text-sm font-medium text-white">
                    {currentUsage.customers.toLocaleString()} / 1,000
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getUsagePercentage(currentUsage.customers, 1000) > 80
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : getUsagePercentage(currentUsage.customers, 1000) > 60
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-r from-cyan-500 to-cyan-600"
                    }`}
                    style={{
                      width: `${getUsagePercentage(
                        currentUsage.customers,
                        1000
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  {Math.round(getUsagePercentage(currentUsage.customers, 1000))}
                  % used
                </p>
              </div>

              {/* Products */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Products</span>
                  <span className="text-sm font-medium text-white">
                    {currentUsage.products} / 50
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getUsagePercentage(currentUsage.products, 50) > 80
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : getUsagePercentage(currentUsage.products, 50) > 60
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-r from-green-500 to-green-600"
                    }`}
                    style={{
                      width: `${getUsagePercentage(
                        currentUsage.products,
                        50
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  {Math.round(getUsagePercentage(currentUsage.products, 50))}%
                  used
                </p>
              </div>

              {/* Suppliers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Suppliers</span>
                  <span className="text-sm font-medium text-white">
                    {currentUsage.suppliers} / 5
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getUsagePercentage(currentUsage.suppliers, 5) > 80
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : getUsagePercentage(currentUsage.suppliers, 5) > 60
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                    }`}
                    style={{
                      width: `${getUsagePercentage(
                        currentUsage.suppliers,
                        5
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500">
                  {Math.round(getUsagePercentage(currentUsage.suppliers, 5))}%
                  used
                </p>
              </div>

              {/* SMS This Month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">SMS This Month</span>
                  <span className="text-sm font-medium text-white">
                    {currentUsage.smsThisMonth.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-green-400"
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
                  <span className="text-xs text-green-400">Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Period Toggle (only show if not on current plan) */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-1 flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-lg transition-all duration-200 relative ${
                billingPeriod === "yearly"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-slate-900/50 border rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
                plan.popular
                  ? "border-cyan-500 shadow-cyan-500/20 shadow-lg"
                  : "border-slate-700/50 hover:border-slate-600/50"
              } ${currentPlan === plan.id ? "ring-2 ring-cyan-500" : ""}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-400 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ৳{plan.price}
                  </span>
                  <span className="text-slate-400 ml-1">/{plan.period}</span>
                  {billingPeriod === "yearly" && plan.id === "pro" && (
                    <div className="text-sm text-green-400 mt-1">
                      Save ৳798 compared to monthly (17% off)
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {feature.included ? (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
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
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        feature.included ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {feature.name}
                    </span>
                    {feature.limit && (
                      <span className="text-xs text-slate-400 ml-auto">
                        {feature.limit}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action button */}
              <button
                onClick={plan.buttonAction}
                disabled={currentPlan === plan.id || isUpgrading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  currentPlan === plan.id
                    ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                    : plan.popular
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    : "bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
                } ${isUpgrading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isUpgrading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* SMS Packages Section */}
        <div className="mt-12 max-w-7xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-200 mb-2">
              SMS Packages
            </h3>
            <p className="text-slate-400 text-sm">
              Choose the perfect SMS package for your marketing campaigns
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* First Row - Smaller Packages */}
            {[
              { sms: 33, price: 10.0, icon: "📱" },
              { sms: 83, price: 25.0, icon: "💬" },
              { sms: 166, price: 50.0, icon: "📨" },
              { sms: 333, price: 100.0, icon: "📢" },
            ].map((pkg, index) => (
              <div
                key={index}
                className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-400 truncate">
                      {pkg.sms} SMS
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ৳{pkg.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full bg-orange-500/20 p-3 flex-shrink-0 ml-2">
                    <svg
                      className="w-6 h-6 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 text-sm font-medium">
                  Purchase Package
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Second Row - Larger Packages */}
            {[
              { sms: 690, price: 200.0, popular: false },
              { sms: 1785, price: 500.0, popular: true },
              { sms: 3700, price: 1000.0, popular: false },
              { sms: 19230, price: 5000.0, popular: false },
            ].map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-slate-900/50 border rounded-xl p-4 hover:border-slate-600/50 transition-all duration-200 ${
                  pkg.popular
                    ? "border-orange-500 shadow-orange-500/20 shadow-lg"
                    : "border-slate-700/50"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-400 truncate">
                      {pkg.sms.toLocaleString()} SMS
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ৳{pkg.price.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-3 flex-shrink-0 ml-2 ${
                      pkg.popular ? "bg-orange-500/30" : "bg-orange-500/20"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${
                        pkg.popular ? "text-orange-400" : "text-orange-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-orange-400 mb-3">
                  ৳{(pkg.price / pkg.sms).toFixed(2)} per SMS
                </p>
                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                    pkg.popular
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      : "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  }`}
                >
                  Purchase Package
                </button>
              </div>
            ))}
          </div>

          {/* SMS Package Features */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-cyan-400"
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
                  Package Features
                </h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3"></div>
                    SMS credits never expire
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3"></div>
                    Send to any mobile number in Bangladesh
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-3"></div>
                    Real-time delivery reports
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  Marketing Tools
                </h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                    Bulk SMS campaigns
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                    Customer segmentation
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                    24/7 customer support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-2">Need Help?</h3>
            <p className="text-slate-400 mb-4">
              Our support team is here to help you choose the right plan for
              your business.
            </p>
            <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
