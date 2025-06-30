"use client";

import { useState } from "react";

const plans = [
	{
		id: "free",
		name: "Free",
		price: 0,
		period: "forever",
		description: "Perfect for small businesses getting started.",
		features: [
			"Up to 1,000 customers",
			"Up to 50 products",
			"Up to 5 suppliers",
			"SMS Marketing",
			"24/7 Support",
		],
		cta: "Start Free",
	},
	{
		id: "pro",
		name: "Pro",
		price: 399,
		period: "month",
		description: "For growing businesses that need more power.",
		features: [
			"Unlimited customers",
			"Unlimited products",
			"Unlimited suppliers",
			"SMS Marketing",
			"Online Shop",
			"Advanced Reporting",
			"Banking Support",
			"Priority 24/7 Support",
		],
		cta: "Upgrade to Pro",
		popular: true,
	},
];

const smsPackages = [
	{ sms: 33, price: 10.0 },
	{ sms: 83, price: 25.0 },
	{ sms: 166, price: 50.0 },
	{ sms: 333, price: 100.0 },
	{ sms: 690, price: 200.0 },
	{ sms: 1785, price: 500.0, popular: true },
	{ sms: 3700, price: 1000.0 },
	{ sms: 19230, price: 5000.0 },
];

export default function SubscriptionsPage() {
	const [currentPlan, setCurrentPlan] = useState("free");
	const [isProcessing, setIsProcessing] = useState(false);

	const handlePlanSelect = (planId: string) => {
		setIsProcessing(true);
		setTimeout(() => {
			setCurrentPlan(planId);
			setIsProcessing(false);
		}, 1200);
	};

	return (
		<div className="w-full max-w-6xl mx-auto sm:p-6 p-1 space-y-10">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
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
						className={`relative bg-slate-900/60 border rounded-xl p-8 flex flex-col items-center shadow-lg transition-all duration-200 ${
							plan.popular
								? "border-cyan-500 ring-2 ring-cyan-500"
								: "border-slate-700/50"
						} ${plan.id === "free" ? "ring-2 ring-green-500" : currentPlan === plan.id ? "ring-2 ring-green-500" : ""}`}
					>
						{plan.popular && (
							<span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
								Most Popular
							</span>
						)}
						<h2 className="text-2xl font-bold text-white mb-2">
							{plan.name}
						</h2>
						<p className="text-slate-400 mb-4 text-center">
							{plan.description}
						</p>
						<div className="mb-6">
							<span className="text-4xl font-bold text-white">
								{plan.price === 0
									? "Free"
									: `৳${plan.price}`}
							</span>
							{plan.price !== 0 && (
								<span className="text-slate-400 ml-1">
									/ {plan.period}
								</span>
							)}
						</div>
						<ul className="mb-6 space-y-2 w-full">
							{plan.features.map((feature, idx) => (
								<li key={idx} className="flex items-center text-slate-300">
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
							className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 mt-auto ${
							plan.id === "free"
								? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
								: currentPlan === plan.id || isProcessing
								? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
								: plan.popular
								? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
								: "bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
							}`}
							disabled={plan.id === "free" || currentPlan === plan.id || isProcessing}
							onClick={() => handlePlanSelect(plan.id)}
						>
							{plan.id === "free"
								? "Current Plan"
								: currentPlan === plan.id
								? "Current Plan"
								: isProcessing
								? "Processing..."
								: plan.cta}
						</button>
					</div>
				))}
			</div>

			{/* SMS Packages */}
			<div className="mt-12">
				<h3 className="text-xl font-bold text-slate-200 mb-2 text-center">
					SMS Packages
				</h3>
				<p className="text-slate-400 text-sm text-center mb-8">
					Buy SMS credits for your marketing campaigns. Credits never expire.
				</p>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
					{smsPackages.map((pkg, idx) => (
						<div
							key={idx}
							className={`relative bg-slate-900/60 border rounded-xl p-6 flex flex-col items-center shadow transition-all duration-200 ${
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
							<div className="text-2xl font-bold text-white mb-2">
								{pkg.sms.toLocaleString()} SMS
							</div>
							<div className="text-lg text-cyan-400 font-semibold mb-4">
								৳{pkg.price.toLocaleString()}
							</div>
							<div className="text-xs text-slate-400 mb-4">
								৳{(pkg.price / pkg.sms).toFixed(2)} per SMS
							</div>
							<button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 text-sm font-medium">
								Purchase
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
