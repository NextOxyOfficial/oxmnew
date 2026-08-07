"use client";

import { useState, useEffect } from "react";
import CreditPackages from "@/components/sms/CreditPackages";
import SmsHistory from "./SmsHistory";
import { ApiService } from "../../../lib/api";
import { customersAPI } from "../../../lib/api/customers";
import employeeAPI from "../../../lib/employeeAPI";
import { calculateSmsSegments } from "../../../lib/utils/sms";

export default function SmsPage() {
	const [tab, setTab] = useState("custom");
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [showCreditError, setShowCreditError] = useState(false);
	const [contactsText, setContactsText] = useState("");
	const [contacts, setContacts] = useState<{ number: string; name: string }[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [employees, setEmployees] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [suppliers, setSuppliers] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [historyData, setHistoryData] = useState<any>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [smsCredits, setSmsCredits] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch real data for customers, employees, suppliers, SMS credits
	useEffect(() => {
		async function fetchData() {
			setIsLoading(true);
			try {
				// Fetch customers
				try {
					const customersData = await customersAPI.getCustomers();
					console.log("Raw customers data:", customersData);
					// Handle both array and paginated response
					let customers: any[] = [];
					if (Array.isArray(customersData)) {
						customers = customersData;
					} else if (customersData && typeof customersData === 'object') {
						customers = (customersData as any).results || (customersData as any).data || [];
					}
					const customersFormatted = customers.map((c: any) => ({ 
						id: c.id, 
						name: c.name, 
						phone: c.phone || c.mobile || c.contact_number || ''
					}));
					setCustomers(customersFormatted);
					console.log("Customers loaded:", customersFormatted.length);
				} catch (custError) {
					console.error("Failed to fetch customers:", custError);
					setCustomers([]);
				}

				// Fetch employees
				try {
					const employeesData = await employeeAPI.getEmployees();
					// Handle both array and paginated response
					const employees = Array.isArray(employeesData) ? employeesData : employeesData.results || [];
					const employeesFormatted = employees.map((e: any) => ({ 
						id: e.id, 
						name: e.name, 
						phone: e.phone || e.mobile || e.contact_number || ''
					}));
					setEmployees(employeesFormatted);
					console.log("Employees loaded:", employeesFormatted.length);
				} catch (empError) {
					console.error("Failed to fetch employees:", empError);
					setEmployees([]);
				}

				// Fetch suppliers
				try {
					const suppliersData = await ApiService.getSuppliers();
					console.log("Raw suppliers data:", suppliersData);
					// Handle both array and paginated response
					let suppliers: any[] = [];
					if (Array.isArray(suppliersData)) {
						suppliers = suppliersData;
					} else if (suppliersData && typeof suppliersData === 'object') {
						suppliers = (suppliersData as any).results || (suppliersData as any).data || [];
					}
					const suppliersFormatted = suppliers.map((s: any) => ({ 
						id: s.id, 
						name: s.name, 
						phone: s.phone || s.mobile || s.contact_number || ''
					}));
					setSuppliers(suppliersFormatted);
					console.log("Suppliers loaded:", suppliersFormatted.length);
				} catch (suppError) {
					console.error("Failed to fetch suppliers:", suppError);
					setSuppliers([]);
				}

				// Fetch SMS credits
				try {
					const creditsData = await ApiService.getSmsCredits();
					console.log("Credits response:", creditsData);
					// Handle different response formats
					let credits = 0;
					if (typeof creditsData === 'number') {
						credits = creditsData;
					} else if (creditsData && typeof creditsData.credits === 'number') {
						credits = creditsData.credits;
					} else if (creditsData && typeof creditsData.sms_credits === 'number') {
						credits = creditsData.sms_credits;
					} else if (creditsData && typeof creditsData.balance === 'number') {
						credits = creditsData.balance;
					}
					setSmsCredits(credits);
					console.log("SMS credits loaded:", credits);
				} catch (creditsError) {
					console.error("Failed to fetch SMS credits:", creditsError);
					setSmsCredits(0);
				}
			} catch (e) {
				console.error("General error in fetchData:", e);
				setSmsCredits(0);
			} finally {
				setIsLoading(false);
			}
		}
		fetchData();
	}, []);

	// Separate function to fetch SMS history with pagination
	const fetchSmsHistory = async (page: number = 1) => {
		setIsHistoryLoading(true);
		try {
			const historyData = await ApiService.getSmsHistory(page);
			console.log("SMS history data:", historyData);
			setHistoryData(historyData);
			setCurrentPage(page);
		} catch (error) {
			console.error("Failed to fetch SMS history:", error);
			setHistoryData(null);
		} finally {
			setIsHistoryLoading(false);
		}
	};

	// Fetch SMS history when component mounts or when history tab is selected
	useEffect(() => {
		if (tab === "history") {
			fetchSmsHistory(1);
		}
	}, [tab]);

	// Handle page change
	const handlePageChange = (page: number) => {
		fetchSmsHistory(page);
	};

	// Populate contactsText based on tab
	useEffect(() => {
		let lines: string[] = [];
		if (tab === "custom") {
			lines = contactsText.split("\n").filter(Boolean);
		} else if (tab === "customers") {
			// Only include customers with valid phone numbers
			lines = customers
				.filter((c) => c.phone && c.phone.trim() !== "")
				.map((c) => `${c.phone}, ${c.name}`);
		} else if (tab === "employees") {
			// Only include employees with valid phone numbers
			lines = employees
				.filter((e) => e.phone && e.phone.trim() !== "")
				.map((e) => `${e.phone}, ${e.name}`);
		} else if (tab === "suppliers") {
			// Only include suppliers with valid phone numbers
			lines = suppliers
				.filter((s) => s.phone && s.phone.trim() !== "")
				.map((s) => `${s.phone}, ${s.name}`);
		}
		setContactsText(lines.join("\n"));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab, customers, employees, suppliers]);

	// Parse contactsText into contacts array
	useEffect(() => {
		setContacts(
			contactsText
				.split("\n")
				.map((line) => {
					const [number, ...nameParts] = line.split(",");
					if (number && number.trim()) {
						return {
							number: number.trim(),
							name: nameParts.length ? nameParts.join(",").trim() : ""
						};
					}
					return null;
				})
				.filter(Boolean) as { number: string; name: string }[]
		);
	}, [contactsText]);

	const handleRemoveContact = (idx: number) => {
		const newContacts = contacts.filter((_, i) => i !== idx);
		setContactsText(newContacts.map((c) => `${c.number}, ${c.name}`).join("\n"));
	};

	const handleSend = async () => {
		if (!message.trim() || contacts.length === 0) {
			setStatus("মেসেজ লিখুন আর অন্তত একটা নম্বর দিন।");
			return;
		}

		// Calculate total SMS count needed using proper Unicode/Bengali counting
		const smsInfo = calculateSmsSegments(message);
		const smsPerMessage = smsInfo.segments;
		const totalSmsNeeded = contacts.length * smsPerMessage;
		
		console.log(`SMS calculation: ${message.length} chars, ${smsInfo.encoding} encoding, ${smsPerMessage} segments per message, ${totalSmsNeeded} total needed`);
		
		// Check if user has sufficient credits
		if (smsCredits !== null && smsCredits < totalSmsNeeded) {
			setStatus(`ক্রেডিট লাগবে ${totalSmsNeeded}টা, কিন্তু আছে মাত্র ${smsCredits}টা। প্রতিটা মেসেজে ${smsPerMessage}টা ক্রেডিট খরচ হয় (${smsInfo.encoding})।`);
			setShowCreditError(true);
			return;
		}

		setIsSending(true);
		setStatus(null);
		setShowCreditError(false);
		let successCount = 0;
		let failCount = 0;
		let creditsUsed = 0;

		for (const contact of contacts) {
			const name = contact.name && contact.name.trim() ? contact.name : contact.number;
			const personalizedMsg = message.replace(/\{name\}/gi, name);
			try {
				const response = await ApiService.sendSmsNotification(contact.number, personalizedMsg);
				if (response.success) {
					successCount++;
					creditsUsed += response.credits_used || smsPerMessage;
				} else {
					failCount++;
					// Set specific error message from backend
					if (response.error) {
						setStatus(`সমস্যা: ${response.error}`);
					}
				}
			} catch (e: any) {
				failCount++;
				// Handle insufficient credits error specifically
				if (e.response?.status === 402) {
					const errorData = e.response.data;
					setStatus(errorData.error || 'এসএমএস ক্রেডিট শেষ। আরও ক্রেডিট কিনে নিন।');
					setShowCreditError(true);
					setIsSending(false);
					return;
				} else {
					// Handle other types of errors
					const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'কিছু একটা সমস্যা হয়েছে';
					setStatus(`এসএমএস পাঠাতে সমস্যা: ${errorMessage}`);
					setShowCreditError(false);
				}
			}
		}

		// Update local SMS credits count and refresh from server
		if (creditsUsed > 0) {
			// Update local count immediately for better UX
			if (smsCredits !== null) {
				setSmsCredits(smsCredits - creditsUsed);
			}
			
			// Also refresh from server to ensure accuracy
			try {
				const creditsData = await ApiService.getSmsCredits();
				let credits = 0;
				if (typeof creditsData === 'number') {
					credits = creditsData;
				} else if (creditsData && typeof creditsData.credits === 'number') {
					credits = creditsData.credits;
				}
				setSmsCredits(credits);
			} catch (error) {
				console.error("Failed to refresh SMS credits after sending:", error);
			}
		}

		if (successCount > 0) {
			setStatus(`সফলভাবে ${successCount} জনকে এসএমএস পাঠানো হয়েছে। ${creditsUsed}টা ক্রেডিট খরচ হয়েছে।`);
			setShowCreditError(false);
			setTimeout(() => setStatus(null), 5000);
			
			// Refresh SMS history if we're on the history tab
			if (tab === "history") {
				fetchSmsHistory(currentPage);
			}
		} else if (failCount > 0 && !showCreditError) {
			setStatus("এসএমএস পাঠানো যায়নি। উপরের সমস্যাটা একবার দেখুন।");
			setShowCreditError(false);
		}
		setIsSending(false);
	};

	const tabs = [
		{ id: "custom", label: "নিজে লিখে" },
		{ id: "customers", label: "সব কাস্টমার" },
		{ id: "employees", label: "সব কর্মচারী" },
		{ id: "suppliers", label: "সব সাপ্লায়ার" },
		{ id: "history", label: "পাঠানোর হিস্ট্রি" },
		{ id: "buy", label: "ক্রেডিট কিনুন" },
	];

	const perMessageSegments = calculateSmsSegments(message).segments;
	const estimatedCost = contacts.length * perMessageSegments;
	const notEnoughCredits = smsCredits !== null && smsCredits < estimatedCost;

	return (
		<div className="page">
			<header className="page-head">
				<div>
					<h1 className="page-title">এসএমএস সেন্টার</h1>
					<p className="page-sub">একজনকে, সব কাস্টমারকে বা সব কর্মচারীকে এসএমএস পাঠান</p>
				</div>
				<button
					type="button"
					onClick={() => setTab("buy")}
					className="btn btn-primary"
				>
					ক্রেডিট কিনুন
				</button>
			</header>

			<div className="plane">
				{/* Credits & cost at a glance */}
				<div className="stat-strip">
					<div className="stat">
						<div className="stat-label">এসএমএস ক্রেডিট</div>
						<div className="stat-value num">
							{isLoading ? "…" : smsCredits === null ? "—" : smsCredits.toLocaleString()}
						</div>
						<div className="stat-meta">
							{isLoading ? "লোড হচ্ছে…" : smsCredits === null ? "আনতে সমস্যা হয়েছে" : "এখনো বাকি আছে"}
						</div>
					</div>
					<div className="stat">
						<div className="stat-label">নম্বর ধরা হয়েছে</div>
						<div className="stat-value num">{contacts.length}</div>
						<div className="stat-meta">যাদের কাছে যাবে</div>
					</div>
					<div className="stat">
						<div className="stat-label">প্রতি মেসেজে</div>
						<div className="stat-value num">{message ? perMessageSegments : 0}</div>
						<div className="stat-meta">ক্রেডিট খরচ হবে</div>
					</div>
					<div className="stat">
						<div className="stat-label">মোট খরচ</div>
						<div className={`stat-value num ${notEnoughCredits ? "money-neg" : ""}`}>
							{message ? estimatedCost : 0}
						</div>
						<div className="stat-meta">
							{notEnoughCredits ? "ক্রেডিট কম পড়েছে" : "আনুমানিক হিসাব"}
						</div>
					</div>
				</div>

				{/* Tabs live in the same plane */}
				<div className="plane-section">
					<div className="flex flex-wrap items-center gap-2">
						{tabs.map((t) => (
							<button
								key={t.id}
								className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
								onClick={() => setTab(t.id)}
							>
								{t.label}
								{t.id === "history" && (
									<span className="num opacity-75">({historyData?.count || 0})</span>
								)}
							</button>
						))}
						<button
							onClick={async () => {
								setIsLoading(true);
								try {
									const creditsData = await ApiService.getSmsCredits();
									let credits = 0;
									if (typeof creditsData === 'number') {
										credits = creditsData;
									} else if (creditsData && typeof creditsData.credits === 'number') {
										credits = creditsData.credits;
									}
									setSmsCredits(credits);
								} catch (error) {
									console.error("Failed to refresh SMS credits:", error);
								} finally {
									setIsLoading(false);
								}
							}}
							disabled={isLoading}
							className="btn btn-ghost btn-sm ml-auto"
							aria-label="ক্রেডিট আবার দেখুন"
							title="ক্রেডিট আবার দেখুন"
						>
							<svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							ক্রেডিট রিফ্রেশ
						</button>
					</div>
				</div>

				{/* Note about contacts without phone numbers */}
				{tab !== "history" && tab !== "custom" && (
					<div className="plane-section">
						<p className="text-xs text-slate-500">
							যাদের ফোন নম্বর দেওয়া আছে শুধু তাদেরই দেখানো হচ্ছে।
							{tab === "customers" && customers.length > customers.filter(c => c.phone && c.phone.trim() !== "").length &&
								` নম্বর না থাকায় ${customers.length - customers.filter(c => c.phone && c.phone.trim() !== "").length} জন কাস্টমার বাদ পড়েছে।`}
							{tab === "employees" && employees.length > employees.filter(e => e.phone && e.phone.trim() !== "").length &&
								` নম্বর না থাকায় ${employees.length - employees.filter(e => e.phone && e.phone.trim() !== "").length} জন কর্মচারী বাদ পড়েছে।`}
							{tab === "suppliers" && suppliers.length > suppliers.filter(s => s.phone && s.phone.trim() !== "").length &&
								` নম্বর না থাকায় ${suppliers.length - suppliers.filter(s => s.phone && s.phone.trim() !== "").length} জন সাপ্লায়ার বাদ পড়েছে।`}
						</p>
					</div>
				)}

				{tab === "buy" ? (
					<CreditPackages credits={smsCredits} />
				) : tab === "history" ? (
					<SmsHistory
						historyData={historyData}
						currentPage={currentPage}
						onPageChange={handlePageChange}
						isLoading={isHistoryLoading}
					/>
				) : (
					<>
						{/* Contacts */}
						<div className="plane-section">
							<div className="section-title">যাদের পাঠাবেন</div>
							<label className="label" htmlFor="sms-contacts">
								প্রতি লাইনে একজন — নম্বর, নাম
							</label>
							<textarea
								id="sms-contacts"
								className="textarea"
								rows={4}
								placeholder={"017xxxxxxxx, করিম\n018xxxxxxxx, রহিমা"}
								value={contactsText}
								onChange={(e) => setContactsText(e.target.value)}
							/>
						</div>

						{/* Message */}
						<div className="plane-section">
							<div className="section-title">মেসেজ</div>
							<label className="label" htmlFor="sms-message">
								যা লিখবেন সেটাই সবার কাছে যাবে
							</label>
							<p className="mb-2 text-xs text-slate-500">
								মেসেজে{" "}
								<span className="rounded bg-slate-100 px-1 font-mono">{"{name}"}</span>{" "}
								লিখলে সেখানে প্রত্যেকের নাম বসে যাবে। যেমন: &ldquo;{"{name}"} ভাই, আপনার অর্ডার রেডি!&rdquo;
							</p>
							<textarea
								id="sms-message"
								className="textarea"
								rows={4}
								placeholder="এখানে এসএমএসটা লিখুন…"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
							/>
							<div className="mt-1 flex justify-end">
								<span className="num select-none text-xs text-slate-500">
									{message.length} অক্ষর / {perMessageSegments} এসএমএস
								</span>
							</div>

							{status && (
								<div className="mt-3">
									{showCreditError ? (
										<div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
											<span className="text-xs font-medium text-rose-700">{status}</span>
											<a href="/dashboard/subscriptions" className="btn btn-danger btn-sm">
												ক্রেডিট কিনুন
											</a>
										</div>
									) : (
										<div
											className={`rounded-lg border px-3 py-2 text-xs font-medium ${
												status.includes('সফলভাবে')
													? 'border-emerald-200 bg-emerald-50 text-emerald-700'
													: 'border-rose-200 bg-rose-50 text-rose-700'
											}`}
										>
											{status}
										</div>
									)}
								</div>
							)}
						</div>

						<div className="plane-section flex justify-end">
							<button
								className="btn btn-primary"
								onClick={handleSend}
								disabled={contacts.length === 0 || isSending || notEnoughCredits}
							>
								{isSending && (
									<svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
									</svg>
								)}
								{isSending
									? "পাঠানো হচ্ছে…"
									: notEnoughCredits
										? "ক্রেডিট কম পড়েছে"
										: "এসএমএস পাঠান"
								}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
