"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product, StockEntry } from "@/types/product";
import { ApiService } from "@/lib/api";
import ProductDetailsModal from "@/components/ProductDetailsModal";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching products...");
        const productsData = await ApiService.getProducts();
        console.log("Products response:", productsData);
        
        // Handle different response formats
        const productsList = Array.isArray(productsData) ? productsData : productsData?.results || [];
        setProducts(productsList);
        
        // Extract unique categories from products
        const uniqueCategories = [...new Set(
          productsList
            .map((product: Product) => product.category_name)
            .filter(Boolean)
        )] as string[];
        setCategories(uniqueCategories);
        
        console.log("Loaded products:", productsList.length);
        console.log("Unique categories:", uniqueCategories);
        
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(error instanceof Error ? error.message : "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
      // When real edit API is implemented, call refreshProducts() here
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
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log("Delete product:", productId);
      // TODO: Implement delete functionality
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // When real delete API is implemented, call refreshProducts() here
      // For now, just close the modal
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteConfirmation = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleAddStock = async (productId: number, stockData: {
    quantity: number;
    buy_price: number;
    sell_price: number;
    reason: string;
    notes?: string;
    variant_id?: number;
  }) => {
    setIsAddingStock(true);
    try {
      console.log("Add stock:", { productId, ...stockData });
      // TODO: Implement add stock functionality
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // When real add stock API is implemented, call refreshProducts() here
      // For demo purposes, we would update the product stock here
      // This would typically involve calling an API and then updating the local state
      
      const profit = stockData.sell_price - stockData.buy_price;
      console.log(`Added ${stockData.quantity} units to product ${productId} - Buy: $${stockData.buy_price}, Sell: $${stockData.sell_price}, Profit: $${Number(profit).toFixed(2)} per unit`);
    } catch (error) {
      console.error("Error adding stock:", error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsAddingStock(false);
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

  // Calculate totals from dynamic data
  const totalProducts = products.length;
  const totalBuyPrice = products.reduce((sum, product) => {
    const buyPrice = Number(product.has_variants 
      ? product.average_buy_price || 0
      : product.buy_price || 0);
    const stock = Number(product.has_variants 
      ? product.total_stock || 0
      : product.stock || 0);
    return sum + (buyPrice * stock);
  }, 0);
  
  const totalSalePrice = products.reduce((sum, product) => {
    const sellPrice = Number(product.has_variants 
      ? product.average_sell_price || 0
      : product.sell_price || 0);
    const stock = Number(product.has_variants 
      ? product.total_stock || 0
      : product.stock || 0);
    return sum + (sellPrice * stock);
  }, 0);
  
  const estimatedProfit = totalSalePrice - totalBuyPrice;

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || product.category_name === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "stock-high":
          const aStock = a.has_variants ? a.total_stock || 0 : a.stock;
          const bStock = b.has_variants ? b.total_stock || 0 : b.stock;
          return bStock - aStock;
        case "stock-low":
          const aStockLow = a.has_variants ? a.total_stock || 0 : a.stock;
          const bStockLow = b.has_variants ? b.total_stock || 0 : b.stock;
          return aStockLow - bStockLow;
        case "price-high":
          const aSellPrice = a.has_variants ? a.average_sell_price || 0 : a.sell_price || 0;
          const bSellPrice = b.has_variants ? b.average_sell_price || 0 : b.sell_price || 0;
          return bSellPrice - aSellPrice;
        case "price-low":
          const aSellPriceLow = a.has_variants ? a.average_sell_price || 0 : a.sell_price || 0;
          const bSellPriceLow = b.has_variants ? b.average_sell_price || 0 : b.sell_price || 0;
          return aSellPriceLow - bSellPriceLow;
        default:
          return 0;
      }
    });

  // Loading state
  if (isLoading) {
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

          {/* Loading skeleton */}
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls skeleton */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-700 rounded mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-10 bg-slate-700 rounded flex-1"></div>
                  <div className="h-10 bg-slate-700 rounded w-40"></div>
                  <div className="h-10 bg-slate-700 rounded w-40"></div>
                </div>
              </div>
            </div>

            {/* Products skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-slate-700 rounded w-20"></div>
                      <div className="h-6 bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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

          {/* Error message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Products</h3>
            <p className="text-red-400/70 mb-4">{error}</p>
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

  // Function to refresh products data
  const refreshProducts = async () => {
    try {
      setError(null);
      console.log("Refreshing products...");
      const productsData = await ApiService.getProducts();
      console.log("Products refreshed:", productsData);
      
      const productsList = Array.isArray(productsData) ? productsData : productsData?.results || [];
      setProducts(productsList);
      
      // Update categories
      const uniqueCategories = [...new Set(
        productsList
          .map((product: Product) => product.category_name)
          .filter(Boolean)
      )] as string[];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error("Error refreshing products:", error);
      setError(error instanceof Error ? error.message : "Failed to refresh products");
    }
  };

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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2v-14a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-slate-800">
                      {category}
                    </option>
                  ))}
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
                        {product.category_name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Stock</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-medium text-slate-100">
                          {product.has_variants ? (product.total_stock || 0) : product.stock} units
                        </p>
                        {((product.has_variants ? (product.total_stock || 0) : product.stock) < 5) && (
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
                        ${product.has_variants ? Number(product.average_buy_price || 0).toFixed(2) : Number(product.buy_price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sale Price</p>
                      <p className="text-sm font-medium text-green-400">
                        ${product.has_variants ? Number(product.average_sell_price || 0).toFixed(2) : Number(product.sell_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Profit per unit</p>
                      {(() => {
                        const salePrice = Number(product.has_variants 
                          ? product.average_sell_price || 0
                          : product.sell_price || 0);
                        const buyPrice = Number(product.has_variants 
                          ? product.average_buy_price || 0
                          : product.buy_price || 0);
                        const profit = salePrice - buyPrice;
                        const profitMargin = salePrice > 0 ? ((profit / salePrice) * 100) : 0;
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
                          showDeleteConfirmation(product);
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
                            {product.category_name}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-100">
                              {product.has_variants ? (product.total_stock || 0) : product.stock} units
                            </span>
                            {((product.has_variants ? (product.total_stock || 0) : product.stock) < 5) && (
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
                            ${product.has_variants ? Number(product.average_buy_price || 0).toFixed(2) : Number(product.buy_price || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">
                            ${product.has_variants ? Number(product.average_sell_price || 0).toFixed(2) : Number(product.sell_price || 0).toFixed(2)} sale
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const salePrice = Number(product.has_variants 
                            ? product.average_sell_price || 0
                            : product.sell_price || 0);
                          const buyPrice = Number(product.has_variants 
                            ? product.average_buy_price || 0
                            : product.buy_price || 0);
                          const profit = salePrice - buyPrice;
                          const profitMargin = salePrice > 0 ? ((profit / salePrice) * 100) : 0;
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
                              showDeleteConfirmation(product);
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
          {!isLoading && !error && filteredProducts.length === 0 && (
            <div className="col-span-full">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-8 text-center">
                  <div className="text-slate-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    {searchTerm || filterCategory !== "all" ? "No products found" : "No products yet"}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {searchTerm || filterCategory !== "all" 
                      ? "Try adjusting your search criteria or filters." 
                      : "Get started by adding your first product to the inventory."
                    }
                  </p>
                  {(!searchTerm && filterCategory === "all") && (
                    <button
                      onClick={handleAddProduct}
                      disabled={isNavigating}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200"
                    >
                      Add Your First Product
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Modal */}
        {isModalOpen && selectedProduct && (
          <ProductDetailsModal
            isOpen={isModalOpen}
            onClose={closeModal}
            product={{
              id: selectedProduct.id,
              name: selectedProduct.name,
              sku: `PRD-${selectedProduct.id}`, // Generate SKU if not provided
              category: selectedProduct.category_name || 'Uncategorized',
              stock: selectedProduct.has_variants 
                ? selectedProduct.total_stock || 0
                : selectedProduct.stock,
              price: selectedProduct.has_variants 
                ? selectedProduct.average_sell_price || 0
                : selectedProduct.sell_price || 0,
              cost: selectedProduct.has_variants 
                ? selectedProduct.average_buy_price || 0
                : selectedProduct.buy_price || 0,
              status: selectedProduct.is_active ? 'active' : 'inactive',
              supplier: selectedProduct.supplier_name,
              variants: selectedProduct.variants as any,
              created_at: selectedProduct.created_at,
              updated_at: selectedProduct.updated_at,
            }}
            onAddStock={handleAddStock}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={cancelDelete} />
              
              <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Delete Product</h3>
                      <p className="text-sm text-slate-400">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-slate-300 mb-2">
                    Are you sure you want to delete this product?
                  </p>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{productToDelete.name}</p>
                        <p className="text-sm text-slate-400">SKU: {productToDelete.sku}</p>
                        <p className="text-sm text-slate-400">{productToDelete.stock} units in stock</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ This will permanently delete the product and all its associated data.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(productToDelete.id)}
                    disabled={isDeleting}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDeleting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      'Delete Product'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
