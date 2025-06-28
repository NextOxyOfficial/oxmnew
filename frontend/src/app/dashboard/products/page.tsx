"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  isDeleting?: boolean;
  isEditing?: boolean;
}

function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
  isDeleting = false,
  isEditing = false
}: ProductDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    await onDelete(product.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const profit = product.salePrice - product.buyPrice;
  const profitMargin = ((profit / product.salePrice) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-2xl my-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-medium text-slate-100">Product Details</h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header with Product Name and Category */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <h5 className="text-lg font-semibold text-slate-100">{product.name}</h5>
              <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Product ID: #{product.id}</p>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Current Stock</h6>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-cyan-300">{product.stock}</span>
                <span className="text-slate-400 text-sm">units</span>
                {product.stock < 5 && (
                  <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-2 py-1 rounded text-xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Low Stock
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Units Sold</h6>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-300">{product.sold}</span>
                <span className="text-slate-400 text-sm">units</span>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Buy Price</h6>
              <p className="text-lg font-semibold text-red-300">${product.buyPrice}</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Sale Price</h6>
              <p className="text-lg font-semibold text-green-300">${product.salePrice}</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Profit per Unit</h6>
              <p className={`text-lg font-semibold ${profit > 0 ? 'text-green-300' : profit < 0 ? 'text-red-300' : 'text-yellow-300'}`}>
                {profit > 0 ? '+' : profit < 0 ? '-' : ''}${Math.abs(profit).toFixed(2)}
              </p>
              <p className={`text-xs ${profit > 0 ? 'text-green-400/70' : profit < 0 ? 'text-red-400/70' : 'text-yellow-400/70'}`}>
                {profit > 0 ? '+' : profit < 0 ? '-' : ''}{Math.abs(parseFloat(profitMargin)).toFixed(1)}% margin
              </p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
              <h6 className="text-sm font-medium text-slate-300 mb-2">Total Inventory Value</h6>
              <p className="text-lg font-semibold text-cyan-300">${product.buyPrice * product.stock}</p>
              <p className="text-xs text-slate-400">At buy price</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
            >
              Close
            </button>
            
            <button
              onClick={() => onEdit(product)}
              disabled={isEditing}
              className={`px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isEditing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Opening Editor...
                </>
              ) : (
                'Edit Product'
              )}
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg cursor-pointer"
            >
              Delete Product
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100/10 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">Delete Product</h3>
              <p className="text-sm text-slate-400 mb-6">
                Are you sure you want to delete "{product.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleProductClick = (product: Product) => {
    console.log("Product clicked:", product.name);
    setSelectedProduct(product);
    setIsModalOpen(true);
    console.log("Modal should be open now");
  };

  const handleEditProduct = async (product: Product) => {
    setIsEditing(true);
    try {
      console.log("Edit product:", product.name);
      // TODO: Implement edit functionality
      // Simulate navigation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsModalOpen(false);
      // Navigate to edit page (TODO: implement edit page)
      // router.push(`/dashboard/products/edit/${product.id}`);
    } catch (error) {
      console.error("Error editing product:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    setIsDeleting(true);
    try {
      console.log("Delete product:", productId);
      // TODO: Implement delete functionality
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // For now, just close the modal
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = () => {
    setIsNavigating(true);
    // Add a small delay to show the spinner
    setTimeout(() => {
      router.push("/dashboard/products/add");
    }, 300);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Sample products data
  const products = [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      category: "Electronics",
      stock: 25,
      buyPrice: 2200,
      salePrice: 2800,
      sold: 5,
    },
    {
      id: 2,
      name: "iPhone 15 Pro",
      category: "Electronics",
      stock: 40,
      buyPrice: 999,
      salePrice: 1299,
      sold: 12,
    },
    {
      id: 3,
      name: "Samsung Galaxy S24",
      category: "Electronics",
      stock: 30,
      buyPrice: 850,
      salePrice: 1100,
      sold: 8,
    },
    {
      id: 4,
      name: "Dell XPS 13",
      category: "Electronics",
      stock: 15,
      buyPrice: 1200,
      salePrice: 1500,
      sold: 3,
    },
    {
      id: 5,
      name: "iPad Air",
      category: "Electronics",
      stock: 20,
      buyPrice: 599,
      salePrice: 749,
      sold: 7,
    },
    {
      id: 6,
      name: "Office Chair",
      category: "Furniture",
      stock: 12,
      buyPrice: 150,
      salePrice: 220,
      sold: 4,
    },
    {
      id: 7,
      name: "Standing Desk",
      category: "Furniture",
      stock: 8,
      buyPrice: 300,
      salePrice: 450,
      sold: 2,
    },
    {
      id: 8,
      name: "Gaming Mouse",
      category: "Accessories",
      stock: 50,
      buyPrice: 45,
      salePrice: 75,
      sold: 15,
    },
    {
      id: 9,
      name: "Mechanical Keyboard",
      category: "Accessories",
      stock: 35,
      buyPrice: 80,
      salePrice: 120,
      sold: 9,
    },
    {
      id: 10,
      name: "Wireless Headphones",
      category: "Electronics",
      stock: 22,
      buyPrice: 200,
      salePrice: 299,
      sold: 11,
    },
  ];

  // Calculate totals
  const totalProducts = products.length;
  const totalBuyPrice = products.reduce(
    (sum, product) => sum + product.buyPrice * product.stock,
    0
  );
  const totalSalePrice = products.reduce(
    (sum, product) => sum + product.salePrice * product.stock,
    0
  );
  const estimatedProfit = totalSalePrice - totalBuyPrice;

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock-high":
          return b.stock - a.stock;
        case "stock-low":
          return a.stock - b.stock;
        case "price-high":
          return b.salePrice - a.salePrice;
        case "price-low":
          return a.salePrice - b.salePrice;
        default:
          return 0;
      }
    });

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Manage your inventory and track product performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Products */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400 truncate">Total Products</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totalProducts}
                </p>
              </div>
              <div className="rounded-full bg-cyan-500/20 p-3 flex-shrink-0 ml-2">
                <svg
                  className="w-6 h-6 text-cyan-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-cyan-400 mt-2">Active inventory items</p>
          </div>

          {/* Total Buy Price */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400 truncate">Total Buy Price</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${totalBuyPrice.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-red-500/20 p-3 flex-shrink-0 ml-2">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-red-400 mt-2">Total investment</p>
          </div>

          {/* Total Sale Price */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400 truncate">Total Sale Price</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${totalSalePrice.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-green-500/20 p-3 flex-shrink-0 ml-2">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-green-400 mt-2">Potential revenue</p>
          </div>

          {/* Estimated Profit */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400 truncate">Estimated Profit</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${estimatedProfit.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-purple-500/20 p-3 flex-shrink-0 ml-2">
                <svg
                  className="w-6 h-6 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-purple-400 mt-2">
              If all sold at full price
            </p>
          </div>
        </div>

        {/* Products Table/List */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="sm:p-4 p-2 ">
            {/* Header and filters */}
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-200">Product Inventory</h3>

              {/* Mobile Layout: Stack vertically */}
              <div className="flex flex-col gap-4 lg:hidden">
                {/* Top Row: Add Product Button + Search */}
                <div className="flex gap-4">
                  {/* Add Product Button */}
                  <button 
                    onClick={handleAddProduct}
                    disabled={isNavigating}
                    className={`px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                      isNavigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {isNavigating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Product
                      </>
                    )}
                  </button>
                  
                  {/* Search - Takes remaining space */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Bottom Row: Category and Sort Filters */}
                <div className="flex gap-4">
                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm flex-1"
                  >
                    <option value="all" className="bg-slate-800">
                      All Categories
                    </option>
                    <option value="Electronics" className="bg-slate-800">
                      Electronics
                    </option>
                    <option value="Furniture" className="bg-slate-800">
                      Furniture
                    </option>
                    <option value="Accessories" className="bg-slate-800">
                      Accessories
                    </option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm flex-1"
                  >
                    <option value="name" className="bg-slate-800">
                      Sort by Name
                    </option>
                    <option value="stock-high" className="bg-slate-800">
                      Stock: High to Low
                    </option>
                    <option value="stock-low" className="bg-slate-800">
                      Stock: Low to High
                    </option>
                    <option value="price-high" className="bg-slate-800">
                      Price: High to Low
                    </option>
                    <option value="price-low" className="bg-slate-800">
                      Price: Low to High
                    </option>
                  </select>
                </div>
              </div>

              {/* Desktop Layout: Single row with all controls */}
              <div className="hidden lg:flex gap-4 items-center">
                {/* Add Product Button */}
                <button 
                  onClick={handleAddProduct}
                  disabled={isNavigating}
                  className={`px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    isNavigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isNavigating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Product
                    </>
                  )}
                </button>
                
                {/* Search - Takes remaining space */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm"
                  />
                  <svg
                    className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[160px]"
                >
                  <option value="all" className="bg-slate-800">
                    All Categories
                  </option>
                  <option value="Electronics" className="bg-slate-800">
                    Electronics
                  </option>
                  <option value="Furniture" className="bg-slate-800">
                    Furniture
                  </option>
                  <option value="Accessories" className="bg-slate-800">
                    Accessories
                  </option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 text-sm min-w-[180px]"
                >
                  <option value="name" className="bg-slate-800">
                    Sort by Name
                  </option>
                  <option value="stock-high" className="bg-slate-800">
                    Stock: High to Low
                  </option>
                  <option value="stock-low" className="bg-slate-800">
                    Stock: Low to High
                  </option>
                  <option value="price-high" className="bg-slate-800">
                    Price: High to Low
                  </option>
                  <option value="price-low" className="bg-slate-800">
                    Price: Low to High
                  </option>
                </select>
              </div>
            </div>

            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <button
                        onClick={() => handleProductClick(product)}
                        className="text-left w-full group"
                      >
                        <h4 className="text-slate-100 font-medium line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                          {product.name}
                        </h4>
                      </button>
                      <p className="text-slate-400 text-sm mt-1">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Stock</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-slate-100">
                          {product.stock} units
                        </p>
                        {product.stock < 5 && (
                          <div title="Low Stock Warning">
                            <svg
                              className="w-4 h-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sold</p>
                      <p className="text-sm font-medium text-green-400">
                        {product.sold} units
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Buy Price</p>
                      <p className="text-sm font-medium text-red-400">
                        ${product.buyPrice}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sale Price</p>
                      <p className="text-sm font-medium text-green-400">
                        ${product.salePrice}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Profit per unit</p>
                      {(() => {
                        const profit = product.salePrice - product.buyPrice;
                        const profitMargin = product.salePrice > 0 ? ((profit / product.salePrice) * 100) : 0;
                        return (
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {profit > 0 ? '+' : profit < 0 ? '-' : ''}${Math.abs(profit).toFixed(2)}
                            </p>
                            <p className={`text-xs ${profit > 0 ? 'text-green-400/70' : profit < 0 ? 'text-red-400/70' : 'text-yellow-400/70'}`}>
                              {profit > 0 ? '+' : profit < 0 ? '-' : ''}{Math.abs(profitMargin).toFixed(1)}%
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id);
                        }}
                        className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
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
                      <button 
                        onClick={() => handleProductClick(product)}
                        className="bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                        title="Add Stock"
                      >
                        Add Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Product Name
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Stock & Sold
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Buy & Sale Price
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Profit/Unit
                    </th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <button
                          onClick={() => handleProductClick(product)}
                          className="text-left group"
                        >
                          <div className="text-sm font-medium text-slate-100 line-clamp-2 leading-tight group-hover:text-cyan-400 cursor-pointer transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {product.category}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-100">
                              {product.stock} units
                            </span>
                            {product.stock < 5 && (
                              <div title="Low Stock Warning">
                                <svg
                                  className="w-4 h-4 text-yellow-500"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {product.sold} sold
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-red-400">
                            ${product.buyPrice}
                          </div>
                          <div className="text-xs text-slate-400">
                            ${product.salePrice} sale
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const profit = product.salePrice - product.buyPrice;
                          const profitMargin = product.salePrice > 0 ? ((profit / product.salePrice) * 100) : 0;
                          return (
                            <div className="space-y-1">
                              <span className={`text-sm font-bold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {profit > 0 ? '+' : profit < 0 ? '-' : ''}${Math.abs(profit).toFixed(2)}
                              </span>
                              <div className={`text-xs ${profit > 0 ? 'text-green-400/70' : profit < 0 ? 'text-red-400/70' : 'text-yellow-400/70'}`}>
                                {profit > 0 ? '+' : profit < 0 ? '-' : ''}{Math.abs(profitMargin).toFixed(1)}%
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product);
                            }}
                            className="text-slate-300 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
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
                          <button
                            onClick={() => handleProductClick(product)}
                            className="bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                            title="Add Stock"
                          >
                            Add Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 text-slate-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-slate-400 text-lg">No products found</p>
                <p className="text-slate-500 text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Modal */}
        {isModalOpen && selectedProduct && (
          <ProductDetailsModal
            isOpen={isModalOpen}
            onClose={closeModal}
            product={selectedProduct}
            onEdit={() => handleEditProduct(selectedProduct)}
            onDelete={() => handleDeleteProduct(selectedProduct.id)}
            isDeleting={isDeleting}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
}
