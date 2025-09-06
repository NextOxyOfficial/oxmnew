"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { Order, OrderItem } from "@/types/order";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft, Download } from "lucide-react";

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
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const orderId = params.id as string;
        const orderData = await ApiService.getOrder(parseInt(orderId));
        
        // Load company data from localStorage (or use defaults)
        let companyData = {
          name: "Your Company Name",
          address: "123 Business Street",
          city: "City, State 12345",
          phone: "(555) 123-4567",
          email: "info@yourcompany.com",
          website: "www.yourcompany.com"
        };

        try {
          const savedSettings = localStorage.getItem("companySettings");
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            companyData = { ...companyData, ...parsedSettings };
          }
        } catch (error) {
          console.error("Error loading company settings:", error);
        }

        setInvoiceData({
          order: orderData,
          company: companyData
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

  const { order, company } = invoiceData;

  // Calculate totals
  const subtotal = order.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || order.total_amount || 0;
  const discountAmount = order.discount_amount || 0;
  const vatAmount = order.vat_amount || 0;
  const total = subtotal - discountAmount + vatAmount;
  const paidAmount = order.paid_amount || 0;
  const dueAmount = total - paidAmount;

  return (
    <>
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border-black { border-color: black !important; }
          .page-break { page-break-after: always; }
          @page { margin: 0.5in; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 print:bg-white">
        {/* Navigation - Hidden in print */}
        <div className="print:hidden bg-white border-b p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
          {/* Header Section */}
          <div className="px-8 py-6 print:px-6 print:py-4">
            <div className="flex justify-between items-start mb-8">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center print:bg-black">
                  <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 print:text-black">
                    {company.name}
                  </h1>
                  <p className="text-sm text-gray-500 print:text-gray-700">
                    INVOICE
                  </p>
                </div>
              </div>

              {/* Invoice Number and Date */}
              <div className="text-center">
                <span className="text-sm font-medium text-gray-800 print:text-black">Invoice # </span>
                <span className="text-sm text-gray-600 print:text-black">
                  {order.order_number || order.id || "250092"}
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
            <div className="flex justify-between">
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
                  <p>{order.customer_address || "A Dummy Street Area, Location,"}</p>
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
            <div className="border border-gray-300 print:border-black">
              {/* Table Header */}
              <div className="bg-gray-800 print:bg-transparent text-white print:text-black border-b print:border-black">
                <div className="grid grid-cols-12 gap-0 text-sm font-medium">
                  <div className="col-span-1 p-3 border-r border-gray-600 print:border-black">
                    No.
                  </div>
                  <div className="col-span-6 p-3 border-r border-gray-600 print:border-black">
                    Item Description
                  </div>
                  <div className="col-span-2 p-3 text-center border-r border-gray-600 print:border-black">
                    Qty
                  </div>
                  <div className="col-span-2 p-3 text-center border-r border-gray-600 print:border-black">
                    Price
                  </div>
                  <div className="col-span-1 p-3 text-right">
                    Total
                  </div>
                </div>
              </div>

              {/* Table Rows */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-0 border-b border-gray-300 print:border-black min-h-[50px]"
                  >
                    <div className="col-span-1 p-3 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black flex items-center">
                      {index + 1}
                    </div>
                    <div className="col-span-6 p-3 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black">
                      <div className="font-medium">{item.product_name}</div>
                      {item.variant_details && (
                        <div className="text-xs text-gray-500 print:text-gray-700 mt-1">
                          {item.variant_details}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 p-3 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 p-3 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black flex items-center justify-center">
                      {formatCurrency(item.unit_price)}
                    </div>
                    <div className="col-span-1 p-3 text-sm text-gray-600 print:text-black text-right flex items-center justify-end">
                      {formatCurrency(item.total_price || (item.quantity * item.unit_price))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-12 gap-0 border-b border-gray-300 print:border-black min-h-[50px]">
                  <div className="col-span-1 p-3 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black">
                    1
                  </div>
                  <div className="col-span-6 p-3 text-sm text-gray-600 print:text-black border-r border-gray-300 print:border-black">
                    {order.product_name || "Product"}
                  </div>
                  <div className="col-span-2 p-3 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black">
                    {order.quantity || 1}
                  </div>
                  <div className="col-span-2 p-3 text-sm text-gray-600 print:text-black text-center border-r border-gray-300 print:border-black">
                    {formatCurrency(order.unit_price || 0)}
                  </div>
                  <div className="col-span-1 p-3 text-sm text-gray-600 print:text-black text-right">
                    {formatCurrency(order.total_amount || 0)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-8 pt-6">
            <div className="flex justify-between">
              {/* Payment Info */}
              <div className="w-1/2">
                <div className="text-sm text-gray-600 print:text-black space-y-1"></div>
              </div>

              {/* Totals */}
              <div className="w-1/3">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 px-3 border border-gray-300 print:border-black rounded">
                    <span className="text-sm text-gray-600 print:text-black">VAT</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      {formatCurrency(vatAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 px-3 border border-gray-300 print:border-black rounded">
                    <span className="text-sm text-gray-600 print:text-black">Discount</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      {formatCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 px-3 border border-gray-300 print:border-black rounded">
                    <span className="text-sm text-gray-600 print:text-black">Due</span>
                    <span className="text-sm text-gray-600 print:text-black">
                      {formatCurrency(dueAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 px-3 border-2 border-gray-800 print:border-black rounded font-semibold bg-gray-50 print:bg-transparent">
                    <span className="text-sm">TOTAL</span>
                    <span className="text-sm">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 print:border-black">
              <div className="text-center">
                <p className="text-sm text-gray-600 print:text-black">
                  Thank you for your business! We appreciate your trust in our services.
                </p>
                <p className="text-xs text-gray-500 print:text-gray-700 mt-2">
                  For any questions regarding this invoice, please contact us at {company.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
