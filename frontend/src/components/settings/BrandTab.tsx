'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface Brand {
  id: number;
  name: string;
  is_active: boolean;
}

interface BrandTabProps {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onDeleteClick: (brand: Brand) => void;
}

export default function BrandTab({ brands, setBrands, showNotification, loading, onDeleteClick }: BrandTabProps) {
  const [newBrand, setNewBrand] = useState('');

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;

    try {
      const response = await ApiService.createBrand({
        name: newBrand.trim(),
        is_active: true
      });

      const newBrandItem = response.brand;
      setBrands([...brands, newBrandItem]);
      setNewBrand('');
      showNotification('success', 'ব্র্যান্ড যোগ হয়ে গেছে!');
    } catch (error) {
      console.error('Error adding brand:', error);
      showNotification('error', error instanceof Error ? error.message : 'ব্র্যান্ড যোগ করা গেল না');
    }
  };

  const toggleBrand = async (id: number) => {
    try {
      await ApiService.toggleBrand(id);
      setBrands(brands.map(brand =>
        brand.id === id ? { ...brand, is_active: !brand.is_active } : brand
      ));
      const updatedBrand = brands.find(b => b.id === id);
      showNotification('success', `ব্র্যান্ড ${!updatedBrand?.is_active ? 'Active' : 'Inactive'} করা হয়েছে!`);
    } catch (error) {
      console.error('Error updating brand:', error);
      showNotification('error', error instanceof Error ? error.message : 'ব্র্যান্ড বদলানো গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const handleDeleteClick = (brand: Brand) => {
    onDeleteClick(brand);
  };

  return (
    <>
      <div className="plane-section">
        <div className="section-title">নতুন ব্র্যান্ড</div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            className="input"
            placeholder="ব্র্যান্ডের নাম"
            aria-label="ব্র্যান্ডের নাম"
            onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
          />
          <button
            onClick={handleAddBrand}
            disabled={loading || !newBrand.trim()}
            className="btn btn-primary sm:w-auto"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">ব্র্যান্ডের তালিকা</div>
        {brands.length === 0 ? (
          <div className="empty">এখনো কোনো ব্র্যান্ড নেই। উপরে থেকে প্রথমটা যোগ করুন।</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
              >
                <button
                  className={`badge ${brand.is_active ? 'badge-success' : 'badge-muted'}`}
                  onClick={() => toggleBrand(brand.id)}
                  title="Active/Inactive করতে চাপ দিন"
                >
                  {brand.is_active ? 'Active' : 'Inactive'}
                </button>
                <span className="whitespace-nowrap text-sm font-medium text-slate-900">{brand.name}</span>
                <button
                  onClick={() => handleDeleteClick(brand)}
                  className="text-slate-400 transition-colors hover:text-rose-600"
                  title="ব্র্যান্ড ডিলিট করুন"
                  aria-label="ব্র্যান্ড ডিলিট করুন"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
