'use client';

import React, { useState, useEffect } from 'react';
import FilterSelect from "@/components/ui/FilterSelect";
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
  const [selectedProductSupplier, setSelectedProductSupplier] = useState<string>('all');
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(error instanceof Error ? error.message : "সাপ্লায়ারের তালিকা আনা যায়নি");
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
        setError(error instanceof Error ? error.message : "প্রোডাক্টের তালিকা আনা যায়নি");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    if (selectedProductSupplier !== 'all' && suppliers.length > 0) {
      fetchProducts();
    }
  }, [selectedProductSupplier, currentPage, suppliers]);

  // Get unique suppliers from products that have suppliers (legacy - not used with server pagination)

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

  const handleSupplierSelect = (supplier: string) => {
    setSelectedProductSupplier(supplier);
    setCurrentPage(1); // Reset to first page when supplier changes
  };

  return (
    <>
      {/* Supplier filter */}
      <div className="plane-section">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={selectedProductSupplier}
            options={suppliers.map((supplier) => supplier.name)}
            onChange={handleSupplierSelect}
            allLabel="সব সাপ্লায়ার"
            placeholder="সাপ্লায়ার খুঁজুন…"
            label="সাপ্লায়ার বেছে নিন"
          />

          {selectedProductSupplier !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedProductSupplier('all')}
              className="btn btn-ghost"
            >
              ফিল্টার সরান
            </button>
          )}
        </div>
      </div>

      {/* Summary figures for the selected supplier */}
      {selectedProductSupplier !== 'all' && (
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">সাপ্লায়ার</div>
            <div className="stat-value truncate" title={selectedProductSupplier}>
              {selectedProductSupplier}
            </div>
            <div className="stat-meta">এখন যেটা দেখছেন</div>
          </div>
          <div className="stat">
            <div className="stat-label">মোট প্রোডাক্ট</div>
            <div className="stat-value num">{totalProducts}</div>
            <div className="stat-meta">{products.length} টা এই পাতায়</div>
          </div>
          <div className="stat">
            <div className="stat-label">স্টকের মোট দাম</div>
            <div className="stat-value num">
              {formatCurrency(products.reduce((sum: number, product: BackendProduct) => sum + calculateProductValue(product), 0))}
            </div>
            <div className="stat-meta">এই পাতার প্রোডাক্ট মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">পাতা</div>
            <div className="stat-value num">
              {currentPage} / {totalPages || 1}
            </div>
            <div className="stat-meta">প্রতি পাতায় {productsPerPage} টা</div>
          </div>
        </div>
      )}

      {/* Products list or selection message */}
      {selectedProductSupplier === 'all' ? (
        <div className="empty">
          <p className="text-slate-600">সাপ্লায়ার বেছে নিলে তার প্রোডাক্টগুলো দেখতে পাবেন</p>
          <p className="mt-1 text-slate-500">উপরের তালিকা থেকে একজন সাপ্লায়ার বেছে নিন</p>
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="empty">সাপ্লায়ার লোড হচ্ছে…</div>
          ) : isLoadingProducts ? (
            <div className="empty">প্রোডাক্ট লোড হচ্ছে…</div>
          ) : error ? (
            <div className="empty">
              <p className="text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-ghost mt-3"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>প্রোডাক্ট</th>
                      <th>সাপ্লায়ার</th>
                      <th className="cell-num">দাম</th>
                      <th className="cell-num">স্টক</th>
                      <th className="cell-num">মোট দাম</th>
                      <th>আপডেট</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty">
                            {selectedProductSupplier} এর কোনো প্রোডাক্ট পাওয়া যায়নি
                          </div>
                        </td>
                      </tr>
                    ) : (
                      getCurrentPageProducts().map((product) => (
                        <tr key={product.id}>
                          <td className="cell-strong">
                            <div className="truncate max-w-[16rem]" title={product.name}>
                              {product.name}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <span className="badge badge-muted">
                                {product.category_name || 'ক্যাটাগরি নেই'}
                              </span>
                              {product.has_variants && (
                                <span className="badge badge-info">ভ্যারিয়েন্ট আছে</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="truncate max-w-[12rem]" title={product.supplier_name || ''}>
                              {product.supplier_name || 'সাপ্লায়ার নেই'}
                            </div>
                          </td>
                          <td className="cell-num">
                            {formatCurrency(Number(product.has_variants
                              ? (product.average_sell_price || product.sell_price || product.price || 0)
                              : (product.sell_price || product.price || 0)
                            ))}
                          </td>
                          <td className="cell-num">
                            {product.has_variants ? (product.total_stock || 0) : product.stock}
                          </td>
                          <td className="cell-num">{formatCurrency(calculateProductValue(product))}</td>
                          <td>{formatDate(product.updated_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="plane-section">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      {totalProducts} টার মধ্যে {((currentPage - 1) * productsPerPage) + 1} থেকে {Math.min(currentPage * productsPerPage, totalProducts)} নম্বর প্রোডাক্ট দেখাচ্ছে
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      {/* Previous Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoadingProducts}
                        className="btn btn-ghost btn-sm"
                      >
                        আগের
                      </button>

                      {/* Page Numbers */}
                      <div className="flex flex-nowrap items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage = page === 1 ||
                                         page === totalPages ||
                                         Math.abs(page - currentPage) <= 1;

                          if (!showPage) {
                            // Show ellipsis for gaps
                            if (page === 2 && currentPage > 4) return <span key={page} className="px-2 text-slate-500">...</span>;
                            if (page === totalPages - 1 && currentPage < totalPages - 3) return <span key={page} className="px-2 text-slate-500">...</span>;
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              disabled={isLoadingProducts}
                              className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoadingProducts}
                        className="btn btn-ghost btn-sm"
                      >
                        পরের
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
