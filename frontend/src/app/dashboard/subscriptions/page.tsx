"use client";

import { useState, useEffect } from "react";
import { ApiService } from "../../../lib/api";

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

interface UserSubscription {
	plan?: {
		name: string;
	};
}

export default function SubscriptionsPage() {
	const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
	const [smsPackages, setSmsPackages] = useState<SmsPackage[]>([]);
	const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
	const [currentPlan, setCurrentPlan] = useState("free");
	const [isProcessing, setIsProcessing] = useState(false);
	const [loading, setLoading] = useState(true);

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
					subscriptionData = await ApiService.getMySubscription();
					console.log("Successfully fetched subscription:", subscriptionData);
				} catch (subscriptionError) {
					console.error("Failed to fetch user subscription:", subscriptionError);
					// Continue with null subscription
				}

				// Process plans data
				const processedPlans = (plansData || []).map((plan: any) => ({
					...plan,
					cta: plan.name === 'free' ? 'Start Free' : `Upgrade to ${plan.name}`,
					popular: plan.is_popular || false
				}));
				setPlans(processedPlans);

				// Process SMS packages data
				const processedPackages = (packagesData || []).map((pkg: any) => ({
					...pkg,
					sms: pkg.sms_count,
					popular: pkg.is_popular || false
				}));
				setSmsPackages(processedPackages);

				// Set current subscription
				setCurrentSubscription(subscriptionData);
				if (subscriptionData?.plan?.name) {
					setCurrentPlan(subscriptionData.plan.name.toLowerCase());
				}
				
				console.log("Finished fetching subscription data");
			} catch (error) {
				console.error('Failed to fetch subscription data:', error);
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
			const subscriptionData = await ApiService.getMySubscription();
			setCurrentSubscription(subscriptionData);
		} catch (error) {
			console.error('Failed to upgrade subscription:', error);
			alert('Failed to upgrade subscription. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleSmsPackagePurchase = async (packageId: number) => {
		try {
			setIsProcessing(true);
			await ApiService.purchaseSmsPackage(packageId);
			alert('SMS package purchased successfully!');
		} catch (error) {
			console.error('Failed to purchase SMS package:', error);
			alert('Failed to purchase SMS package. Please try again.');
		} finally {
			setIsProcessing(false);
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
						key={plan.id}					className={`relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-6 flex flex-col items-center transition-all duration-200 ${
						plan.popular
							? "border-cyan-500 ring-2 ring-cyan-500"
							: "border-slate-700/50"
					} ${plan.name === "free" ? "ring-2 ring-green-500" : currentPlan === plan.name ? "ring-2 ring-green-500" : ""}`}
					>
						{plan.popular && (
							<span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow">
								Most Popular
							</span>
						)}
						<h2 className="text-xl font-bold text-white mb-2">
							{plan.name}
						</h2>
						<p className="text-gray-300 mb-4 text-center text-sm">
							{plan.description}
						</p>
						<div className="mb-6">
							<span className="text-3xl font-bold text-white">
								{plan.price === 0
									? "Free"
									: `৳${plan.price}`}
							</span>
							{plan.price !== 0 && (
								<span className="text-slate-400 ml-1 text-base">
									/ {plan.period}
								</span>
							)}
						</div>
						<ul className="mb-6 space-y-2 w-full">
							{plan.features.map((feature, idx) => (
								<li key={idx} className="flex items-center text-slate-300 text-sm">
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
								: currentPlan === plan.name || isProcessing
								? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
								: plan.popular
								? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
								: "bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
							}`}
							disabled={plan.name === "free" || currentPlan === plan.name || isProcessing}
							onClick={() => handlePlanSelect(plan.name)}
						>
							{plan.name === "free"
								? "Current Plan"
								: currentPlan === plan.name
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
								onClick={() => pkg.id && handleSmsPackagePurchase(pkg.id)}
								disabled={isProcessing}
							>
								{isProcessing ? 'Processing...' : 'Purchase'}
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
