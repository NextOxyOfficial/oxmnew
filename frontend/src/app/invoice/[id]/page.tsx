"use client";

import { useCurrency, useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order } from "@/types/order";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer, Download, ArrowLeft } from "lucide-react";
import "./print-styles.css";

/**
 * Bangla words for 0–99. Every larger number is composed from this table
 * using the South-Asian scale (হাজার / লক্ষ / কোটি), which is why only two
 * digits need spelling out.
 */
const BANGLA_UNITS = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই",
];

/** Spells a non-negative integer in Bangla, e.g. 1250 -> "এক হাজার দুইশত পঞ্চাশ". */
function integerToBanglaWords(value: number): string {
  if (value === 0) return BANGLA_UNITS[0];

  const parts: string[] = [];
  let rest = value;

  // Crore recurses, so amounts beyond 99,99,99,999 still read correctly.
  const crore = Math.floor(rest / 10000000);
  if (crore > 0) {
    parts.push(`${integerToBanglaWords(crore)} কোটি`);
    rest %= 10000000;
  }
  // After the crore split every remaining group is below 100.
  const lakh = Math.floor(rest / 100000);
  if (lakh > 0) {
    parts.push(`${BANGLA_UNITS[lakh]} লক্ষ`);
    rest %= 100000;
  }
  const thousand = Math.floor(rest / 1000);
  if (thousand > 0) {
    parts.push(`${BANGLA_UNITS[thousand]} হাজার`);
    rest %= 1000;
  }
  const hundred = Math.floor(rest / 100);
  if (hundred > 0) {
    parts.push(`${BANGLA_UNITS[hundred]}শত`);
    rest %= 100;
  }
  if (rest > 0) parts.push(BANGLA_UNITS[rest]);

  return parts.join(" ");
}

/**
 * Amount-in-words line for the printed sheet. Returns "" when the value
 * cannot be spelled safely (negative, non-finite, or past the point where
 * float arithmetic on paisa stops being exact) so the invoice prints
 * nothing rather than something wrong.
 */
function amountToBanglaWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) return "";

  const asPaisa = Math.round(amount * 100);
  const taka = Math.floor(asPaisa / 100);
  const paisa = asPaisa % 100;

  const takaWords = `${integerToBanglaWords(taka)} টাকা`;
  return paisa > 0
    ? `${takaWords} ${integerToBanglaWords(paisa)} পয়সা মাত্র`
    : `${takaWords} মাত্র`;
}

