"use client";

import { useState } from "react";
import { Product } from "@/types/product";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    console.log("Product clicked:", product.name);
    setSelectedProduct(product);
    setIsModalOpen(true);
    console.log("Modal should be open now");
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
    <div className="py-4 px-1 sm:p-6 lg:p-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Products
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-2">
          Manage your inventory and track product performance
        </p>
      </div>

      {/* Reporting Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        {/* Total Products */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400 truncate">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3 flex-shrink-0 ml-2">
              <svg
                className="w-6 h-6 text-blue-500"
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
          <p className="text-xs text-blue-400 mt-2">Active inventory items</p>
        </div>

        {/* Total Buy Price */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400 truncate">Total Buy Price</p>
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
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400 truncate">Total Sale Price</p>
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
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400 truncate">Estimated Profit</p>
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
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-sm">
        <div className="p-2">
          {/* Header and filters */}
          <div className="flex flex-col gap-4 mb-6">
            <h3 className="text-xl font-bold text-white">Product Inventory</h3>

            {/* Mobile Layout: Stack vertically */}
            <div className="flex flex-col gap-4 lg:hidden">
              {/* Top Row: Add Product Button + Search */}
              <div className="flex gap-4">
                {/* Add Product Button */}
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Product
                </button>
                
                {/* Search - Takes remaining space */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  className="bg-white/10 border border-white/20 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                >
                  <option value="all" className="bg-gray-800">
                    All Categories
                  </option>
                  <option value="Electronics" className="bg-gray-800">
                    Electronics
                  </option>
                  <option value="Furniture" className="bg-gray-800">
                    Furniture
                  </option>
                  <option value="Accessories" className="bg-gray-800">
                    Accessories
                  </option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                >
                  <option value="name" className="bg-gray-800">
                    Sort by Name
                  </option>
                  <option value="stock-high" className="bg-gray-800">
                    Stock: High to Low
                  </option>
                  <option value="stock-low" className="bg-gray-800">
                    Stock: Low to High
                  </option>
                  <option value="price-high" className="bg-gray-800">
                    Price: High to Low
                  </option>
                  <option value="price-low" className="bg-gray-800">
                    Price: Low to High
                  </option>
                </select>
              </div>
            </div>

            {/* Desktop Layout: Single row with all controls */}
            <div className="hidden lg:flex gap-4 items-center">
              {/* Add Product Button */}
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </button>
              
              {/* Search - Takes remaining space */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="bg-white/10 border border-white/20 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[160px]"
              >
                <option value="all" className="bg-gray-800">
                  All Categories
                </option>
                <option value="Electronics" className="bg-gray-800">
                  Electronics
                </option>
                <option value="Furniture" className="bg-gray-800">
                  Furniture
                </option>
                <option value="Accessories" className="bg-gray-800">
                  Accessories
                </option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
              >
                <option value="name" className="bg-gray-800">
                  Sort by Name
                </option>
                <option value="stock-high" className="bg-gray-800">
                  Stock: High to Low
                </option>
                <option value="stock-low" className="bg-gray-800">
                  Stock: Low to High
                </option>
                <option value="price-high" className="bg-gray-800">
                  Price: High to Low
                </option>
                <option value="price-low" className="bg-gray-800">
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
                className="bg-black/20 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <button
                      onClick={() => handleProductClick(product)}
                      className="text-left w-full group"
                    >
                      <h4 className="text-white font-medium line-clamp-2 leading-tight group-hover:text-blue-400 cursor-pointer transition-colors">
                        {product.name}
                      </h4>
                    </button>
                    <p className="text-gray-400 text-sm mt-1">
                      {product.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Stock</p>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-white">
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
                    <p className="text-xs text-gray-400">Sold</p>
                    <p className="text-sm font-medium text-green-400">
                      {product.sold} units
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Buy Price</p>
                    <p className="text-sm font-medium text-red-400">
                      ${product.buyPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sale Price</p>
                    <p className="text-sm font-medium text-green-400">
                      ${product.salePrice}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Profit per unit</p>
                    <p className="text-sm font-bold text-purple-400">
                      ${product.salePrice - product.buyPrice}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
                    <button className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block overflow-x-auto scrollbar-hide">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Product Name
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Category
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Stock
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Sold
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Buy Price
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Sale Price
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Profit/Unit
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 max-w-xs">
                      <button
                        onClick={() => handleProductClick(product)}
                        className="text-left group"
                      >
                        <span className="text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-blue-400 cursor-pointer transition-colors">
                          {product.name}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-300">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white">
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
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-green-400">
                        {product.sold} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-red-400">
                        ${product.buyPrice}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-green-400">
                        ${product.salePrice}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-purple-400">
                        ${product.salePrice - product.buyPrice}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
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
                          className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
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
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
              <p className="text-gray-400 text-lg">No products found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={closeModal}
          ></div>

          {/* Modal panel */}
          <div className="relative bg-gray-900 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{selectedProduct.name}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Category</label>
                  <p className="text-white">{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Stock</label>
                  <p className="text-white">{selectedProduct.stock} units</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Buy Price</label>
                  <p className="text-red-400">${selectedProduct.buyPrice}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Sale Price</label>
                  <p className="text-green-400">${selectedProduct.salePrice}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
