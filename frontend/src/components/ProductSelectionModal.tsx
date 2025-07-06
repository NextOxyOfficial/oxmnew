"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { X, Package, ShoppingCart } from "lucide-react";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onPublish: (product: Product) => void;
  publishedProductIds: number[];
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  onPublish,
  publishedProductIds
}: ProductSelectionModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter out already published products
  const availableProducts = products.filter(
    product => !publishedProductIds.includes(product.id)
  );

  const selectedProduct = availableProducts.find(p => p.id === selectedProductId);

  const handlePublish = async (product: Product) => {
    setIsPublishing(true);
    try {
      await onPublish(product);
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProductId(null);
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

          {/* Product Selection */}
          <div className="px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={selectedProductId || ""}
                  onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select a product to publish...</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.sell_price || product.price || 0}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (selectedProduct) {
                    handlePublish(selectedProduct);
                  }
                }}
                disabled={isPublishing || !selectedProduct}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Publish</span>
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="px-6 py-4">
            {!selectedProduct ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Select a product</h3>
                <p className="text-sm text-slate-400">Choose a product from the dropdown to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-100 text-lg mb-2">{selectedProduct.name}</h4>
                      <p className="text-sm text-slate-400 mb-2">{selectedProduct.category_name || "Uncategorized"}</p>
                      {selectedProduct.details && (
                        <p className="text-sm text-slate-300 mb-4">{selectedProduct.details}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-cyan-400">
                            ${selectedProduct.sell_price || selectedProduct.price || 0}
                          </p>
                          <p className="text-xs text-slate-400">
                            Stock: {selectedProduct.stock || 0}
                          </p>
                        </div>
                        <button
                          onClick={() => handlePublish(selectedProduct)}
                          disabled={isPublishing}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPublishing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              <span>Publish to Store</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
