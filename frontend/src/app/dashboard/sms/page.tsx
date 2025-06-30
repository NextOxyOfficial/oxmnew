"use client";

import { useState } from "react";
import SmsHistory from "./SmsHistory";

// Mock data for customers, employees, and suppliers
const mockCustomers = [
	{ id: 1, name: "Alice Customer", phone: "+8801000000001" },
	{ id: 2, name: "Bob Customer", phone: "+8801000000002" },
];
const mockEmployees = [
	{ id: 1, name: "Eve Employee", phone: "+8801000001001" },
	{ id: 2, name: "John Employee", phone: "+8801000001002" },
];
const mockSuppliers = [
	{ id: 1, name: "Sam Supplier", phone: "+8801000002001" },
	{ id: 2, name: "Jane Supplier", phone: "+8801000002002" },
];

// Example mock data for sent SMS history
const mockHistory = [
	{
		id: 1,
		time: "2025-07-01 14:32",
		contacts: 2,
		smsCount: 2,
		text: "Promo: 10% off for all!",
	},
	{
		id: 2,
		time: "2025-07-01 13:10",
		contacts: 1,
		smsCount: 1,
		text: "Hello John, your order is ready.",
	},
	{
		id: 3,
		time: "2025-06-30 18:45",
		contacts: 5,
		smsCount: 5,
		text: "Monthly update sent to all employees.",
	},
];

export default function SmsPage() {
	const [tab, setTab] = useState("custom");
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [bulkContacts, setBulkContacts] = useState("");

	const handleSend = () => {
		setStatus("Sending...");
		setTimeout(() => setStatus("SMS sent!"), 1200);
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
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						tab === "custom"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("custom")}
				>
					Custom
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						tab === "customers"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("customers")}
				>
					All Customers
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						tab === "employees"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("employees")}
				>
					All Employees
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
						tab === "suppliers"
							? "bg-cyan-600 text-white"
							: "bg-slate-800 text-slate-300"
					}`}
					onClick={() => setTab("suppliers")}
				>
					All Suppliers
				</button>
				<button
					className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
			<div className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-6 space-y-6">
				{tab === "custom" && (
					<div>
						<label className="block text-slate-300 mb-2 font-medium">
							Bulk Contacts (Number, Name per line)
						</label>
						<textarea
							className="w-full p-2 rounded bg-slate-800 text-slate-200 border border-slate-700 mb-4"
							rows={4}
							placeholder="017xxxxxxxx, John\n018xxxxxxxx, Jane"
							value={bulkContacts}
							onChange={(e) => setBulkContacts(e.target.value)}
						/>
					</div>
				)}
				{tab === "suppliers" && <></>}
				{tab === "history" && <SmsHistory history={mockHistory} />}
				{tab !== "history" && (
					<>
						<label className="block text-slate-300 mb-2 font-medium">
							Message
						</label>
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
						<button
							className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 px-6 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
							onClick={handleSend}
							disabled={
								tab === "custom" ? !bulkContacts.trim() : false
							}
						>
							{tab === "custom" ? "Send SMS to All" : "Send SMS"}
						</button>
						{status && (
							<div className="text-center text-green-400 mt-2">{status}</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
