"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order, OrderItem } from "@/types/order";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";

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
        setError("Failed to load invoice data");
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-gray-600">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Go Back
          </button>
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

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything first */
          * {
            visibility: hidden;
          }
          
          /* Only show invoice content */
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          
          /* Position invoice content to fill page */
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Hide browser chrome and website elements */
          header, nav, footer, .header, .nav, .footer, 
          [role="banner"], [role="navigation"], [role="contentinfo"],
          .print\\:hidden,
          /* Additional selectors for common website elements */
          .navbar, .nav-bar, .navigation, .site-header, .site-footer,
          .page-header, .page-footer, .main-nav, .main-navigation,
          .top-bar, .bottom-bar, .sidebar, .menu {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset html and body for clean print */
          html, body { 
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Print-specific utilities */
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
          .print\\:min-h-0 { min-height: 0 !important; }
          
          /* Page settings */
          @page { 
            margin: 0.5in;
            size: A4;
          }
          
          .page-break { page-break-after: always; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
        {/* Invoice Content - Direct display without modal */}
        <div className="invoice-content bg-white print:shadow-none print:max-w-none print:mx-0 max-w-5xl mx-auto">
                  {/* Header Section */}
                  <div className="px-8 py-2 print:px-6 print:py-2">
            <div className="flex justify-between items-start mb-6">
              {/* Company Logo */}
              <div className="flex items-start gap-4">
                {userProfile?.store_logo ? (
                  <div className="w-36 flex items-center justify-center">
                    <img
                      src={userProfile.store_logo}
                      alt="Company Logo"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        // Fallback to placeholder if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-logo');
                        if (fallback) {
                          fallback.classList.remove('hidden');
                        }
                      }}
                    />
                    <div className="fallback-logo w-12 h-12 bg-gray-800 rounded hidden items-center justify-center print:bg-black">
                      <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center print:bg-black">
                    <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
                  </div>
                )}
              </div>

              {/* Invoice Number and Date */}
              <div className="text-center">
                <span className="text-sm font-medium text-gray-800 print:text-black">Invoice # </span>
                <span className="text-sm text-gray-600 print:text-black">
                  {order.id}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600 print:text-black">
                    {new Date(order.sale_date || new Date()).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Company and Customer Info */}
            <div className="flex justify-between px-2">
              {/* Company Details */}
              <div>
                <div className="text-sm text-gray-600 print:text-black space-y-1">
                  <p className="font-medium">{company.name}</p>
                  <p>{company.address}</p>
                  <p>{company.city}</p>
                  <p>{company.phone}, {company.email}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 print:text-black mb-2">
                  Invoice to:
                </h3>
                <div className="text-sm text-gray-600 print:text-black space-y-1">
                  <p className="font-medium">
                    {order.customer_name || "Mr. Guest Customer"}
                  </p>
                  {order.customer_address && order.customer_address !== "A Dummy Street Area, Location," && (
                    <p>{order.customer_address}</p>
                  )}
                  <p>
                    {order.customer_phone && order.customer_email
                      ? `${order.customer_phone}, ${order.customer_email}`
                      : order.customer_phone || order.customer_email || "Lorem Ipsum, 123xx456x"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="px-8 print:px-6">
            <div className="">
              {/* Table Header */}
              <div className="bg-gray-800 print:bg-gray-300 text-white print:text-black border border-gray-300 print:border-black">
                <div className="grid grid-cols-12 gap-0 text-sm font-medium">
                  <div className="col-span-1 py-1.5 text-center border-r border-gray-600 print:border-black">
                    No.
                  </div>
                  <div className="col-span-6 px-1.5 py-1.5 border-r border-gray-600 print:border-black">
                    Item Description
                  </div>
                  <div className="col-span-1 py-1.5 text-center border-r border-gray-600 print:border-black">
                    Qty
                  </div>
                  <div className="col-span-2 px-1.5 py-1.5 text-center border-r border-gray-600 print:border-black">
                    Price
                  </div>
                  <div className="col-span-2 px-1.5 py-1.5 text-right">
                    Total
                  </div>
                </div>
              </div>

              {/* Table Rows */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-0 border-l border-r border-b border-gray-300 print:border-black"
                  >
                    <div className="col-span-1 py-1.5 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="col-span-6 px-1.5 py-1.5 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black">
                      <div className="font-medium break-words">{item.product_name}</div>
                      {item.variant_details && (
                        <div className="text-xs text-gray-500 print:text-gray-700 mt-1 break-words">
                          {item.variant_details}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1 py-1.5 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center break-all">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 px-1.5 py-1.5 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center break-all">
                      {formatCurrency(item.unit_price)}
                    </div>
                    <div className="col-span-2 px-1.5 py-1.5 text-sm text-gray-600 print:text-black text-right flex items-center justify-end break-all">
                      {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 gap-0 border-l border-r border-b border-gray-300 print:border-black">
                  <div className="col-span-1 py-1.5 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black flex items-center justify-center">
                    1
                  </div>
                  <div className="col-span-6 px-1.5 py-1.5 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black">
                    <div className="font-medium break-words">{order.product_name || "Product"}</div>
                  </div>
                  <div className="col-span-1 py-1.5 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center break-all">
                    {order.quantity || 1}
                  </div>
                  <div className="col-span-2 px-1.5 py-1.5 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center break-all">
                    {formatCurrency(order.unit_price || 0)}
                  </div>
                  <div className="col-span-2 px-1.5 py-1.5 text-sm text-gray-600 print:text-black text-right flex items-center justify-end break-all">
                    {formatCurrency(order.total_amount || 0)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-8 py-4 print:px-6 print:py-2">
            <div className="flex justify-between">
              {/* Thank you message on the left */}
              <div className="w-1/2">
                <div className="text-sm mt-4 text-gray-600 print:text-black">
                  <p>
                    Thank you for choosing our services!
                  </p>
                </div>
              </div>

              {/* Totals */}
              <div className="w-1/3">
                <div className="">
                  <div className="flex justify-between px-1.5 py-1.5 border-l border-r border-t border-b border-gray-300 print:border-black">
                    <span className="text-sm text-gray-600 print:text-black">VAT {vatRate > 0 ? `(${vatRate}%)` : ''}</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      {formatCurrency(vatAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between px-1.5 py-1.5 border-l border-r border-b border-gray-300 print:border-black">
                    <span className="text-sm text-gray-600 print:text-black">Discount</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between px-1.5 py-1.5 border-l border-r border-b border-gray-300 print:border-black">
                    <span className="text-sm text-gray-600 print:text-black">Due</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      {formatCurrency(dueAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between px-1.5 py-1.5 border-l border-r border-b border-gray-300 print:border-black bg-gray-800 text-white print:bg-gray-300 print:text-black font-semibold">
                    <span className="text-sm font-bold">TOTAL</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="print:hidden bg-gray-50 px-6 py-4 border-t flex justify-center gap-4">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
