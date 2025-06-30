"use client";

import { useState, useEffect } from "react";
import SmsHistory from "./SmsHistory";
import { ApiService } from "../../../lib/api";
import { customersAPI } from "../../../lib/api/customers";
import employeeAPI from "../../../lib/employeeAPI";

export default function SmsPage() {
	const [tab, setTab] = useState("custom");
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [contactsText, setContactsText] = useState("");
	const [contacts, setContacts] = useState<{ number: string; name: string }[]>([]);
	const [isSending, setIsSending] = useState(false);
	const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [employees, setEmployees] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [suppliers, setSuppliers] = useState<{ id: number; name: string; phone: string }[]>([]);
	const [history, setHistory] = useState<any[]>([]);

	// Fetch real data for customers, employees, suppliers, and SMS history
	useEffect(() => {
		async function fetchData() {
			try {
				const [cust, emp, supp] = await Promise.all([
					customersAPI.getCustomers().then(list => list.map(c => ({ id: c.id, name: c.name, phone: c.phone }))) ,
					employeeAPI.getEmployees().then(list => list.map(e => ({ id: e.id, name: e.name, phone: e.phone }))) ,
					ApiService.getSuppliers().then(list => list.map(s => ({ id: s.id, name: s.name, phone: s.phone }))) ,
				]);
				setCustomers(cust || []);
				setEmployees(emp || []);
				setSuppliers(supp || []);
				// Fetch SMS history if available
				if (ApiService.getSmsHistory) {
					const hist = await ApiService.getSmsHistory();
					setHistory(hist || []);
				}
			} catch (e) {
				// fallback to empty
			}
		}
		fetchData();
	}, []);

	// Populate contactsText based on tab
	useEffect(() => {
		let lines: string[] = [];
		if (tab === "custom") {
			lines = contactsText.split("\n").filter(Boolean);
		} else if (tab === "customers") {
			lines = customers.map((c) => `${c.phone}, ${c.name}`);
		} else if (tab === "employees") {
			lines = employees.map((e) => `${e.phone}, ${e.name}`);
		} else if (tab === "suppliers") {
			lines = suppliers.map((s) => `${s.phone}, ${s.name}`);
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
		setIsSending(true);
		setStatus(null);
		let successCount = 0;
		let failCount = 0;
		for (const contact of contacts) {
			const name = contact.name && contact.name.trim() ? contact.name : contact.number;
			const personalizedMsg = message.replace(/\{name\}/gi, name);
			try {
				await ApiService.sendSmsNotification(contact.number, personalizedMsg);
				successCount++;
			} catch (e) {
				failCount++;
			}
		}
		if (successCount > 0) {
			setStatus(`${successCount} SMS sent successfully to ${successCount} user${successCount > 1 ? 's' : ''}.`);
			setTimeout(() => setStatus(null), 5000);
		} else {
			setStatus("Failed to send SMS.");
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

			{/* Tabs */}
			<div className="flex justify-center gap-2 mb-6">
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
						tab === "custom"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("custom")}
				>
					Custom
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
						tab === "customers"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("customers")}
				>
					All Customers
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
						tab === "employees"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("employees")}
				>
					All Employees
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
						tab === "suppliers"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("suppliers")}
				>
					All Suppliers
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
						tab === "history"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("history")}
				>
					History
				</button>
			</div>

			{/* Main Form */}
			<div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-4 space-y-6">
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
				{tab === "history" && <SmsHistory history={history} />}
				{tab !== "history" && (
					<>
						<label className="block text-slate-300 mb-2 font-medium">
							Message
						</label>
						<p className="text-xs text-slate-400 mb-2">
							You can use{" "}
							<span className="font-mono bg-slate-800 px-1 rounded">
							</span>{" "}
							in your message. It will be replaced with each contact's name.
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
								{Math.max(1, Math.ceil(message.length / 160))} SMS
							</span>
						</div>
						{status && (
							<div className="w-full flex justify-end mb-2">
								<span className="bg-green-500/90 text-white text-xs font-semibold rounded-lg px-4 py-2 shadow animate-fade-in-out">
									{status}
								</span>
							</div>
						)}
						<button
							className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200 text-sm mt-2 self-end flex items-center justify-center gap-2 cursor-pointer"
							onClick={handleSend}
							disabled={contacts.length === 0 || isSending}
							style={{ minWidth: 120 }}
						>
							{isSending && (
								<svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
								</svg>
							)}
							{isSending ? "Sending..." : "Send SMS"}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
