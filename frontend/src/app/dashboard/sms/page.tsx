"use client";

import { useState, useEffect } from "react";
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
			setStatus("Please enter a message and at least one contact.");
			return;
		}

		// Calculate total SMS count needed using proper Unicode/Bengali counting
		const smsInfo = calculateSmsSegments(message);
		const smsPerMessage = smsInfo.segments;
		const totalSmsNeeded = contacts.length * smsPerMessage;
		
		console.log(`SMS calculation: ${message.length} chars, ${smsInfo.encoding} encoding, ${smsPerMessage} segments per message, ${totalSmsNeeded} total needed`);
		
		// Check if user has sufficient credits
		if (smsCredits !== null && smsCredits < totalSmsNeeded) {
			setStatus(`You need ${totalSmsNeeded} credits but only have ${smsCredits}. Each message requires ${smsPerMessage} credit${smsPerMessage > 1 ? 's' : ''} (${smsInfo.encoding} encoding).`);
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
						setStatus(`Error: ${response.error}`);
					}
				}
			} catch (e: any) {
				failCount++;
				// Handle insufficient credits error specifically
				if (e.response?.status === 402) {
					const errorData = e.response.data;
					setStatus(errorData.error || 'Insufficient SMS credits. Please purchase more credits.');
					setShowCreditError(true);
					setIsSending(false);
					return;
				} else {
					// Handle other types of errors
					const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Unknown error occurred';
					setStatus(`Error sending SMS: ${errorMessage}`);
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
			setStatus(`${successCount} SMS sent successfully to ${successCount} user${successCount > 1 ? 's' : ''}. ${creditsUsed} credits used.`);
			setShowCreditError(false);
			setTimeout(() => setStatus(null), 5000);
			
			// Refresh SMS history if we're on the history tab
			if (tab === "history") {
				fetchSmsHistory(currentPage);
			}
		} else if (failCount > 0 && !showCreditError) {
			setStatus("Failed to send SMS. Please check the error details above.");
			setShowCreditError(false);
		}
		setIsSending(false);
	};

	return (
		<div className="w-full max-w-4xl mx-auto sm:p-6 p-2 space-y-8">
			<div className="text-center mb-4">
				<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
					Send SMS
				</h1>
				<p className="text-gray-400 text-base mt-2">
					Send SMS to individuals, all customers, or all employees.
				</p>
			</div>

			{/* SMS Credits Display */}
			<div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/8 border border-emerald-500/25 rounded-lg p-3 mb-6 backdrop-blur-sm">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="rounded-md bg-emerald-500/20 p-1.5">
							<svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
							</svg>
						</div>
						<div>
							<div className="text-sm font-semibold text-emerald-300">SMS Credits</div>
							<div className="text-xs text-emerald-400/70">
								{isLoading ? "Loading..." : smsCredits === null ? "Error loading" : `${smsCredits.toLocaleString()} available`}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
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
							className="p-1.5 rounded-md hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
							title="Refresh SMS credits"
						>
							<svg className={`h-3.5 w-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
						<a 
							href="/dashboard/subscriptions" 
							className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer"
						>
							Buy Credits
						</a>
					</div>
				</div>
				{contacts.length > 0 && message && (
					<div className="mt-3 pt-3 border-t border-emerald-500/20">
						<div className="text-xs text-emerald-400/70">
							Estimated cost: {contacts.length * calculateSmsSegments(message).segments} credits
							({contacts.length} contacts × {calculateSmsSegments(message).segments} SMS each)
						</div>
					</div>
				)}
			</div>

			{/* Tabs */}
			<div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg mb-6">
				<div className="border-b border-slate-700/50">
					<div className="flex flex-wrap">
						{/* Custom Tab */}
						<button
							className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[120px] ${
								tab === "custom"
									? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300"
									: "text-slate-400 hover:text-blue-300 hover:bg-blue-500/10"
							}`}
							onClick={() => setTab("custom")}
						>
							<div className="text-left">
								<div className="font-semibold text-sm">Custom</div>
								<div className={`text-xs ${tab === "custom" ? "text-blue-400" : "text-slate-500"}`}>
									Manual input
								</div>
							</div>
							{tab === "custom" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
							)}
						</button>

						{/* Customers Tab */}
						<button
							className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[140px] ${
								tab === "customers"
									? "bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-300"
									: "text-slate-400 hover:text-purple-300 hover:bg-purple-500/10"
							}`}
							onClick={() => setTab("customers")}
						>
							<div className="text-left">
								<div className="font-semibold text-sm">All Customers</div>
								<div className={`text-xs ${tab === "customers" ? "text-purple-400" : "text-slate-500"}`}>
								</div>
							</div>
							{tab === "customers" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
							)}
						</button>

						{/* Employees Tab */}
						<button
							className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[140px] ${
								tab === "employees"
									? "bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-300"
									: "text-slate-400 hover:text-green-300 hover:bg-green-500/10"
							}`}
							onClick={() => setTab("employees")}
						>
							<div className="text-left">
								<div className="font-semibold text-sm">All Employees</div>
								<div className={`text-xs ${tab === "employees" ? "text-green-400" : "text-slate-500"}`}>
								</div>
							</div>
							{tab === "employees" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
							)}
						</button>

						{/* Suppliers Tab */}
						<button
							className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[130px] ${
								tab === "suppliers"
									? "bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-300"
									: "text-slate-400 hover:text-orange-300 hover:bg-orange-500/10"
							}`}
							onClick={() => setTab("suppliers")}
						>
							<div className="text-left">
								<div className="font-semibold text-sm">All Suppliers</div>
								<div className={`text-xs ${tab === "suppliers" ? "text-orange-400" : "text-slate-500"}`}>
								</div>
							</div>
							{tab === "suppliers" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
							)}
						</button>

						{/* History Tab */}
						<button
							className={`px-4 py-3 font-medium transition-all duration-200 relative flex items-center space-x-2.5 cursor-pointer min-w-[100px] border-l border-slate-700/50 ${
								tab === "history"
									? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-300"
									: "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
							}`}
							onClick={() => setTab("history")}
						>
							<div className="text-left">
								<div className="font-semibold text-sm">History</div>
								<div className={`text-xs ${tab === "history" ? "text-cyan-400" : "text-slate-500"}`}>
									{isLoading ? "Loading..." : historyData ? `${historyData.count || 0} total` : "0 total"}
								</div>
							</div>
							{tab === "history" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-600"></div>
							)}
						</button>
					</div>
				</div>
				
				{/* Info Message for filtered contacts */}
				{tab !== "history" && tab !== "custom" && (
					<div className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
						<p className="text-xs text-blue-300">
							<span className="font-semibold">ℹ️ Note:</span> Only contacts with valid phone numbers are shown. 
							{tab === "customers" && customers.length > customers.filter(c => c.phone && c.phone.trim() !== "").length && 
								` ${customers.length - customers.filter(c => c.phone && c.phone.trim() !== "").length} customer(s) excluded due to missing phone numbers.`}
							{tab === "employees" && employees.length > employees.filter(e => e.phone && e.phone.trim() !== "").length && 
								` ${employees.length - employees.filter(e => e.phone && e.phone.trim() !== "").length} employee(s) excluded due to missing phone numbers.`}
							{tab === "suppliers" && suppliers.length > suppliers.filter(s => s.phone && s.phone.trim() !== "").length && 
								` ${suppliers.length - suppliers.filter(s => s.phone && s.phone.trim() !== "").length} supplier(s) excluded due to missing phone numbers.`}
						</p>
					</div>
				)}
			</div>

			{/* Main Form */}
			<div className="bg-white/3 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-4 space-y-6">
				{tab !== "history" && (
					<>
						<label className="block text-slate-300 mb-2 font-medium">
							Contacts (Number, Name per line)
						</label>
						<textarea
							className="w-full p-2 rounded bg-slate-800 text-slate-200 border border-slate-700 mb-4"
							rows={4}
							placeholder="017xxxxxxxx, John\n018xxxxxxxx, Jane"
							value={contactsText}
							onChange={(e) => setContactsText(e.target.value)}
						/>
					</>
				)}
				{tab === "history" && (
					<SmsHistory 
						historyData={historyData} 
						currentPage={currentPage}
						onPageChange={handlePageChange}
						isLoading={isHistoryLoading}
					/>
				)}
				{tab !== "history" && (
					<>
						<label className="block text-slate-300 mb-2 font-medium">
							Message
						</label>
						<p className="text-xs text-slate-400 mb-2">
							You can use{" "}
							<span className="font-mono bg-slate-800 px-1 rounded">
								{"{name}"}
							</span>{" "}
							in your message. It will be replaced with each contact's name.
						</p>
						<p className="text-xs text-slate-500 mb-2">
							Example: "Hi {"{name}"}, your order is ready for pickup!"
						</p>
						<div className="relative mb-4">
							<textarea
								className="w-full p-3 rounded bg-slate-800 text-slate-200 border border-slate-700 pr-32"
								rows={4}
								placeholder="Type your SMS message here..."
								value={message}
								onChange={(e) => setMessage(e.target.value)}
							/>
							<span className="absolute bottom-2 right-4 text-xs text-slate-400 select-none">
								{message.length} chars /{" "}
								{calculateSmsSegments(message).segments} SMS
							</span>
						</div>
						{status && (
							<div className="w-full flex justify-end mb-2">
								{showCreditError ? (
									<div className="bg-red-500/90 text-white text-xs font-semibold rounded-lg px-4 py-2 shadow flex items-center gap-3">
										<span>{status}</span>
										<a 
											href="/dashboard/subscriptions" 
											className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200 cursor-pointer"
										>
											Buy Credits
										</a>
									</div>
								) : (
									<span className={`text-white text-xs font-semibold rounded-lg px-4 py-2 shadow animate-fade-in-out ${
										status.includes('successfully') ? 'bg-green-500/90' : 'bg-red-500/90'
									}`}>
										{status}
									</span>
								)}
							</div>
						)}
						<button
							className={`px-6 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 transition-all duration-200 text-sm mt-2 self-end flex items-center justify-center gap-2 ${
								contacts.length === 0 || isSending || 
								(smsCredits !== null && smsCredits < (contacts.length * calculateSmsSegments(message).segments))
									? "bg-gray-600 text-gray-400 cursor-not-allowed"
									: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-500 cursor-pointer"
							}`}
							onClick={handleSend}
							disabled={
								contacts.length === 0 || 
								isSending || 
								(smsCredits !== null && smsCredits < (contacts.length * calculateSmsSegments(message).segments))
							}
							style={{ minWidth: 120 }}
						>
							{isSending && (
								<svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
								</svg>
							)}
							{isSending 
								? "Sending..." 
								: (smsCredits !== null && smsCredits < (contacts.length * calculateSmsSegments(message).segments))
									? "Insufficient Credits"
									: "Send SMS"
							}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