interface InvoiceData {
  order: Order;
  company: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website?: string;
  };
  userProfile?: {
    store_logo: string;
  };
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  // Only used to decide whether the টাকা/পয়সা words line applies.
  const { currency } = useCurrency();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed modal state and close handlers since invoice opens in new tab

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const orderId = params.id as string;
        // Use the correct getOrder method for orders endpoint
        const orderData = await ApiService.getOrder(parseInt(orderId));
        console.log("Raw order data from API:", orderData); // Debug log

        // Load company data from localStorage (or use defaults)
        // Get company data from user profile first, with fallback to localStorage
        let companyData = {
          name: "Company Name",
          address: "Company Address",
          city: "City, State",
          phone: "Phone Number",
          email: "company@email.com",
          website: "www.company.com"
        };

        // Fetch user profile to get store logo and company information
        let userProfile = undefined;
        try {
          const profileData = await ApiService.getProfile();
          console.log("Full profile data received:", JSON.stringify(profileData, null, 2)); // Debug log

          userProfile = {
            store_logo: profileData.profile?.store_logo || ""
          };

          // Update company data from backend profile if available
          if (profileData.profile) {
            const profile = profileData.profile;
            console.log("Profile fields available:", Object.keys(profile)); // Debug log
            console.log("Company name fields:", {
              company_name: profile.company_name,
              store_name: profile.store_name,
              name: profile.name,
              first_name: profile.first_name,
              last_name: profile.last_name
            }); // Debug log

            // Try multiple possible company name fields
            const possibleName = profileData.profile.company ||
                                profile.store_name ||
                                profile.business_name ||
                                profile.name ||
                                (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                                profile.first_name ||
                                companyData.name;

            companyData = {
              name: possibleName,
              address: profile.company_address || profile.business_address || profile.address || companyData.address,
              city: profile.company_city || profile.business_city || profile.city || companyData.city,
              phone: profile.company_phone || profile.business_phone || profile.phone || companyData.phone,
              email: profile.company_email || profile.business_email || profile.email || companyData.email,
              website: profile.company_website || profile.business_website || profile.website || companyData.website
            };

            console.log("Final company data:", companyData); // Debug log
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }

        // Fallback to localStorage if backend data is incomplete
        try {
          const savedSettings = localStorage.getItem("companySettings");
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            // Only use localStorage for missing fields
            companyData = {
              name: companyData.name === "Your Company Name" ? parsedSettings.name || companyData.name : companyData.name,
              address: companyData.address === "123 Business Street" ? parsedSettings.address || companyData.address : companyData.address,
              city: companyData.city === "City, State 12345" ? parsedSettings.city || companyData.city : companyData.city,
              phone: companyData.phone === "(555) 123-4567" ? parsedSettings.phone || companyData.phone : companyData.phone,
              email: companyData.email === "info@yourcompany.com" ? parsedSettings.email || companyData.email : companyData.email,
              website: companyData.website === "www.yourcompany.com" ? parsedSettings.website || companyData.website : companyData.website
            };
          }
        } catch (error) {
          console.error("Error loading company settings:", error);
        }

        setInvoiceData({
          order: orderData,
          company: companyData,
          userProfile
        });
      } catch (error) {
        console.error("Error fetching invoice data:", error);
        setError("ইনভয়েসের তথ্য আনা গেল না");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // You can implement PDF generation here using libraries like jsPDF
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="plane w-full max-w-md">
          <div className="plane-section text-center">
            <h1 className="page-title">কিছু একটা সমস্যা হয়েছে</h1>
            <p className="page-sub">{error || "ইনভয়েসটি পাওয়া যায়নি"}</p>
          </div>
        </div>
      </div>
    );
  }

  const { order, company, userProfile } = invoiceData;

  // Calculate totals dynamically based on order data
  const calculateSubtotal = () => {
    console.log("Order object:", order);
    console.log("Order fields:", Object.keys(order));

    // First try: Use subtotal from order (this is calculated by backend)
    if (order.subtotal && order.subtotal > 0) {
      console.log("Using order.subtotal:", order.subtotal);
      return Number(order.subtotal);
    }

    // Second try: Multi-item order with items array
    if (order.items && order.items.length > 0) {
      console.log("Multi-item order detected, items:", order.items);
      const calculatedSubtotal = order.items.reduce((sum, item) => {
        const itemTotal = Number(item.total_price) || (Number(item.quantity) * Number(item.unit_price)) || 0;
        console.log(`Item: ${item.product_name}, quantity: ${item.quantity}, unit_price: ${item.unit_price}, total_price: ${item.total_price}, calculated: ${itemTotal}`);
        return sum + itemTotal;
      }, 0);
      console.log("Calculated subtotal from items:", calculatedSubtotal);
      return calculatedSubtotal;
    }

    // Third try: Use total_amount directly
    if (order.total_amount && Number(order.total_amount) > 0) {
      console.log("Using order.total_amount:", order.total_amount);
      return Number(order.total_amount);
    }

    // Fourth try: Calculate from single order fields (legacy support)
    if (order.quantity && order.unit_price) {
      const calculated = Number(order.quantity) * Number(order.unit_price);
      console.log("Calculated from order quantity/unit_price:", calculated);
      return calculated;
    }

    // Log all available fields for debugging
    console.log("No subtotal found, order fields:", {
      subtotal: order.subtotal,
      total_amount: order.total_amount,
      quantity: order.quantity,
      unit_price: order.unit_price,
      items: order.items,
      vat_amount: order.vat_amount,
      discount_amount: order.discount_amount
    });
    return 0;
  };

  const subtotal = calculateSubtotal();

  // Calculate discount amount dynamically
  let discountAmount = 0;
  if (order.discount_amount && Number(order.discount_amount) > 0) {
    // Use explicit discount amount from backend
    discountAmount = Number(order.discount_amount);
    console.log("Using order.discount_amount:", discountAmount);
  } else if (order.discount_percentage && Number(order.discount_percentage) > 0) {
    // Calculate discount from percentage
    discountAmount = (subtotal * Number(order.discount_percentage)) / 100;
    console.log("Calculated discount from percentage:", {
      subtotal,
      discount_percentage: order.discount_percentage,
      calculated_discount: discountAmount
    });
  }

  const vatRate = Number(order.vat_percentage) || 0;
  const vatAmount = Number(order.vat_amount) || (subtotal * (vatRate / 100));

  // For the total, try multiple sources in order of preference
  let total = Number(order.total_amount) || 0;
  if (total === 0 && subtotal > 0) {
    // Calculate total if not available from backend
    total = subtotal + vatAmount - discountAmount;
  }

  const paidAmount = Number(order.paid_amount) || 0;

  // Due amount calculation - this should be dynamic
  // Due amount from backend takes priority, otherwise calculate as total - paid
  let dueAmount = 0;
  if (order.due_amount !== undefined && order.due_amount !== null) {
    // Use backend calculated due amount
    dueAmount = Number(order.due_amount);
  } else {
    // Calculate due amount as remaining balance
    dueAmount = Math.max(0, total - paidAmount);
  }

  console.log("Final calculation results:", {
    subtotal,
    discountAmount,
    vatRate,
    vatAmount,
    total,
    paidAmount,
    dueAmount,
    orderTotalAmount: order.total_amount,
    orderDueAmount: order.due_amount,
    orderDiscountAmount: order.discount_amount
  });

  // ── Presentation-only derivations (no arithmetic on the figures above) ──
  const isPaid = dueAmount <= 0;
  const statusLabel = isPaid ? "পরিশোধ" : "বাকি";
  const statusToneClass = isPaid ? "badge-success" : "badge-danger";

  const invoiceDate = new Date(order.sale_date || new Date()).toLocaleDateString(
    "en-US",
    { day: "2-digit", month: "short", year: "numeric" }
  );

  // The words line names টাকা/পয়সা, so it is only correct for BDT. For any
  // other configured currency it is skipped rather than mislabelled.
  const amountInWords = currency === "BDT" ? amountToBanglaWords(total) : "";

  return (
    <>
      {/* Action Bar — screen only; hidden by .invoice-actions in print-styles.css */}
      <div className="invoice-actions sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => router.back()}
              aria-label="ফিরে যান"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900">ইনভয়েস #{order.id}</h1>
              <p className="num text-xs text-slate-500">{invoiceDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${statusToneClass}`}>{statusLabel}</span>
            <button onClick={handleDownloadPDF} className="btn btn-ghost">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">ডাউনলোড</span>
            </button>
            <button onClick={handlePrint} className="btn btn-primary">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content — one printable plane */}
      <div className="invoice-sheet plane mx-auto my-6 max-w-4xl">
        {/* Invoice Header: identity on the left, invoice meta on the right */}
        <div className="plane-section flex flex-wrap items-start justify-between gap-3">
          {userProfile?.store_logo ? (
            <img src={userProfile.store_logo} alt={company.name} className="h-12 max-w-[10rem] object-contain" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-600 text-base font-bold text-white">
              OX
            </span>
          )}

          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">ইনভয়েস</div>
            <div className="num text-lg font-semibold text-slate-900">
              {order.order_number || `#${order.id}`}
            </div>
            {order.order_number && (
              <div className="num text-xs text-slate-500">অর্ডার #{order.id}</div>
            )}
            <div className="num mt-0.5 text-xs text-slate-500">তারিখ: {invoiceDate}</div>
            <div className="mt-1.5">
              <span className={`invoice-status badge ${statusToneClass}`}>{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Billing Info — store contact and customer contact, side by side */}
        <div className="invoice-parties plane-section grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="section-title">স্টোর</div>
            <div className="space-y-0.5 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{company.name}</p>
              {company.address && <p>{company.address}</p>}
              {company.city && <p>{company.city}</p>}
              {company.phone && <p className="num">ফোন: {company.phone}</p>}
              {company.email && <p className="break-words">ইমেইল: {company.email}</p>}
              {company.website && <p className="break-words">{company.website}</p>}
            </div>
          </div>
          <div>
            <div className="section-title">কাস্টমার</div>
            <div className="space-y-0.5 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{order.customer_name || "অতিথি কাস্টমার"}</p>
              {order.customer_company && <p>{order.customer_company}</p>}
              {order.customer_address && order.customer_address !== "A Dummy Street Area, Location," && (
                <p>{order.customer_address}</p>
              )}
              {order.customer_phone && <p className="num">ফোন: {order.customer_phone}</p>}
              {order.customer_email && <p className="break-words">ইমেইল: {order.customer_email}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-12">ক্রম</th>
                <th>প্রোডাক্টের বিবরণ</th>
                <th className="cell-num">পরিমাণ</th>
                <th className="cell-num">দাম</th>
                <th className="cell-num">মোট</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="cell-num">{index + 1}</td>
                    <td>
                      <div className="cell-strong break-words">{item.product_name}</div>
                      {item.variant_details && (
                        <div className="mt-0.5 break-words text-xs text-slate-500">
                          {item.variant_details}
                        </div>
                      )}
                    </td>
                    <td className="cell-num">{item.quantity}</td>
                    <td className="cell-num">{formatCurrency(item.unit_price)}</td>
                    <td className="cell-num">
                      {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="cell-num">1</td>
                  <td>
                    <div className="cell-strong break-words">{order.product_name || "প্রোডাক্ট"}</div>
                  </td>
                  <td className="cell-num">{order.quantity || 1}</td>
                  <td className="cell-num">{formatCurrency(order.unit_price || 0)}</td>
                  <td className="cell-num">{formatCurrency(order.total_amount || 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section */}
        <div className="invoice-bottom plane-section flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Words, notes and the thank-you on the left */}
          <div className="min-w-0 flex-1 text-sm text-slate-600">
            {amountInWords && (
              <div className="invoice-words mb-3">
                <div className="section-title">কথায়</div>
                <p className="text-sm font-medium text-slate-900">{amountInWords}</p>
              </div>
            )}

            {order.notes && (
              <div className="mb-3">
                <div className="section-title">নোট</div>
                <p className="break-words text-sm">{order.notes}</p>
              </div>
            )}

            <p>আমাদের সাথে থাকার জন্য ধন্যবাদ!</p>
          </div>

          {/* Totals — right-aligned, tabular figures */}
          <div className="invoice-totals w-full sm:w-64">
            <div className="invoice-rule flex items-center justify-between border-b border-slate-200 py-1.5 text-sm">
              <span className="text-slate-500">মোট</span>
              <span className="num text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="invoice-rule flex items-center justify-between border-b border-slate-200 py-1.5 text-sm">
              <span className="text-slate-500">ভ্যাট {vatRate > 0 ? `(${vatRate}%)` : ''}</span>
              <span className="num text-slate-900">{formatCurrency(vatAmount)}</span>
            </div>
            <div className="invoice-rule flex items-center justify-between border-b border-slate-200 py-1.5 text-sm">
              <span className="text-slate-500">ছাড়</span>
              <span className="num text-slate-900">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="invoice-rule flex items-center justify-between border-b border-slate-200 py-2.5 text-base font-semibold text-slate-900">
              <span>সর্বমোট</span>
              <span className="num">{formatCurrency(total)}</span>
            </div>
            <div className="invoice-rule flex items-center justify-between border-b border-slate-200 py-1.5 text-sm">
              <span className="text-slate-500">পরিশোধ</span>
              <span className="num text-slate-900">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-500">বাকি</span>
              <span className={`num ${dueAmount > 0 ? 'money-neg' : 'text-slate-900'}`}>
                {formatCurrency(dueAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Signature lines — paper only, so there is somewhere to sign */}
        <div className="invoice-print-only invoice-signatures plane-section">
          <div className="invoice-sign">স্টোরের স্বাক্ষর</div>
          <div className="invoice-sign">ক্রেতার স্বাক্ষর</div>
        </div>

        {/* Website Credit */}
        <div className="plane-section text-center text-xs text-slate-500">
          চালাচ্ছে <span className="font-medium text-slate-900">OxyManager</span> • oxymanager.com
        </div>
      </div>
    </>
  );
}
