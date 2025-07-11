"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Supplier {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  category?: number;
  category_name?: string;
  supplier?: number;
  supplier_name?: string;
  location: string;
  details?: string;
  buy_price?: number;
  sell_price?: number;
  cost?: number;
  price?: number;
  stock?: number;
  is_active: boolean;
  has_variants: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  category: number | "";
  supplier: number | "";
  location: string;
  details: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  is_active: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    supplier: "",
    location: "",
    details: "",
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  const formatCurrency = useCurrencyFormatter();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  // Fetch product data and supporting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrors({});

        const [productData, categoriesResponse, suppliersResponse] =
          await Promise.all([
            ApiService.getProduct(parseInt(productId)),
            ApiService.getCategories(),
            ApiService.getSuppliers(),
          ]);

        console.log("Product data:", productData);
        console.log("Categories response:", categoriesResponse);
        console.log("Suppliers response:", suppliersResponse);

        // Handle categories response format {categories: [...]}
        const processedCategories =
          categoriesResponse?.categories || categoriesResponse || [];
        const processedSuppliers = suppliersResponse || [];

        setProduct(productData);
        setCategories(processedCategories);
        setSuppliers(processedSuppliers);

        // Populate form with product data
        setFormData({
          name: productData.name || "",
          category: productData.category || "",
          supplier: productData.supplier || "",
          location: productData.location || "",
          details: productData.details || "",
          buyPrice: productData.buy_price || productData.cost || 0,
          sellPrice: productData.sell_price || productData.price || 0,
          stock: productData.stock || 0,
          is_active: productData.is_active,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrors({
          data: "Failed to load product data. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (
      name === "buyPrice" ||
      name === "sellPrice" ||
      name === "stock"
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else if (name === "category" || name === "supplier") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!product?.has_variants) {
      if (formData.buyPrice <= 0) {
        newErrors.buyPrice = "Buy price must be greater than 0";
      }

      if (formData.sellPrice <= 0) {
        newErrors.sellPrice = "Sell price must be greater than 0";
      }

      if (formData.sellPrice < formData.buyPrice) {
        newErrors.sellPrice =
          "Sell price must be greater than or equal to buy price";
      }

      if (formData.stock < 0) {
        newErrors.stock = "Stock quantity cannot be negative";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const updateData = {
        name: formData.name,
        category:
          typeof formData.category === "number" ? formData.category : undefined,
        supplier:
          typeof formData.supplier === "number" ? formData.supplier : undefined,
        location: formData.location,
        details: formData.details,
        is_active: formData.is_active,
      };

      // Only include pricing data for non-variant products
      if (!product?.has_variants) {
        Object.assign(updateData, {
          buy_price: formData.buyPrice,
          sell_price: formData.sellPrice,
          stock: formData.stock,
        });
      }

      console.log("=== UPDATE PRODUCT DEBUG ===");
      console.log("Update data:", updateData);

      // Call API to update product
      const result = await ApiService.updateProduct(
        parseInt(productId),
        updateData
      );
      console.log("Product updated successfully:", result);

      // Show success notification
      showNotification("success", "Product updated successfully!");

      // Navigate back to products list after a short delay
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1500);
    } catch (error) {
      console.error("Error updating product:", error);
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "Error updating product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.data) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Product
            </h3>
            <p className="text-red-400/70 mb-4">{errors.data}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Product Not Found
            </h3>
            <p className="text-red-400/70 mb-4">
              The requested product could not be found.
            </p>
            <button
              onClick={() => router.push("/dashboard/products")}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Edit Product
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Update product information
          </p>
        </div>

        {/* Notification */}
        {notification.isVisible && (
          <div
            className={`p-4 rounded-lg border mb-6 ${
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

        {/* Form */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full bg-slate-800/50 border rounded-lg py-2 px-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                  errors.name ? "border-red-500" : "border-slate-700/50"
                }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category and Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-slate-800"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="supplier"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Supplier
                </label>
                <select
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">
                    Select a supplier
                  </option>
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                      className="bg-slate-800"
                    >
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full bg-slate-800/50 border rounded-lg py-2 px-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                  errors.location ? "border-red-500" : "border-slate-700/50"
                }`}
                placeholder="Enter storage location"
              />
              {errors.location && (
                <p className="text-red-400 text-xs mt-1">{errors.location}</p>
              )}
            </div>

            {/* Pricing and Stock (only for non-variant products) */}
            {!product.has_variants && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="buyPrice"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Buy Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formatCurrency(0)
                        .replace(/\d|[.,]/g, "")
                        .trim()}
                    </span>
                    <input
                      type="number"
                      id="buyPrice"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full bg-slate-800/50 border rounded-lg py-2 pl-8 pr-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                        errors.buyPrice
                          ? "border-red-500"
                          : "border-slate-700/50"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.buyPrice && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.buyPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="sellPrice"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Sell Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formatCurrency(0)
                        .replace(/\d|[.,]/g, "")
                        .trim()}
                    </span>
                    <input
                      type="number"
                      id="sellPrice"
                      name="sellPrice"
                      value={formData.sellPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full bg-slate-800/50 border rounded-lg py-2 pl-8 pr-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                        errors.sellPrice
                          ? "border-red-500"
                          : "border-slate-700/50"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.sellPrice && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.sellPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    className={`w-full bg-slate-800/50 border rounded-lg py-2 px-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                      errors.stock ? "border-red-500" : "border-slate-700/50"
                    }`}
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="text-red-400 text-xs mt-1">{errors.stock}</p>
                  )}
                </div>
              </div>
            )}

            {/* Profit Display (only for non-variant products) */}
            {!product.has_variants &&
              formData.buyPrice > 0 &&
              formData.sellPrice > 0 && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Profit per unit:</span>
                    <span
                      className={`font-bold ${
                        formData.sellPrice - formData.buyPrice > 0
                          ? "text-green-400"
                          : formData.sellPrice - formData.buyPrice < 0
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {formatCurrency(
                        Math.abs(formData.sellPrice - formData.buyPrice)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-slate-400 text-sm">
                      Profit margin:
                    </span>
                    <span
                      className={`text-sm ${
                        formData.sellPrice - formData.buyPrice > 0
                          ? "text-green-400/70"
                          : formData.sellPrice - formData.buyPrice < 0
                          ? "text-red-400/70"
                          : "text-yellow-400/70"
                      }`}
                    >
                      {formData.sellPrice > 0
                        ? (
                            ((formData.sellPrice - formData.buyPrice) /
                              formData.sellPrice) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                </div>
              )}

            {/* Details */}
            <div>
              <label
                htmlFor="details"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Details
              </label>
              <textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-none"
                placeholder="Enter additional product details..."
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-700 rounded bg-slate-800"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-slate-300"
              >
                Product is active
              </label>
            </div>

            {/* Variant Product Notice */}
            {product.has_variants && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-blue-400 text-sm font-medium">
                      This product has variants
                    </p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      Pricing and stock are managed at the variant level. To
                      edit variants, go to the product detail page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-700/50">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating Product...
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Update Product
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
