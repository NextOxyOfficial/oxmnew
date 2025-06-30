"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import {
  SuppliersTab,
  PurchaseHistoryTab,
  PaymentsTab,
  ProductsTab,
  CreatePurchaseModal,
  CreatePaymentModal,
} from "@/components/suppliers";
import { ClientOnly } from "@/components";

interface Purchase {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  date: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  products: string;
  notes?: string;
  proof_document?: string;
  proof_url?: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  supplier: {
    id: number;
    name: string;
  };
  date: string;
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "check";
  status: "pending" | "completed" | "failed";
  reference: string;
  notes?: string;
  proof_document?: string;
  proof_url?: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  created_at: string;
  updated_at: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  total_orders: number;
  total_amount: number;
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const formatCurrency = useCurrencyFormatter();
  const [activeTab, setActiveTab] = useState("suppliers");
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("all"); // For filtering purchases
  const [selectedPaymentSupplier, setSelectedPaymentSupplier] = useState("all"); // For filtering payments
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  // Form state for creating new supplier
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    address: "",
    phone: "",
    website: "",
    email: "",
  });

  // State for editing supplier
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Modal states
  const [showCreatePurchaseModal, setShowCreatePurchaseModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [selectedSupplierForAction, setSelectedSupplierForAction] =
    useState<Supplier | null>(null);

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type: "delete" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    type: "delete",
  });

  // Form states for modals
  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    status: "pending" as "pending" | "completed" | "cancelled",
    products: "",
    notes: "",
    proofFile: null as File | null,
    proof_document: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "cash" as "cash" | "card" | "bank_transfer" | "check",
    status: "pending" as "pending" | "completed" | "failed",
    reference: "",
    notes: "",
    proofFile: null as File | null,
    proofUrl: "",
  });

  // Real purchases state - will be populated from API
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Real payments state - will be populated from API
  const [payments, setPayments] = useState<Payment[]>([]);

  // Real suppliers state - will be populated from API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch suppliers, purchases, and payments from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log("No user found, skipping data fetch");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching data for user:", user.username);

        // Fetch suppliers first
        try {
          const suppliersResponse = await ApiService.getSuppliers();
          console.log("Suppliers fetched successfully:", suppliersResponse);

          // Ensure all suppliers have default values for orders and amount
          const suppliersWithDefaults = suppliersResponse.map(
            (supplier: Supplier) => ({
              ...supplier,
              total_orders: supplier.total_orders ?? 0,
              total_amount: supplier.total_amount ?? 0,
            })
          );

          setSuppliers(suppliersWithDefaults);
        } catch (suppliersError) {
          console.error("Error fetching suppliers:", suppliersError);
          showNotification("error", "Failed to load suppliers");
        }

        // Fetch purchases
        try {
          const purchasesResponse = await ApiService.getPurchases();
          console.log("Purchases fetched successfully:", purchasesResponse);
          setPurchases(purchasesResponse);
        } catch (purchasesError) {
          console.error("Error fetching purchases:", purchasesError);
          showNotification("error", "Failed to load purchases");
        }

        // Fetch payments
        try {
          const paymentsResponse = await ApiService.getPayments();
          console.log("Payments fetched successfully:", paymentsResponse);
          setPayments(paymentsResponse);
        } catch (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
          showNotification("error", "Failed to load payments");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        showNotification("error", "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSupplierForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePurchaseInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setPurchaseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePurchaseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Simulate file upload and get URL (in real app, upload to server/cloud storage)
      const fileUrl = URL.createObjectURL(file);
      setPurchaseForm((prev) => ({
        ...prev,
        proofFile: file,
        proof_document: fileUrl,
      }));
    }
  };

  const handlePaymentInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Simulate file upload and get URL (in real app, upload to server/cloud storage)
      const fileUrl = URL.createObjectURL(file);
      setPaymentForm((prev) => ({
        ...prev,
        proofFile: file,
        proofUrl: fileUrl,
      }));
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if supplier with same name already exists (case-insensitive)
      const supplierExists = suppliers.some(
        (supplier) =>
          supplier.name.toLowerCase().trim() ===
            supplierForm.name.toLowerCase().trim() &&
          (!editingSupplier || supplier.id !== editingSupplier.id)
      );

      if (supplierExists) {
        showNotification(
          "error",
          "Supplier already exists with this name. Please use a different name."
        );
        setLoading(false);
        return;
      }

      if (editingSupplier) {
        // Update existing supplier
        const updatedSupplier = await ApiService.updateSupplier(
          editingSupplier.id,
          {
            name: supplierForm.name,
            address: supplierForm.address || undefined,
            phone: supplierForm.phone || undefined,
            website: supplierForm.website || undefined,
            email: supplierForm.email || undefined,
          }
        );

        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === editingSupplier.id ? updatedSupplier : supplier
          )
        );
        setEditingSupplier(null);
        showNotification("success", "Supplier updated successfully!");
      } else {
        // Create new supplier
        const newSupplier = await ApiService.createSupplier({
          name: supplierForm.name,
          address: supplierForm.address || undefined,
          phone: supplierForm.phone || undefined,
          website: supplierForm.website || undefined,
          email: supplierForm.email || undefined,
        });

        // Ensure new supplier has default values for orders and amount
        const supplierWithDefaults = {
          ...newSupplier,
          total_orders: newSupplier.total_orders ?? 0,
          total_amount: newSupplier.total_amount ?? 0,
        };

        setSuppliers((prev) => [...prev, supplierWithDefaults]);
        showNotification("success", "Supplier created successfully!");
      }

      setSupplierForm({
        name: "",
        address: "",
        phone: "",
        website: "",
        email: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      const action = editingSupplier ? "update" : "create";
      showNotification(
        "error",
        `Failed to ${action} supplier. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSupplierForm = () => {
    setSupplierForm({
      name: "",
      address: "",
      phone: "",
      website: "",
      email: "",
    });
    setEditingSupplier(null);
    setShowCreateForm(false);
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedSupplierForAction) {
        throw new Error("No supplier selected");
      }

      const newPurchase = await ApiService.createPurchase({
        supplier: selectedSupplierForAction.id,
        date: purchaseForm.date,
        amount: parseFloat(purchaseForm.amount),
        status: purchaseForm.status,
        products: purchaseForm.products,
        notes: purchaseForm.notes || undefined,
        proof_document: purchaseForm.proofFile || undefined,
      });

      // Add the new purchase to the state
      setPurchases((prev) => [newPurchase, ...prev]);

      // Reset form
      setPurchaseForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        status: "pending",
        products: "",
        notes: "",
        proofFile: null,
        proof_document: "",
      });

      setShowCreatePurchaseModal(false);
      setSelectedSupplierForAction(null);
      showNotification("success", "Purchase order created successfully!");

      // Refresh purchases list to make sure we have the latest data
      try {
        const updatedPurchases = await ApiService.getPurchases();
        setPurchases(updatedPurchases);
      } catch (refreshError) {
        console.error("Failed to refresh purchases:", refreshError);
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      showNotification("error", "Failed to create purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedSupplierForAction) {
        throw new Error("No supplier selected");
      }

      const newPayment = await ApiService.createPayment({
        supplier: selectedSupplierForAction.id,
        date: paymentForm.date,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        status: paymentForm.status,
        reference: paymentForm.reference || "",
        notes: paymentForm.notes || undefined,
        proof_document: paymentForm.proofFile || undefined,
      });

      // Add the new payment to the state
      setPayments((prev) => [newPayment, ...prev]);

      // Reset form
      setPaymentForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        method: "cash",
        status: "pending",
        reference: "",
        notes: "",
        proofFile: null,
        proofUrl: "",
      });

      setShowCreatePaymentModal(false);
      setSelectedSupplierForAction(null);
      showNotification("success", "Payment record created successfully!");

      // Refresh payments list to make sure we have the latest data
      try {
        const updatedPayments = await ApiService.getPayments();
        setPayments(updatedPayments);
      } catch (refreshError) {
        console.error("Failed to refresh payments:", refreshError);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      showNotification("error", "Failed to create payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases by selected supplier
  const getFilteredPurchases = () => {
    if (selectedSupplier === "all") {
      return purchases;
    }
    return purchases.filter(
      (purchase) => purchase.supplier.name === selectedSupplier
    );
  };

  // Filter payments by selected supplier
  const getFilteredPayments = () => {
    if (selectedPaymentSupplier === "all") {
      return payments;
    }
    return payments.filter(
      (payment) => payment.supplier.name === selectedPaymentSupplier
    );
  };

  // Get unique suppliers from purchases for dropdown
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [
      ...new Set(purchases.map((purchase) => purchase.supplier.name)),
    ];
    return uniqueSuppliers.sort();
  };

  // Get unique suppliers from payments for dropdown
  const getUniqueSuppliersFromPayments = () => {
    const uniqueSuppliers = [
      ...new Set(payments.map((payment) => payment.supplier.name)),
    ];
    return uniqueSuppliers.sort();
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    // Use a consistent date format to avoid hydration mismatches
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC", // Use UTC to ensure consistency between server and client
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString; // Fallback to original string if parsing fails
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "cancelled":
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-400/30";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return "💵";
      case "card":
        return "💳";
      case "bank_transfer":
        return "🏦";
      case "check":
        return "📝";
      default:
        return "💰";
    }
  };

  const handleCreatePurchaseFromSupplier = (supplier: Supplier) => {
    setSelectedSupplierForAction(supplier);
    setPurchaseForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      status: "pending",
      products: "",
      notes: "",
      proofFile: null,
      proof_document: "",
    });
    setShowCreatePurchaseModal(true);
  };

  const handleCreatePaymentFromSupplier = (supplier: Supplier) => {
    setSelectedSupplierForAction(supplier);
    setPaymentForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      method: "cash",
      status: "pending",
      reference: "",
      notes: "",
      proofFile: null,
      proofUrl: "",
    });
    setShowCreatePaymentModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    // Pre-populate the form with supplier data for editing
    setSupplierForm({
      name: supplier.name,
      address: supplier.address || "",
      phone: supplier.phone || "",
      website: supplier.website || "",
      email: supplier.email || "",
    });
    setShowCreateForm(true);
    // Store the supplier ID for updating
    setEditingSupplier(supplier);
    showNotification(
      "success",
      `Edit mode for ${supplier.name} - Update the form and save changes`
    );
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    // Confirmation dialog before deletion
    if (
      window.confirm(
        `Are you sure you want to delete ${supplier.name}? This action cannot be undone.`
      )
    ) {
      try {
        setLoading(true);
        await ApiService.deleteSupplier(supplier.id);

        // Remove from local state
        setSuppliers((prevSuppliers) =>
          prevSuppliers.filter((s) => s.id !== supplier.id)
        );

        showNotification(
          "success",
          `${supplier.name} has been deleted successfully`
        );
      } catch (error) {
        console.error("Error deleting supplier:", error);
        showNotification(
          "error",
          "Failed to delete supplier. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdatePurchase = async (
    purchaseId: number,
    updatedData: { status: "pending" | "completed" | "cancelled" }
  ) => {
    try {
      const updatedPurchase = await ApiService.updatePurchase(
        purchaseId,
        updatedData
      );

      // Update the local state
      setPurchases((prev) =>
        prev.map((purchase) =>
          purchase.id === purchaseId
            ? { ...purchase, ...updatedPurchase }
            : purchase
        )
      );

      showNotification("success", "Purchase status updated successfully");
    } catch (error) {
      console.error("Error updating purchase:", error);
      showNotification(
        "error",
        "Failed to update purchase status. Please try again."
      );
      throw error; // Re-throw to let the component handle the error
    }
  };

  const handleUpdatePayment = async (
    paymentId: number,
    updatedData: { status: "pending" | "completed" | "failed" }
  ) => {
    try {
      const updatedPayment = await ApiService.updatePayment(
        paymentId,
        updatedData
      );

      // Update the local state
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId ? { ...payment, ...updatedPayment } : payment
        )
      );

      showNotification("success", "Payment status updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      showNotification(
        "error",
        "Failed to update payment status. Please try again."
      );
      throw error; // Re-throw to let the component handle the error
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    const supplierName = purchase?.supplier.name || "Unknown Supplier";

    setConfirmDialog({
      isOpen: true,
      title: "Delete Purchase",
      message: `Are you sure you want to delete this purchase from ${supplierName}? This action cannot be undone.`,
      type: "delete",
      onConfirm: async () => {
        try {
          await ApiService.deletePurchase(purchaseId);

          // Remove from local state
          setPurchases((prev) =>
            prev.filter((purchase) => purchase.id !== purchaseId)
          );

          showNotification("success", "Purchase deleted successfully");
        } catch (error) {
          console.error("Error deleting purchase:", error);
          showNotification(
            "error",
            "Failed to delete purchase. Please try again."
          );
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeletePayment = async (paymentId: number) => {
    const payment = payments.find((p) => p.id === paymentId);
    const supplierName = payment?.supplier.name || "Unknown Supplier";

    setConfirmDialog({
      isOpen: true,
      title: "Delete Payment",
      message: `Are you sure you want to delete this payment to ${supplierName}? This action cannot be undone.`,
      type: "delete",
      onConfirm: async () => {
        try {
          await ApiService.deletePayment(paymentId);

          // Remove from local state
          setPayments((prev) =>
            prev.filter((payment) => payment.id !== paymentId)
          );

          showNotification("success", "Payment deleted successfully");
        } catch (error) {
          console.error("Error deleting payment:", error);
          showNotification(
            "error",
            "Failed to delete payment. Please try again."
          );
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const tabs = [
    { id: "suppliers", label: "Suppliers" },
    { id: "purchases", label: "Purchase History" },
    { id: "payments", label: "Payments" },
    { id: "products", label: "Products" },
  ];

  return (
    <ClientOnly>
      <div className="p-1 sm:p-6 space-y-6">
        <div className="max-w-4xl">
          {/* Notification */}
          {notification.isVisible && (
            <div
              className={`p-4 rounded-lg border ${
                notification.type === "success"
                  ? "bg-green-500/10 border-green-400/30 text-green-300"
                  : "bg-red-500/10 border-red-400/30 text-red-300"
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {notification.type === "success" ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
                <div className="ml-3">
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
            <div className="border-b border-slate-700/50">
              <nav className="flex space-x-8 px-6 pt-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? "border-cyan-400 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-2 sm:p-6">
              {/* Suppliers Tab */}
              {activeTab === "suppliers" && (
                <SuppliersTab
                  suppliers={suppliers}
                  showCreateForm={showCreateForm}
                  setShowCreateForm={setShowCreateForm}
                  supplierForm={supplierForm}
                  handleInputChange={handleInputChange}
                  handleCreateSupplier={handleCreateSupplier}
                  handleCancelSupplierForm={handleCancelSupplierForm}
                  isEditing={!!editingSupplier}
                  loading={loading}
                  formatCurrency={formatCurrency}
                  onCreatePurchase={handleCreatePurchaseFromSupplier}
                  onCreatePayment={handleCreatePaymentFromSupplier}
                  onEditSupplier={handleEditSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                />
              )}

              {/* Purchase History Tab */}
              {activeTab === "purchases" && (
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                      <span className="ml-3 text-slate-400">
                        Loading purchases...
                      </span>
                    </div>
                  ) : (
                    <PurchaseHistoryTab
                      purchases={purchases}
                      selectedSupplier={selectedSupplier}
                      setSelectedSupplier={setSelectedSupplier}
                      getFilteredPurchases={getFilteredPurchases}
                      getUniqueSuppliers={getUniqueSuppliers}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      onUpdatePurchase={handleUpdatePurchase}
                      onDeletePurchase={handleDeletePurchase}
                    />
                  )}

                  {!loading && purchases.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">
                        No purchases found. Create your first purchase order!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <PaymentsTab
                  payments={payments}
                  selectedPaymentSupplier={selectedPaymentSupplier}
                  setSelectedPaymentSupplier={setSelectedPaymentSupplier}
                  getFilteredPayments={getFilteredPayments}
                  getUniqueSuppliersFromPayments={
                    getUniqueSuppliersFromPayments
                  }
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getPaymentMethodIcon={getPaymentMethodIcon}
                  onUpdatePayment={handleUpdatePayment}
                  onDeletePayment={handleDeletePayment}
                />
              )}

              {/* Products Tab */}
              {activeTab === "products" && (
                <ProductsTab
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}
            </div>
          </div>

          {/* Create Purchase Modal */}
          <CreatePurchaseModal
            isOpen={showCreatePurchaseModal}
            onClose={() => {
              setShowCreatePurchaseModal(false);
              setSelectedSupplierForAction(null);
            }}
            supplier={selectedSupplierForAction}
            purchaseForm={purchaseForm}
            handleInputChange={handlePurchaseInputChange}
            handleFileChange={handlePurchaseFileChange}
            handleSubmit={handleCreatePurchase}
            loading={loading}
          />

          {/* Create Payment Modal */}
          <CreatePaymentModal
            isOpen={showCreatePaymentModal}
            onClose={() => {
              setShowCreatePaymentModal(false);
              setSelectedSupplierForAction(null);
            }}
            supplier={selectedSupplierForAction}
            paymentForm={paymentForm}
            handleInputChange={handlePaymentInputChange}
            handleFileChange={handlePaymentFileChange}
            handleSubmit={handleCreatePayment}
            loading={loading}
          />

          {/* Confirmation Modal */}
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {confirmDialog.type === "delete" ? (
                      <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-100 mb-3">
                      {confirmDialog.title}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={confirmDialog.onCancel}
                    className="px-6 py-2.5 text-slate-300 hover:text-slate-100 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                      confirmDialog.type === "delete"
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        : "bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    }`}
                  >
                    {confirmDialog.type === "delete" ? "Delete" : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
