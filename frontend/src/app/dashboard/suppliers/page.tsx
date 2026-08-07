"use client";

import { ClientOnly } from "@/components";
import {
  CreatePaymentModal,
  CreatePurchaseModal,
  PaymentsTab,
  ProductsTab,
  PurchaseHistoryTab,
  SuppliersTab,
} from "@/components/suppliers";
import { useConfirm } from "@/components/ui/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import React, { useEffect, useState } from "react";

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
  const confirm = useConfirm();
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

  // Pagination state for suppliers
  const [suppliersPagination, setSuppliersPagination] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    hasNextPage: boolean;
    isLoadingMore: boolean;
  }>({
    count: 0,
    next: null,
    previous: null,
    hasNextPage: false,
    isLoadingMore: false,
  });

  // Fetch suppliers, purchases, and payments from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log("SuppliersPage: No user found, skipping data fetch");
        return;
      }

      try {
        setLoading(true);
        console.log("SuppliersPage: Fetching data for user:", user.username, "User ID:", user.id);

        // Fetch suppliers first
        try {
          const suppliersResponse = await ApiService.getSuppliers();
          console.log("SuppliersPage: Suppliers fetched successfully:", suppliersResponse);

          // Handle different response formats (array vs paginated response)
          let suppliersData = suppliersResponse;
          if (
            suppliersResponse &&
            typeof suppliersResponse === "object" &&
            !Array.isArray(suppliersResponse)
          ) {
            // Check if it's a paginated response with results field
            if (
              suppliersResponse.results &&
              Array.isArray(suppliersResponse.results)
            ) {
              suppliersData = suppliersResponse.results;

              // Update pagination state
              setSuppliersPagination({
                count: suppliersResponse.count || 0,
                next: suppliersResponse.next || null,
                previous: suppliersResponse.previous || null,
                hasNextPage: !!suppliersResponse.next,
                isLoadingMore: false,
              });
            } else {
              // If it's not an array and doesn't have results, wrap it in an array
              suppliersData = [suppliersResponse];
              setSuppliersPagination({
                count: 1,
                next: null,
                previous: null,
                hasNextPage: false,
                isLoadingMore: false,
              });
            }
          } else {
            // Direct array response
            setSuppliersPagination({
              count: Array.isArray(suppliersData) ? suppliersData.length : 0,
              next: null,
              previous: null,
              hasNextPage: false,
              isLoadingMore: false,
            });
          }

          // Ensure suppliersData is an array
          if (!Array.isArray(suppliersData)) {
            console.error(
              "Unexpected suppliers response format:",
              suppliersResponse
            );
            suppliersData = [];
          }

          // Ensure all suppliers have default values for orders and amount
          const suppliersWithDefaults = suppliersData.map(
            (supplier: Supplier) => ({
              ...supplier,
              total_orders: supplier.total_orders ?? 0,
              total_amount: supplier.total_amount ?? 0,
            })
          );

          setSuppliers(suppliersWithDefaults);
        } catch (suppliersError) {
          console.error("Error fetching suppliers:", suppliersError);
          setSuppliers([]); // Set empty array as fallback
          setSuppliersPagination({
            count: 0,
            next: null,
            previous: null,
            hasNextPage: false,
            isLoadingMore: false,
          });
          showNotification("error", "সাপ্লায়ার লোড করা যায়নি");
        }

        // Fetch purchases
        try {
          const purchasesResponse = await ApiService.getPurchases();
          console.log("Purchases fetched successfully:", purchasesResponse);
          setPurchases(
            Array.isArray(purchasesResponse) ? purchasesResponse : []
          );
        } catch (purchasesError) {
          console.error("Error fetching purchases:", purchasesError);
          setPurchases([]); // Set empty array as fallback
          showNotification("error", "কেনাকাটার হিস্ট্রি লোড করা যায়নি");
        }

        // Fetch payments
        try {
          const paymentsResponse = await ApiService.getPayments();
          console.log("Payments fetched successfully:", paymentsResponse);
          setPayments(Array.isArray(paymentsResponse) ? paymentsResponse : []);
        } catch (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
          setPayments([]); // Set empty array as fallback
          showNotification("error", "পেমেন্ট লোড করা যায়নি");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        showNotification("error", "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const loadMoreSuppliers = async () => {
    if (!suppliersPagination.next || suppliersPagination.isLoadingMore) {
      return;
    }

    try {
      setSuppliersPagination((prev) => ({ ...prev, isLoadingMore: true }));

      // Extract the page number from the next URL
      const url = new URL(suppliersPagination.next);
      const page = url.searchParams.get("page");

      const response = await ApiService.getSuppliers(page ? parseInt(page) : 2);
      console.log("More suppliers fetched:", response);

      if (response && response.results && Array.isArray(response.results)) {
        // Ensure all suppliers have default values for orders and amount
        const newSuppliersWithDefaults = response.results.map(
          (supplier: Supplier) => ({
            ...supplier,
            total_orders: supplier.total_orders ?? 0,
            total_amount: supplier.total_amount ?? 0,
          })
        );

        // Append new suppliers to existing ones
        setSuppliers((prev) => [...prev, ...newSuppliersWithDefaults]);

        // Update pagination state
        setSuppliersPagination({
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          hasNextPage: !!response.next,
          isLoadingMore: false,
        });
      }
    } catch (error) {
      console.error("Error loading more suppliers:", error);
      setSuppliersPagination((prev) => ({ ...prev, isLoadingMore: false }));
      showNotification("error", "আরও সাপ্লায়ার লোড করা যায়নি");
    }
  };

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
          "এই নামে একজন সাপ্লায়ার আগেই আছে। অন্য নাম দিন।"
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
        showNotification("success", "সাপ্লায়ারের তথ্য আপডেট হয়ে গেছে!");
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
        showNotification("success", "নতুন সাপ্লায়ার যোগ হয়ে গেছে!");
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
      const action = editingSupplier ? "আপডেট" : "যোগ";
      showNotification(
        "error",
        `সাপ্লায়ার ${action} করা যায়নি। আবার চেষ্টা করুন।`
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

      // Pass the actual file to the API service, not a local URL
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
      showNotification("success", "কেনাকাটা যোগ হয়ে গেছে!");

      // Refresh purchases list to make sure we have the latest data
      try {
        const updatedPurchases = await ApiService.getPurchases();
        setPurchases(Array.isArray(updatedPurchases) ? updatedPurchases : []);
      } catch (refreshError) {
        console.error("Failed to refresh purchases:", refreshError);
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      showNotification("error", "কেনাকাটা যোগ করা যায়নি। আবার চেষ্টা করুন।");
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

      // Pass the actual file to the API service, not a local URL
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
      showNotification("success", "পেমেন্ট যোগ হয়ে গেছে!");

      // Refresh payments list to make sure we have the latest data
      try {
        const updatedPayments = await ApiService.getPayments();
        setPayments(Array.isArray(updatedPayments) ? updatedPayments : []);
      } catch (refreshError) {
        console.error("Failed to refresh payments:", refreshError);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      showNotification("error", "পেমেন্ট যোগ করা যায়নি। আবার চেষ্টা করুন।");
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
        return "badge badge-success";
      case "pending":
        return "badge badge-warn";
      case "cancelled":
      case "failed":
        return "badge badge-danger";
      default:
        return "badge badge-muted";
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
      `${supplier.name} এডিট করছেন — তথ্য ঠিক করে সেভ করুন`
    );
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    // Confirmation dialog before deletion
    const confirmed = await confirm({
      title: "সাপ্লায়ার ডিলিট করবেন?",
      message: `${supplier.name} কে ডিলিট করবেন? এটা আর ফেরানো যাবে না।`,
      confirmLabel: "ডিলিট করুন",
      danger: true,
    });

    if (confirmed) {
      try {
        setLoading(true);
        await ApiService.deleteSupplier(supplier.id);

        // Remove from local state
        setSuppliers((prevSuppliers) =>
          prevSuppliers.filter((s) => s.id !== supplier.id)
        );

        showNotification(
          "success",
          `${supplier.name} ডিলিট হয়ে গেছে`
        );
      } catch (error) {
        console.error("Error deleting supplier:", error);
        showNotification(
          "error",
          "সাপ্লায়ার ডিলিট করা যায়নি। আবার চেষ্টা করুন।"
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
      console.log("handleUpdatePurchase called with:", { purchaseId, updatedData });
      
      const updatedPurchase = await ApiService.updatePurchase(
        purchaseId,
        updatedData
      );

      console.log("Purchase updated successfully:", updatedPurchase);

      // Update the local state
      setPurchases((prev) =>
        prev.map((purchase) =>
          purchase.id === purchaseId
            ? { ...purchase, ...updatedPurchase }
            : purchase
        )
      );

      showNotification("success", "কেনাকাটার অবস্থা আপডেট হয়ে গেছে");
    } catch (error) {
      console.error("Error updating purchase:", error);
      console.error("Error details:", {
        purchaseId,
        updatedData,
        error: error instanceof Error ? error.message : error
      });
      showNotification(
        "error",
        "কেনাকাটার অবস্থা আপডেট করা যায়নি। আবার চেষ্টা করুন।"
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

      showNotification("success", "পেমেন্টের অবস্থা আপডেট হয়ে গেছে");
    } catch (error) {
      console.error("Error updating payment:", error);
      showNotification(
        "error",
        "পেমেন্টের অবস্থা আপডেট করা যায়নি। আবার চেষ্টা করুন।"
      );
      throw error; // Re-throw to let the component handle the error
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    const supplierName = purchase?.supplier.name || "অজানা সাপ্লায়ার";

    setConfirmDialog({
      isOpen: true,
      title: "কেনাকাটা ডিলিট করবেন?",
      message: `${supplierName} এর কাছ থেকে করা এই কেনাকাটাটা ডিলিট করবেন? এটা আর ফেরানো যাবে না।`,
      type: "delete",
      onConfirm: async () => {
        try {
          await ApiService.deletePurchase(purchaseId);

          // Remove from local state
          setPurchases((prev) =>
            prev.filter((purchase) => purchase.id !== purchaseId)
          );

          showNotification("success", "কেনাকাটা ডিলিট হয়ে গেছে");
        } catch (error) {
          console.error("Error deleting purchase:", error);
          showNotification(
            "error",
            "কেনাকাটা ডিলিট করা যায়নি। আবার চেষ্টা করুন।"
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
    const supplierName = payment?.supplier.name || "অজানা সাপ্লায়ার";

    setConfirmDialog({
      isOpen: true,
      title: "পেমেন্ট ডিলিট করবেন?",
      message: `${supplierName} কে দেওয়া এই পেমেন্টটা ডিলিট করবেন? এটা আর ফেরানো যাবে না।`,
      type: "delete",
      onConfirm: async () => {
        try {
          await ApiService.deletePayment(paymentId);

          // Remove from local state
          setPayments((prev) =>
            prev.filter((payment) => payment.id !== paymentId)
          );

          showNotification("success", "পেমেন্ট ডিলিট হয়ে গেছে");
        } catch (error) {
          console.error("Error deleting payment:", error);
          showNotification(
            "error",
            "পেমেন্ট ডিলিট করা যায়নি। আবার চেষ্টা করুন।"
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
    { id: "suppliers", label: "সাপ্লায়ার" },
    { id: "purchases", label: "কেনাকাটার হিস্ট্রি" },
    { id: "payments", label: "পেমেন্ট" },
    { id: "products", label: "প্রোডাক্ট" },
  ];

  return (
    <ClientOnly>
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">সাপ্লায়ার</h1>
            <p className="page-sub">
              সাপ্লায়ার, কেনাকাটা আর পেমেন্টের হিসাব এক জায়গায়
            </p>
          </div>
        </header>

        <div className="plane">
          {/* Notification */}
          {notification.isVisible && (
            <div className="plane-section flex flex-wrap items-center gap-2">
              <span
                className={`badge ${
                  notification.type === "success"
                    ? "badge-success"
                    : "badge-danger"
                }`}
              >
                {notification.type === "success" ? "হয়ে গেছে" : "সমস্যা"}
              </span>
              <p className="text-sm text-slate-600">{notification.message}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="plane-section">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn btn-sm ${
                    activeTab === tab.id ? "btn-primary" : "btn-ghost"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

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
              // Pagination props
              hasNextPage={suppliersPagination.hasNextPage}
              isLoadingMore={suppliersPagination.isLoadingMore}
              totalCount={suppliersPagination.count}
              onLoadMore={loadMoreSuppliers}
            />
          )}

          {/* Purchase History Tab */}
          {activeTab === "purchases" && (
            <>
              {loading ? (
                <div className="empty">কেনাকাটার হিস্ট্রি লোড হচ্ছে…</div>
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
                <div className="empty">
                  এখনো কোনো কেনাকাটা নেই। প্রথম কেনাকাটাটা যোগ করুন!
                </div>
              )}
            </>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <PaymentsTab
              payments={payments}
              selectedPaymentSupplier={selectedPaymentSupplier}
              setSelectedPaymentSupplier={setSelectedPaymentSupplier}
              getFilteredPayments={getFilteredPayments}
              getUniqueSuppliersFromPayments={getUniqueSuppliersFromPayments}
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
          <div className="modal-backdrop">
            <div className="modal" style={{ maxWidth: "28rem" }}>
              <div className="modal-head">
                <h2 className="modal-title">{confirmDialog.title}</h2>
              </div>
              <div className="modal-body">
                <p className="text-sm text-slate-600">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="modal-foot">
                <button
                  onClick={confirmDialog.onCancel}
                  className="btn btn-ghost"
                >
                  বাতিল
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`btn ${
                    confirmDialog.type === "delete"
                      ? "btn-danger"
                      : "btn-primary"
                  }`}
                >
                  {confirmDialog.type === "delete" ? "ডিলিট করুন" : "ঠিক আছে"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  );
}
