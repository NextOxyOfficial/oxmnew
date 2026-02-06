'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Product as BackendProduct } from '@/types/product';
import { ApiService } from '@/lib/api';

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
  total_orders?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

interface ProductsTabProps {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function ProductsTab({
  formatCurrency,
  formatDate
}: ProductsTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductSupplier, setSelectedProductSupplier] = useState<string>('all');
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pagination state for server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const productsPerPage = 10;

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('ProductsTab: Fetching suppliers...');
        
        const suppliersData = await ApiService.getSuppliers();
        
        console.log('ProductsTab: Raw suppliers response:', suppliersData);
        
        const suppliersList = Array.isArray(suppliersData) ? suppliersData : suppliersData?.results || [];
        
        console.log('ProductsTab: Processed suppliers list:', suppliersList);
        
        setSuppliers(suppliersList);
      } catch (error) {
        console.error("ProductsTab: Error fetching suppliers:", error);
        setError(error instanceof Error ? error.message : "Failed to load suppliers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch products when supplier or page changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedProductSupplier === 'all') {
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
        return;
      }

      try {
        setIsLoadingProducts(true);
        setError(null);
        
        console.log('ProductsTab: Fetching products for supplier:', selectedProductSupplier, 'page:', currentPage);
        
        // Find supplier by name to get supplier ID
        const supplier = suppliers.find(s => s.name === selectedProductSupplier);
        if (!supplier) {
          console.error('Supplier not found:', selectedProductSupplier);
          return;
        }
        
        const productsData = await ApiService.getProducts({
          page: currentPage,
          page_size: productsPerPage,
          supplier: supplier.id.toString()
        });
        
        console.log('ProductsTab: Raw products response:', productsData);
        
        // Handle paginated response
        if (productsData && productsData.results) {
          setProducts(productsData.results);
          setTotalProducts(productsData.count || 0);
          setTotalPages(Math.ceil((productsData.count || 0) / productsPerPage));
        } else if (Array.isArray(productsData)) {
          // Fallback for non-paginated response
          setProducts(productsData);
          setTotalProducts(productsData.length);
          setTotalPages(Math.ceil(productsData.length / productsPerPage));
        } else {
          setProducts([]);
          setTotalProducts(0);
          setTotalPages(0);
        }
        
      } catch (error) {
        console.error("ProductsTab: Error fetching products:", error);
        setError(error instanceof Error ? error.message : "Failed to load products");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    if (selectedProductSupplier !== 'all' && suppliers.length > 0) {
      fetchProducts();
    }
  }, [selectedProductSupplier, currentPage, suppliers]);

  // Get unique suppliers from products that have suppliers (legacy - not used with server pagination)
  const getUniqueSuppliersFromProducts = (): string[] => {
    const supplierNames = products
      .filter(product => product.supplier_name)
      .map(product => product.supplier_name!)
      .filter(Boolean);
    return [...new Set(supplierNames)];
  };

  // Get current page products (server-side pagination - products are already filtered)
  const getCurrentPageProducts = (): BackendProduct[] => {
    return products; // Products are already paginated from server
  };

  // Calculate total value for a product based on stock and price
  const calculateProductValue = (product: BackendProduct): number => {
    const stock = product.has_variants ? (product.total_stock || 0) : product.stock;
    const price = product.has_variants 
      ? (product.average_sell_price || product.sell_price || product.price || 0)
      : (product.sell_price || product.price || 0);
    return stock * Number(price);
  };

  // Use all suppliers from the suppliers list instead of just those with products
  const filteredSuppliers = suppliers
    .filter(supplier => supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(supplier => supplier.name);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSupplierSelect = (supplier: string) => {
    setSelectedProductSupplier(supplier);
    setCurrentPage(1); // Reset to first page when supplier changes
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h4 className="text-base sm:text-lg font-medium text-slate-100 mb-4">Products</h4>
        {/* Filter by Supplier */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full min-w-0">
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              {/* ...existing dropdown code... */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:min-w-[200px] px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedProductSupplier === 'all' ? 'All Suppliers' : selectedProductSupplier}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-slate-700/50">
                    <input
                      type="text"
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleSupplierSelect('all')}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                        selectedProductSupplier === 'all' ? 'bg-slate-700/50 text-cyan-400' : 'text-slate-300'
                      }`}
                    >
                      All Suppliers
                    </button>
                    {filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier}
                        onClick={() => handleSupplierSelect(supplier)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors cursor-pointer truncate overflow-hidden whitespace-nowrap ${
                          selectedProductSupplier === supplier ? 'bg-slate-700/50 text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {supplier}
                      </button>
                    ))}
                    {filteredSuppliers.length === 0 && searchTerm && (
                      <div className="px-3 py-2 text-sm text-slate-400">
                        No suppliers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedProductSupplier !== 'all' && (
              <button
                onClick={() => setSelectedProductSupplier('all')}
                className="self-start sm:self-auto px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Results Summary - Under the filter row when supplier is selected */}
          {selectedProductSupplier !== 'all' && (
            <div className="text-sm text-slate-400 border-t border-slate-700/30 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="break-words">Showing {totalProducts} products for {selectedProductSupplier}</span>
                  <span className="text-cyan-400">
                    Total Value: {formatCurrency(products.reduce((sum: number, product: BackendProduct) => sum + calculateProductValue(product), 0))}
                  </span>
                </div>
                {totalPages > 1 && (
                  <span className="text-xs">
                    Page {currentPage} of {totalPages} ({products.length} shown)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Products List or Selection Message */}
        {selectedProductSupplier === 'all' ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-300 text-lg font-medium mb-2">Select a supplier to see their products</p>
            <p className="text-slate-400 text-sm">Choose a supplier from the dropdown above to view their product inventory</p>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading suppliers...</p>
              </div>
            ) : isLoadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-400 mb-4">
                  <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getCurrentPageProducts().map((product) => (
                  <div key={product.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 sm:p-4 hover:bg-slate-800/50 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Left side - Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h5 className="text-slate-100 font-medium text-sm truncate">{product.name}</h5>
                          <span className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded-md text-xs">
                            {product.category_name || 'No Category'}
                          </span>
                          {product.has_variants && (
                            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-md text-xs">
                              Has Variants
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Supplier</span>
                            <p className="text-slate-100 font-medium truncate">{product.supplier_name || 'No Supplier'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Unit Price</span>
                            <p className="text-slate-100 font-medium">
                              {formatCurrency(Number(product.has_variants 
                                ? (product.average_sell_price || product.sell_price || product.price || 0)
                                : (product.sell_price || product.price || 0)
                              ))}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Value</span>
                            <p className="text-cyan-300 font-medium">{formatCurrency(calculateProductValue(product))}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Updated</span>
                            <p className="text-slate-100 font-medium">{formatDate(product.updated_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Stock Badge */}
                      <div className="sm:ml-6 self-start sm:self-center">
                        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 px-3 py-2 rounded-lg text-center min-w-[80px]">
                          <div className="text-lg font-bold">
                            {product.has_variants ? (product.total_stock || 0) : product.stock}
                          </div>
                          <div className="text-xs text-cyan-400">in stock</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-700/30 pt-4 mt-6">
                    <div className="text-xs sm:text-sm text-slate-400">
                      Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoadingProducts}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1 || isLoadingProducts
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 flex-nowrap">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage = page === 1 || 
                                         page === totalPages || 
                                         Math.abs(page - currentPage) <= 1;
                          
                          if (!showPage) {
                            // Show ellipsis for gaps
                            if (page === 2 && currentPage > 4) return <span key={page} className="text-slate-500 px-2">...</span>;
                            if (page === totalPages - 1 && currentPage < totalPages - 3) return <span key={page} className="text-slate-500 px-2">...</span>;
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              disabled={isLoadingProducts}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-cyan-600 text-white'
                                  : isLoadingProducts
                                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoadingProducts}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages || isLoadingProducts
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Empty State for when supplier is selected but no products found */}
                {products.length === 0 && !isLoadingProducts && (
                  <div className="text-center py-8">
                    <div className="text-slate-400 mb-2">
                      <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-sm">
                      No products found for {selectedProductSupplier}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
