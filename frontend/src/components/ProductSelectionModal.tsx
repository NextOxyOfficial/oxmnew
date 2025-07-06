"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { X, Search, Package, Check, ShoppingCart } from "lucide-react";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onPublish: (selectedProducts: Product[]) => void;
  publishedProductIds: number[];
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  onPublish,
  publishedProductIds
}: ProductSelectionModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter out already published products
  const availableProducts = products.filter(
    product => !publishedProductIds.includes(product.id)
  );

  // Get unique categories
  const categories = Array.from(
    new Set(availableProducts.map(p => p.category_name || "Uncategorized"))
  );

  // Filter products based on search and category
  const filteredProducts = availableProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category_name === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductToggle = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handlePublish = async () => {
    if (selectedProducts.length === 0) return;
    
    setIsPublishing(true);
    try {
      const productsToPublish = products.filter(p => selectedProducts.includes(p.id));
      await onPublish(productsToPublish);
      setSelectedProducts([]);
      setSearchTerm("");
      setFilterCategory("all");
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProducts([]);
      setSearchTerm("");
      setFilterCategory("all");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-slate-800/95 backdrop-blur-sm rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-700">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-100">Add Products to Online Store</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product List */}
          <div className="px-6 py-4">
            {availableProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No products available</h3>
                <p className="text-slate-400">All your products are already published online</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No products found</h3>
                <p className="text-slate-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedProducts.length === filteredProducts.length
                          ? "bg-cyan-500 border-cyan-500"
                          : "border-slate-600"
                      }`}>
                        {selectedProducts.length === filteredProducts.length && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span>Select All ({filteredProducts.length})</span>
                    </button>
                  </div>
                  <span className="text-sm text-slate-400">
                    {selectedProducts.length} selected
                  </span>
                </div>

                {/* Product Grid */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProducts.includes(product.id)
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                      }`}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedProducts.includes(product.id)
                          ? "bg-cyan-500 border-cyan-500"
                          : "border-slate-600"
                      }`}>
                        {selectedProducts.includes(product.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-slate-100">{product.name}</h4>
                            <p className="text-sm text-slate-400">{product.category_name || "Uncategorized"}</p>
                            {product.details && (
                              <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                                {product.details}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-cyan-400">
                              ${product.sell_price || product.price || 0}
                            </p>
                            <p className="text-xs text-slate-400">
                              Stock: {product.stock || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={selectedProducts.length === 0 || isPublishing}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      <span>Publish Online</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
