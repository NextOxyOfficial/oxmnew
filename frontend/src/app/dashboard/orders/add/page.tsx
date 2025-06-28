"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import { Product } from "@/types/product";

// Types for the order
interface OrderItem {
  id: string;
  product: number;
  variant?: number;
  quantity: number;
  unit_price: number;
  total: number;
  product_name: string;
  variant_details?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
}

interface OrderForm {
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  additional_cost: number;
  vat_percentage: number;
  vat_amount: number;
  total: number;
  due_date: string;
  notes: string;
  status: "draft" | "pending" | "confirmed";
}

export default function AddOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order form state
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
    },
    items: [],
    subtotal: 0,
    discount_percentage: 0,
    discount_amount: 0,
    additional_cost: 0,
    vat_percentage: 18, // Default VAT
    vat_amount: 0,
    total: 0,
    due_date: "",
    notes: "",
    status: "draft",
  });

  // State for adding new items
  const [newItem, setNewItem] = useState({
    product: "",
    variant: "",
    quantity: 1,
    unit_price: 0,
  });

  useEffect(() => {
    fetchProducts();
    // Set default due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    setOrderForm((prev) => ({
      ...prev,
      due_date: dueDate.toISOString().split("T")[0],
    }));
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await ApiService.getProducts();
      setProducts(Array.isArray(response) ? response : response?.results || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Calculate totals
  const calculateTotals = (
    items: OrderItem[],
    discountPercentage: number,
    additionalCost: number,
    vatPercentage: number
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discountPercentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const withAdditionalCost = afterDiscount + additionalCost;
    const vatAmount = (withAdditionalCost * vatPercentage) / 100;
    const total = withAdditionalCost + vatAmount;

    return {
      subtotal,
      discountAmount,
      vatAmount,
      total,
    };
  };

  // Update totals when items, discount, or VAT changes
  useEffect(() => {
    const { subtotal, discountAmount, vatAmount, total } = calculateTotals(
      orderForm.items,
      orderForm.discount_percentage,
      orderForm.additional_cost,
      orderForm.vat_percentage
    );

    setOrderForm((prev) => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      vat_amount: vatAmount,
      total,
    }));
  }, [
    orderForm.items,
    orderForm.discount_percentage,
    orderForm.additional_cost,
    orderForm.vat_percentage,
  ]);

  // Handle customer info changes
  const handleCustomerChange = (field: keyof CustomerInfo, value: string) => {
    setOrderForm((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
  };

  // Handle new item form changes
  const handleNewItemChange = (field: string, value: string | number) => {
    setNewItem((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-fill unit price when product or variant is selected
      if (field === "product") {
        const selectedProduct = products.find(
          (p) => p.id === parseInt(value as string)
        );
        if (selectedProduct) {
          updated.unit_price = selectedProduct.sell_price || 0;
          updated.variant = ""; // Reset variant when product changes
        }
      } else if (field === "variant") {
        const selectedProduct = products.find(
          (p) => p.id === parseInt(prev.product)
        );
        const selectedVariant = selectedProduct?.variants?.find(
          (v) => v.id === parseInt(value as string)
        );
        if (selectedVariant) {
          updated.unit_price = selectedVariant.sell_price || 0;
        }
      }

      return updated;
    });
  };

  // Add item to order
  const addItemToOrder = () => {
    if (!newItem.product || newItem.quantity <= 0) {
      setError("Please select a product and enter a valid quantity");
      return;
    }

    const selectedProduct = products.find(
      (p) => p.id === parseInt(newItem.product)
    );
    if (!selectedProduct) return;

    const selectedVariant = selectedProduct.variants?.find(
      (v) => v.id === parseInt(newItem.variant)
    );

    const item: OrderItem = {
      id: Date.now().toString(),
      product: parseInt(newItem.product),
      variant: newItem.variant ? parseInt(newItem.variant) : undefined,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total: newItem.quantity * newItem.unit_price,
      product_name: selectedProduct.name,
      variant_details: selectedVariant
        ? `${selectedVariant.color} - ${selectedVariant.size}${
            selectedVariant.custom_variant
              ? ` - ${selectedVariant.custom_variant}`
              : ""
          }`
        : undefined,
    };

    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));

    // Reset new item form
    setNewItem({
      product: "",
      variant: "",
      quantity: 1,
      unit_price: 0,
    });
    setError(null);
  };

  // Remove item from order
  const removeItem = (itemId: string) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return;

    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      ),
    }));
  };

  // Handle form submission
  const handleSubmit = async (status: "draft" | "pending") => {
    if (orderForm.items.length === 0) {
      setError("Please add at least one item to the order");
      return;
    }

    if (!orderForm.customer.name) {
      setError("Please enter customer name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create individual sales for each item
      for (const item of orderForm.items) {
        const saleData = {
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customer_name: orderForm.customer.name,
          customer_phone: orderForm.customer.phone || undefined,
          customer_email: orderForm.customer.email || undefined,
          notes: `Order Status: ${status}\nDue Date: ${
            orderForm.due_date
          }\nCustomer Address: ${orderForm.customer.address}\n${
            orderForm.customer.company
              ? `Company: ${orderForm.customer.company}\n`
              : ""
          }Order Notes: ${orderForm.notes}`,
        };

        await ApiService.createProductSale(saleData);
      }

      // Navigate back to orders page
      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get selected product for new item
  const selectedProduct = products.find(
    (p) => p.id === parseInt(newItem.product)
  );
  const availableVariants = selectedProduct?.has_variants
    ? selectedProduct.variants || []
    : [];

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Create New Order
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Add customer information and order items
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer Info & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={orderForm.customer.name}
                      onChange={(e) =>
                        handleCustomerChange("name", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={orderForm.customer.company}
                      onChange={(e) =>
                        handleCustomerChange("company", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Company name (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={orderForm.customer.email}
                      onChange={(e) =>
                        handleCustomerChange("email", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={orderForm.customer.phone}
                      onChange={(e) =>
                        handleCustomerChange("phone", e.target.value)
                      }
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Address
                    </label>
                    <textarea
                      value={orderForm.customer.address}
                      onChange={(e) =>
                        handleCustomerChange("address", e.target.value)
                      }
                      rows={2}
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      placeholder="Customer address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
              <div className="sm:p-4 p-2">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Order Items
                </h3>

                {/* Order Items List */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">
                    Items in Order ({orderForm.items.length})
                  </h4>
                  {orderForm.items.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 14H6L5 9z"
                        />
                      </svg>
                      <p>No items added yet</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Use the form below to add items to your order
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderForm.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-slate-800/30 border border-slate-700/30 rounded-lg p-4"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-100">
                              {item.product_name}
                            </div>
                            {item.variant_details && (
                              <div className="text-sm text-slate-400">
                                {item.variant_details}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateItemQuantity(item.id, item.quantity - 1)
                                }
                                className="w-8 h-8 rounded bg-slate-600 text-slate-300 hover:bg-slate-500 flex items-center justify-center transition-colors"
                              >
                                −
                              </button>
                              <span className="w-12 text-center text-slate-100">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateItemQuantity(item.id, item.quantity + 1)
                                }
                                className="w-8 h-8 rounded bg-slate-600 text-slate-300 hover:bg-slate-500 flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400">
                                {formatCurrency(item.unit_price)} each
                              </div>
                              <div className="font-medium text-slate-100">
                                {formatCurrency(item.total)}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-400 hover:text-red-300 ml-2 transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
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
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Item Form */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">
                    Add New Item
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Product
                      </label>
                      <select
                        value={newItem.product}
                        onChange={(e) =>
                          handleNewItemChange("product", e.target.value)
                        }
                        disabled={isLoadingProducts}
                        className={`w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                          isLoadingProducts
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <option value="" className="bg-slate-800">
                          {isLoadingProducts
                            ? "Loading products..."
                            : "Select product"}
                        </option>
                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                            className="bg-slate-800"
                          >
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct?.has_variants && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Variant
                        </label>
                        <select
                          value={newItem.variant}
                          onChange={(e) =>
                            handleNewItemChange("variant", e.target.value)
                          }
                          className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        >
                          <option value="" className="bg-slate-800">
                            Select variant
                          </option>
                          {availableVariants.map((variant) => (
                            <option
                              key={variant.id}
                              value={variant.id}
                              className="bg-slate-800"
                            >
                              {variant.color} - {variant.size}
                              {variant.custom_variant &&
                                ` - ${variant.custom_variant}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) =>
                          handleNewItemChange(
                            "quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="1"
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        value={newItem.unit_price}
                        onChange={(e) =>
                          handleNewItemChange(
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.01"
                        min="0"
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={addItemToOrder}
                        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Bill Summary */}
            <div className="space-y-6">
              {/* Bill Summary */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
                <div className="sm:p-4 p-2">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Bill Summary
                  </h3>

                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="text-slate-100">
                        {formatCurrency(orderForm.subtotal)}
                      </span>
                    </div>

                    {/* Discount */}
                    <div className="border-t border-slate-700/50 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">Discount:</span>
                        <span className="text-slate-100">
                          -{formatCurrency(orderForm.discount_amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderForm.discount_percentage}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              discount_percentage:
                                parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                      </div>
                    </div>

                    {/* Additional Cost */}
                    <div className="border-t border-slate-700/50 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">Additional Cost:</span>
                        <span className="text-slate-100">
                          {formatCurrency(orderForm.additional_cost)}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={orderForm.additional_cost}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            additional_cost: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* VAT */}
                    <div className="border-t border-slate-700/50 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">VAT:</span>
                        <span className="text-slate-100">
                          {formatCurrency(orderForm.vat_amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={orderForm.vat_percentage}
                          onChange={(e) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              vat_percentage: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="flex-1 bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                          placeholder="18"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-slate-700/50 pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-slate-100">Total:</span>
                        <span className="text-cyan-400">
                          {formatCurrency(orderForm.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Settings */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
                <div className="sm:p-4 p-2">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Order Settings
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={orderForm.due_date}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            due_date: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Notes
                      </label>
                      <textarea
                        value={orderForm.notes}
                        onChange={(e) =>
                          setOrderForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                        placeholder="Order notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSubmit("pending")}
                  disabled={isSubmitting || orderForm.items.length === 0}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </button>

                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={isSubmitting || orderForm.items.length === 0}
                  className="w-full px-6 py-3 bg-slate-600 text-slate-100 text-sm font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all duration-200"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
